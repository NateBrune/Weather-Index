
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
      WITH active_stations AS (
        SELECT DISTINCT s.station_id
        FROM stations s
        JOIN observations o ON s.station_id = o.station_id
        WHERE o.observation_timestamp >= NOW() - INTERVAL '1 hour'
          AND o.data_quality_score >= 0.8
          AND o.temperature BETWEEN -50 AND 50
      ),
      recent_temps AS (
        SELECT o.temperature
        FROM observations o
        JOIN active_stations a ON o.station_id = a.station_id
        WHERE o.observation_timestamp >= NOW() - INTERVAL '1 hour'
          AND o.data_quality_score >= 0.8
          AND o.temperature BETWEEN -50 AND 50
      )
      SELECT 
        (SELECT COUNT(*) FROM active_stations) as station_count,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY temperature) as median_temperature
      FROM recent_temps;
    `;

    const result = await client.query(query);
    client.release();
    return json(result.rows[0]);
  } catch (err) {
    console.error("Database query failed:", err);
    return json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
