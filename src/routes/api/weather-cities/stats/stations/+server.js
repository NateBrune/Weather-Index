
import { json } from "@sveltejs/kit";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export async function GET({ url }) {
  try {
    const client = await pool.connect();
    const timeRange = url.searchParams.get("timeRange") || "24h";
    
    let interval;
    switch(timeRange) {
      case "7d":
        interval = "1 hour";
        break;
      case "30d":
        interval = "4 hours";
        break;
      default:
        interval = "30 minutes";
    }

    const query = `
      WITH time_series AS (
        SELECT 
          date_trunc($1, observation_timestamp) as time_bucket,
          COUNT(DISTINCT station_id) as active_stations,
          COUNT(DISTINCT CASE WHEN data_quality_score >= 0.8 THEN station_id END) as quality_stations
        FROM observations 
        WHERE observation_timestamp >= NOW() - INTERVAL '1 ' || $2
        GROUP BY time_bucket
        ORDER BY time_bucket ASC
      )
      SELECT 
        time_bucket as timestamp,
        active_stations,
        quality_stations
      FROM time_series;
    `;

    const result = await client.query(query, [interval, timeRange]);
    client.release();
    
    return json(result.rows);
  } catch (err) {
    console.error("Database query failed:", err);
    return json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
