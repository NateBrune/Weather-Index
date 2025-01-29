import { json } from "@sveltejs/kit";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export async function GET() {
  try {
    const client = await pool.connect();
    const query = `
      WITH hourly_data AS (
        SELECT 
          DATE_TRUNC('hour', observation_timestamp) as hour,
          COUNT(DISTINCT station_id) as active_stations,
          COUNT(DISTINCT CASE WHEN data_quality_score >= 0.8 THEN station_id END) as quality_stations,
          ROUND(AVG(temperature)::numeric, 2) as avg_temp,
          ROUND(AVG(humidity)::numeric, 2) as avg_humidity,
          ROUND(AVG(wind_speed)::numeric, 2) as avg_wind
        FROM observations
        WHERE observation_timestamp >= NOW() - INTERVAL '24 hours'
        GROUP BY DATE_TRUNC('hour', observation_timestamp)
        ORDER BY hour ASC
      ),
      quality_stats AS (
        SELECT 
          COUNT(DISTINCT s.station_id) as total_stations,
          COUNT(DISTINCT CASE WHEN o.data_quality_score >= 0.8 THEN s.station_id END) as high_quality_stations,
          CAST(AVG(o.data_quality_score) * 100 AS DECIMAL(5,2)) as avg_quality_percentage
        FROM stations s
        LEFT JOIN observations o ON s.station_id = o.station_id
        WHERE o.data_quality_score IS NOT NULL
      ),
      hourly_temps AS (
        SELECT 
          date_trunc('hour', o.observation_timestamp) as hour,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.temperature) as temperature
        FROM observations o
        WHERE o.observation_timestamp >= NOW() - INTERVAL '24 hours'
          AND o.data_quality_score >= 0.8
          AND o.temperature BETWEEN -50 AND 50
        GROUP BY hour
        ORDER BY hour ASC
      )
      SELECT 
        qs.total_stations as station_count,
        qs.high_quality_stations,
        qs.avg_quality_percentage,
        ROUND(CAST((SELECT temperature FROM hourly_temps ORDER BY hour DESC LIMIT 1) AS DECIMAL(5,2)), 2) as median_temperature,
        (
          SELECT json_agg(json_build_object(
            'temperature', temperature,
            'timestamp', hour
          ) ORDER BY hour)
          FROM hourly_temps
        ) as sparkline_data,
        (
          SELECT json_agg(json_build_object(
            'timestamp', hour,
            'count', active_stations,
            'quality_count', quality_stations
          ) ORDER BY hour)
          FROM hourly_data
        ) as station_count_history
      FROM quality_stats qs
      LIMIT 1;

      WITH hourly_temps AS (
        SELECT 
          CASE 
            WHEN $1 = 'city' THEN g.city
            WHEN $1 = 'state' THEN COALESCE(g.state, 'Unknown')
            ELSE COALESCE(g.country, 'Unknown')
          END as location_name,
          date_trunc('hour', o.observation_timestamp) as hour,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.temperature) as temperature
        FROM stations s
        JOIN geocodes g ON s.latitude = g.latitude AND s.longitude = g.longitude
        JOIN observations o ON s.station_id = o.station_id
        WHERE o.observation_timestamp >= NOW() - INTERVAL '2 hours'
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
      temp_changes AS (
        SELECT 
          location_name,
          ROUND(CAST((last_temp - first_temp) AS DECIMAL(10,2)), 2) as temp_change
        FROM (
          SELECT 
            location_name,
            FIRST_VALUE(temperature) OVER (PARTITION BY location_name ORDER BY hour ASC) as first_temp,
            FIRST_VALUE(temperature) OVER (PARTITION BY location_name ORDER BY hour DESC) as last_temp
          FROM hourly_temps
        ) subq
        WHERE last_temp IS NOT NULL AND first_temp IS NOT NULL
      )
      SELECT 
        location_name,
        temp_change
      FROM temp_changes
      ORDER BY temp_change DESC
      LIMIT 3;
    `;

    const result = await client.query(query);
    client.release();
    return json(result.rows[0]);
  } catch (err) {
    console.error("Database query failed:", err);
    return json({ error: "Failed to fetch data" }, { status: 500 });
  }
}