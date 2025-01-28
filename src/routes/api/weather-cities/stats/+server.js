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
      WITH quality_stats AS (
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
      ),
      current_temp AS (
        SELECT 
          curr.temp as current_temp,
          curr.temp - hour_ago.temp as temp_change_1h,
          curr.temp - day_ago.temp as temp_change_24h,
          curr.temp - week_ago.temp as temp_change_7d
        FROM (
          SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY temperature) as temp
          FROM observations o
          WHERE o.observation_timestamp >= NOW() - INTERVAL '1 hour'
            AND o.data_quality_score >= 0.8
            AND o.temperature BETWEEN -50 AND 50
        ) curr
        CROSS JOIN (
          SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY temperature) as temp
          FROM observations o
          WHERE o.observation_timestamp BETWEEN NOW() - INTERVAL '2 hour' AND NOW() - INTERVAL '1 hour'
            AND o.data_quality_score >= 0.8
            AND o.temperature BETWEEN -50 AND 50
        ) hour_ago
        CROSS JOIN (
          SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY temperature) as temp
          FROM observations o
          WHERE o.observation_timestamp BETWEEN NOW() - INTERVAL '25 hour' AND NOW() - INTERVAL '24 hour'
            AND o.data_quality_score >= 0.8
            AND o.temperature BETWEEN -50 AND 50
        ) day_ago
        CROSS JOIN (
          SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY temperature) as temp
          FROM observations o
          WHERE o.observation_timestamp BETWEEN NOW() - INTERVAL '8 day' AND NOW() - INTERVAL '7 day'
            AND o.data_quality_score >= 0.8
            AND o.temperature BETWEEN -50 AND 50
        ) week_ago
        ORDER BY date_trunc('hour', observation_timestamp) DESC
        LIMIT 1
      )
      SELECT 
        qs.total_stations as station_count,
        qs.high_quality_stations,
        qs.avg_quality_percentage,
        ct.current_temp as median_temperature,
        ct.temp_change_24h,
        (SELECT json_agg(json_build_object(
          'temperature', temperature,
          'timestamp', hour
        ) ORDER BY hour)
        FROM hourly_temps) as sparkline_data
      FROM quality_stats qs
      CROSS JOIN current_temp ct
      GROUP BY qs.total_stations, qs.high_quality_stations, qs.avg_quality_percentage, ct.current_temp, ct.temp_change_24h
      LIMIT 1;
    `;

    const result = await client.query(query);
    client.release();
    return json(result.rows[0]);
  } catch (err) {
    console.error("Database query failed:", err);
    return json({ error: "Failed to fetch data" }, { status: 500 });
  }
}