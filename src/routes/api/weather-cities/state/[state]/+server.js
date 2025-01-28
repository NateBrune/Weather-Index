
import { json } from "@sveltejs/kit";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export async function GET({ params, url }) {
  try {
    const client = await pool.connect();
    const timescale = url.searchParams.get("timescale") || "daily";

    let timeInterval;
    let timeRange;
    switch (timescale) {
      case "hourly": timeInterval = "hour"; timeRange = "1 days"; break;
      case "daily": timeInterval = "hour"; timeRange = "7 days"; break;
      case "weekly": timeInterval = "day"; timeRange = "30 days"; break;
      case "monthly": timeInterval = "week"; timeRange = "1 year"; break;
      case "yearly": timeInterval = "month"; timeRange = "10 years"; break;
      default: timeInterval = "day"; timeRange = "7 days";
    }

    const query = `
      WITH time_aggregated AS (
        SELECT 
          date_trunc($1, o.observation_timestamp) as timestamp_interval,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.temperature) as temperature
        FROM stations s
        JOIN geocodes g ON s.latitude = g.latitude AND s.longitude = g.longitude
        JOIN observations o ON s.station_id = o.station_id
        WHERE g.state = $2
          AND o.temperature BETWEEN -50 AND 50
          AND o.data_quality_score >= 0.8
          AND o.observation_timestamp >= NOW() - INTERVAL $3
        GROUP BY timestamp_interval
        ORDER BY timestamp_interval DESC
      )
      SELECT temperature, timestamp_interval as observation_timestamp
      FROM time_aggregated
      ORDER BY observation_timestamp ASC;
    `;

    const result = await client.query(query, [timeInterval, params.state, timeRange]);
    client.release();
    return json(result.rows);
  } catch (err) {
    console.error("Database query failed:", err);
    return json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
