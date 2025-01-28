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
          date_trunc('hour', observation_timestamp) as hour,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY temperature) as temperature
        FROM observations
        WHERE observation_timestamp >= NOW() - INTERVAL '24 hours'
          AND data_quality_score >= 0.8
          AND temperature BETWEEN -50 AND 50
        GROUP BY hour
        ORDER BY hour ASC
      ),
      hourly_temps AS (
        SELECT 
          date_trunc('hour', observation_timestamp) as hour,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY temperature) as temp
        FROM observations 
        WHERE observation_timestamp >= NOW() - INTERVAL '7 days'
          AND data_quality_score >= 0.8
          AND temperature BETWEEN -50 AND 50
          AND temperature IS NOT NULL
        GROUP BY date_trunc('hour', observation_timestamp)
      ),
      current_temp AS (
        SELECT 
          first.temp as current_temp,
          first.temp - lag1h.temp as temp_change_1h,
          first.temp - lag24h.temp as temp_change_24h,
          first.temp - lag7d.temp as temp_change_7d
        FROM (
          SELECT temp, hour
          FROM hourly_temps
          ORDER BY hour DESC
          LIMIT 1
        ) first
        LEFT JOIN hourly_temps lag1h ON lag1h.hour = first.hour - INTERVAL '1 hour'
        LEFT JOIN hourly_temps lag24h ON lag24h.hour = first.hour - INTERVAL '24 hours'
        LEFT JOIN hourly_temps lag7d ON lag7d.hour = first.hour - INTERVAL '7 days'
      )
      SELECT 
        qs.total_stations as station_count,
        qs.high_quality_stations,
        qs.avg_quality_percentage,
        ct.current_temp as median_temperature,
        ct.temp_change_1h,
        ct.temp_change_24h,
        ct.temp_change_7d,
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