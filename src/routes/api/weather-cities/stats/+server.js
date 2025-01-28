
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
      current_median AS (
        SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY temperature) as median_temperature
        FROM observations
        WHERE observation_timestamp >= NOW() - INTERVAL '1 hour'
          AND data_quality_score >= 0.8
          AND temperature BETWEEN -50 AND 50
      )
      SELECT 
        qs.total_stations as station_count,
        qs.high_quality_stations,
        qs.avg_quality_percentage,
        cm.median_temperature,
        COALESCE(
          FIRST_VALUE(ht.temperature) OVER (ORDER BY ht.hour DESC) -
          FIRST_VALUE(ht.temperature) OVER (ORDER BY ht.hour ASC),
          0
        ) as temp_change_24h,
        (SELECT json_agg(json_build_object(
          'temperature', temperature,
          'timestamp', hour
        ))
        FROM hourly_temps) as sparkline_data
      FROM quality_stats qs, current_median cm
      CROSS JOIN LATERAL (SELECT * FROM hourly_temps) ht
      GROUP BY qs.total_stations, qs.high_quality_stations, qs.avg_quality_percentage, cm.median_temperature;
    `;

    const result = await client.query(query);
    client.release();
    return json(result.rows[0]);
  } catch (err) {
    console.error("Database query failed:", err);
    return json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
