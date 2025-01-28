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
      WITH recent_temps AS (
        SELECT 
          CASE 
            WHEN $1 = 'city' THEN g.city
            WHEN $1 = 'state' THEN COALESCE(g.state, 'Unknown')
            ELSE COALESCE(g.country, 'Unknown')
          END as location_name,
          o.temperature,
          o.observation_timestamp,
          FIRST_VALUE(o.temperature) OVER (PARTITION BY 
            CASE 
              WHEN $1 = 'city' THEN g.city
              WHEN $1 = 'state' THEN COALESCE(g.state, 'Unknown')
              ELSE COALESCE(g.country, 'Unknown')
            END
            ORDER BY o.observation_timestamp DESC) - 
          FIRST_VALUE(o.temperature) OVER (PARTITION BY 
            CASE 
              WHEN $1 = 'city' THEN g.city
              WHEN $1 = 'state' THEN COALESCE(g.state, 'Unknown')
              ELSE COALESCE(g.country, 'Unknown')
            END
            ORDER BY o.observation_timestamp ASC) as temp_change_24h,
          FIRST_VALUE(o.temperature) OVER (PARTITION BY location_name ORDER BY o.observation_timestamp DESC) - 
          FIRST_VALUE(o.temperature) OVER (PARTITION BY location_name ORDER BY o.observation_timestamp DESC OFFSET '1 hour') as temp_change_1h,
          FIRST_VALUE(o.temperature) OVER (PARTITION BY location_name ORDER BY o.observation_timestamp DESC) - 
          FIRST_VALUE(o.temperature) OVER (PARTITION BY location_name ORDER BY o.observation_timestamp DESC OFFSET '7 days') as temp_change_7d
        FROM stations s
        JOIN geocodes g ON s.latitude = g.latitude AND s.longitude = g.longitude
        JOIN observations o ON s.station_id = o.station_id
        WHERE o.observation_timestamp >= NOW() - INTERVAL '24 hours'
          AND o.temperature BETWEEN -50 AND 50
          AND o.data_quality_score >= 0.8
      ),
      sparklines AS (
        SELECT 
          location_name,
          json_agg(json_build_object(
            'temperature', temperature,
            'timestamp', observation_timestamp
          ) ORDER BY observation_timestamp) FILTER (WHERE temperature IS NOT NULL) as sparkline_data
        FROM (
          SELECT DISTINCT ON (location_name, date_trunc('hour', observation_timestamp))
            location_name, temperature, observation_timestamp
          FROM recent_temps
        ) hourly
        GROUP BY location_name
      ),
      grouped_stations AS (
        SELECT 
          CASE 
            WHEN $1 = 'city' THEN g.city
            WHEN $1 = 'state' THEN COALESCE(g.state, 'Unknown')
            ELSE COALESCE(g.country, 'Unknown')
          END as location_name,
          COUNT(DISTINCT s.station_id) AS station_count,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.temperature) as median_temperature,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.wind_speed) as median_wind_speed,
          mode() WITHIN GROUP (ORDER BY o.weather_icon) as weather_icon
        FROM stations s
        JOIN geocodes g ON s.latitude = g.latitude AND s.longitude = g.longitude
        LEFT JOIN observations o ON s.station_id = o.station_id
        WHERE o.temperature IS NOT NULL
          AND o.temperature BETWEEN -50 AND 50
          AND o.data_quality_score >= 0.8
          AND CASE 
            WHEN $1 = 'city' THEN g.city != 'Unknown'
            WHEN $1 = 'state' THEN g.state IS NOT NULL AND g.state != 'Unknown'
            ELSE g.country IS NOT NULL
          END
        GROUP BY location_name
        HAVING COUNT(DISTINCT s.station_id) > 0
      )
      SELECT DISTINCT ON (g.location_name)
        g.location_name,
        g.station_count,
        ROUND(g.median_temperature::numeric, 2) as median_temperature,
        COALESCE(ROUND(g.median_wind_speed::numeric, 2), 0)::float as median_wind_speed,
        g.weather_icon,
        s.sparkline_data,
        ROUND(r.temp_change_24h::numeric, 1) as temp_change_24h
      FROM grouped_stations g
      LEFT JOIN sparklines s ON g.location_name = s.location_name
      LEFT JOIN recent_temps r ON g.location_name = r.location_name
      ORDER BY g.location_name, g.station_count DESC;
    `;

    const result = await client.query(query, [groupBy]);
    client.release();

    return json(result.rows);
  } catch (err) {
    console.error("Database query failed:", err);
    return json({ error: "Failed to fetch data" }, { status: 500 });
  }
}