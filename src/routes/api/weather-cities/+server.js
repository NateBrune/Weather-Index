import { json } from "@sveltejs/kit";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

export async function GET({ url }) {
  try {
    const client = await pool.connect();
    const groupBy = url.searchParams.get("groupBy") || "city";

    const query = `
      WITH hourly_stats AS (
        SELECT 
          CASE 
            WHEN $1 = 'city' THEN g.city
            WHEN $1 = 'state' THEN COALESCE(g.state, 'Unknown')
            ELSE COALESCE(g.country, 'Unknown')
          END as location_name,
          date_trunc('hour', o.observation_timestamp) as hour,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.temperature) as temperature,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.wind_speed) as wind_speed
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
      ),
      location_stats AS (
        SELECT 
          h.location_name,
          COUNT(DISTINCT s.station_id) AS station_count,
          FIRST_VALUE(h.temperature) OVER (PARTITION BY h.location_name ORDER BY h.hour DESC) as median_temperature,
          FIRST_VALUE(h.wind_speed) OVER (PARTITION BY h.location_name ORDER BY h.hour DESC) as median_wind_speed,
          FIRST_VALUE(h.temperature) OVER (PARTITION BY h.location_name ORDER BY h.hour DESC) - 
            LAG(h.temperature, 1) OVER (PARTITION BY h.location_name ORDER BY h.hour) as temp_change_1h,
          FIRST_VALUE(h.temperature) OVER (PARTITION BY h.location_name ORDER BY h.hour DESC) - 
            LAG(h.temperature, 24) OVER (PARTITION BY h.location_name ORDER BY h.hour) as temp_change_24h,
          FIRST_VALUE(h.temperature) OVER (PARTITION BY h.location_name ORDER BY h.hour DESC) - 
            LAG(h.temperature, 168) OVER (PARTITION BY h.location_name ORDER BY h.hour) as temp_change_7d,
          mode() WITHIN GROUP (ORDER BY o.weather_icon) as weather_icon
        FROM hourly_stats h
        JOIN stations s
          JOIN geocodes g ON s.latitude = g.latitude AND s.longitude = g.longitude
        JOIN observations o ON s.station_id = o.station_id AND date_trunc('hour', o.observation_timestamp) = h.hour
        GROUP BY h.location_name
        HAVING COUNT(DISTINCT s.station_id) > 0
      ),
      sparkline_data AS (
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
      )
      SELECT 
        l.location_name,
        l.station_count,
        ROUND(l.median_temperature::numeric, 2) as median_temperature,
        COALESCE(ROUND(l.median_wind_speed::numeric, 2), 0)::float as median_wind_speed,
        l.weather_icon,
        s.hourly_data as sparkline_data
      FROM location_stats l
      LEFT JOIN sparkline_data s ON l.location_name = s.location_name
      ORDER BY l.station_count DESC;
    `;

    const result = await client.query(query, [groupBy]);
    client.release();

    return json(result.rows);
  } catch (err) {
    console.error("Database query failed:", err);
    return json({ error: "Failed to fetch data" }, { status: 500 });
  }
}