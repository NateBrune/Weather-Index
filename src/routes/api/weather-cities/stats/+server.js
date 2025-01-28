
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
      recent_temps AS (
        SELECT o.temperature, o.observation_timestamp
        FROM observations o
        WHERE o.observation_timestamp >= NOW() - INTERVAL '1 hour'
          AND o.data_quality_score >= 0.8
          AND o.temperature BETWEEN -50 AND 50
      ),
      hourly_temps AS (
        SELECT 
          date_trunc('hour', observation_timestamp) as hour,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY temperature) as temperature
        FROM recent_temps
        GROUP BY hour
        ORDER BY hour DESC
        LIMIT 24
      )
      SELECT 
        qs.total_stations as station_count,
        qs.high_quality_stations,
        qs.avg_quality_percentage,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY temperature) as median_temperature,
        (SELECT json_agg(json_build_object(
          'temperature', temperature,
          'timestamp', hour
        ) ORDER BY hour)
        FROM hourly_temps) as sparkline_data
      FROM quality_stats qs, recent_temps
      GROUP BY qs.total_stations, qs.high_quality_stations, qs.avg_quality_percentage
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
