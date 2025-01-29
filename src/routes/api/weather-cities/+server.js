import { json } from "@sveltejs/kit";
import pg from "pg";

const { Pool } = pg;
import { apiCache } from "$lib/cache";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

export async function GET({ url }) {
  try {
    const groupBy = url.searchParams.get("groupBy") || "city";
    const cacheKey = `weather-cities-${groupBy}`;

    // Check cache first
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) {
      return json(cachedData);
    }

    const client = await pool.connect();

    // Subquery 1: Hourly Stats
    const hourlyStatsQuery = `
      SELECT 
        CASE 
          WHEN $1 = 'city' THEN g.city
          WHEN $1 = 'state' THEN COALESCE(g.state, 'Unknown')
          ELSE COALESCE(g.country, 'Unknown')
        END AS location_name,
        date_trunc('hour', o.observation_timestamp) AS hour,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.temperature) AS temperature,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.wind_speed) AS wind_speed
      FROM stations s
      JOIN geocodes g ON s.latitude = g.latitude AND s.longitude = g.longitude
      JOIN observations o ON s.station_id = o.station_id
      WHERE o.observation_timestamp >= NOW() - INTERVAL '7 days'
        AND (
          CASE 
            WHEN $1 = 'city' THEN g.city
            WHEN $1 = 'state' THEN g.state
            ELSE g.country
          END
        ) IS NOT NULL
        AND o.data_quality_score >= 0.8
        AND o.temperature BETWEEN -50 AND 50
      GROUP BY 
        CASE 
          WHEN $1 = 'city' THEN g.city
          WHEN $1 = 'state' THEN COALESCE(g.state, 'Unknown')
          ELSE COALESCE(g.country, 'Unknown')
        END,
        date_trunc('hour', o.observation_timestamp)
    `;

    // Subquery 2: Location Stats
    const locationStatsQuery = `
      SELECT 
        h.location_name,
        COUNT(DISTINCT s.station_id) AS station_count,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY h.temperature) AS median_temperature,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY h.wind_speed) AS median_wind_speed,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY h.temperature) - LAG(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY h.temperature), 1) OVER (PARTITION BY h.location_name ORDER BY h.hour) AS temp_change_1h,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY h.temperature) - LAG(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY h.temperature), 24) OVER (PARTITION BY h.location_name ORDER BY h.hour) AS temp_change_24h,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY h.temperature) - LAG(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY h.temperature), 168) OVER (PARTITION BY h.location_name ORDER BY h.hour) AS temp_change_7d
      FROM (${hourlyStatsQuery}) h
      LEFT JOIN stations s ON (
        CASE 
          WHEN $1 = 'city' THEN s.city = h.location_name
          WHEN $1 = 'state' THEN s.state = h.location_name
          ELSE s.country = h.location_name
        END
      )
      GROUP BY h.location_name
    `;

    // Subquery 3: Weather Icons
    const weatherIconsQuery = `
      SELECT 
        CASE 
          WHEN $1 = 'city' THEN g.city
          WHEN $1 = 'state' THEN COALESCE(g.state, 'Unknown')
          ELSE COALESCE(g.country, 'Unknown')
        END as location_name,
        mode() WITHIN GROUP (ORDER BY o.weather_icon) as weather_icon
      FROM stations s
      JOIN geocodes g ON s.latitude = g.latitude AND s.longitude = g.longitude
      JOIN observations o ON s.station_id = o.station_id
      WHERE o.observation_timestamp >= NOW() - INTERVAL '7 days'
      GROUP BY 
        CASE 
          WHEN $1 = 'city' THEN g.city
          WHEN $1 = 'state' THEN COALESCE(g.state, 'Unknown')
          ELSE COALESCE(g.country, 'Unknown')
        END
    `;

    // Subquery 4: Sparkline Data
    const sparklineDataQuery = `
      SELECT 
        location_name,
        json_agg(
          json_build_object(
            'temperature', median_temp,
            'timestamp', hour
          ) ORDER BY hour
        ) as hourly_data
      FROM (
        SELECT 
          CASE 
            WHEN $1 = 'city' THEN g.city
            WHEN $1 = 'state' THEN COALESCE(g.state, 'Unknown')
            ELSE COALESCE(g.country, 'Unknown')
          END as location_name,
          date_trunc('hour', o.observation_timestamp) as hour,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.temperature) as median_temp
        FROM stations s
        JOIN geocodes g ON s.latitude = g.latitude AND s.longitude = g.longitude
        JOIN observations o ON s.station_id = o.station_id
        WHERE o.observation_timestamp >= NOW() - INTERVAL '24 hours'
          AND o.data_quality_score >= 0.8
          AND o.temperature BETWEEN -50 AND 50
        GROUP BY 
          CASE 
            WHEN $1 = 'city' THEN g.city
            WHEN $1 = 'state' THEN COALESCE(g.state, 'Unknown')
            ELSE COALESCE(g.country, 'Unknown')
          END,
          date_trunc('hour', o.observation_timestamp)
      ) hourly
      GROUP BY location_name
    `;

    // Final Query to combine all the subqueries
    const finalQuery = `
      SELECT 
        l.location_name,
        l.station_count,
        ROUND(l.median_temperature::numeric, 2) as median_temperature,
        COALESCE(ROUND(l.median_wind_speed::numeric, 2), 0)::float as median_wind_speed,
        w.weather_icon,
        s.hourly_data as sparkline_data
      FROM (${locationStatsQuery}) l
      LEFT JOIN (${weatherIconsQuery}) w ON l.location_name = w.location_name
      LEFT JOIN (${sparklineDataQuery}) s ON l.location_name = s.location_name
      WHERE l.location_name != 'Unknown'
      ORDER BY l.station_count DESC
    `;

    const result = await client.query(finalQuery, [groupBy]);
    client.release();

    // Cache the result
    apiCache.set(cacheKey, result.rows);
    return json(result.rows);
  } catch (err) {
    console.error("Database query failed:", err);
    return json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
