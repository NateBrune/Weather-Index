import { json } from "@sveltejs/kit";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

export async function GET({ params, url }) {
  try {
    const client = await pool.connect();
    const timescale = url.searchParams.get('timescale') || 'daily';

    let timeInterval;
    switch(timescale) {
      case 'yearly':
        timeInterval = "date_trunc('year', observation_timestamp)";
        break;
      case 'monthly':
        timeInterval = "date_trunc('month', observation_timestamp)";
        break;
      case 'weekly':
        timeInterval = "date_trunc('week', observation_timestamp)";
        break;
      case 'hourly':
        timeInterval = "date_trunc('hour', observation_timestamp)";
        break;
      default: // daily
        timeInterval = "date_trunc('day', observation_timestamp)";
    }

    const query = `
      WITH time_aggregated AS (
        SELECT 
          ${timeInterval} as timestamp_interval,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.temperature) as temperature
        FROM stations s
        JOIN geocodes g ON s.latitude = g.latitude AND s.longitude = g.longitude
        JOIN observations o ON s.station_id = o.station_id
        WHERE g.city = $1
          AND o.temperature IS NOT NULL
          AND o.temperature BETWEEN -100 AND 100
          AND o.observation_timestamp >= NOW() - INTERVAL '1 ' || 
            CASE 
              WHEN $2 = 'hourly' THEN 'day'
              WHEN $2 = 'daily' THEN 'month'
              WHEN $2 = 'weekly' THEN '3 months'
              WHEN $2 = 'monthly' THEN 'year'
              ELSE 'month'
            END
        GROUP BY timestamp_interval
      )
      SELECT temperature, timestamp_interval as observation_timestamp
      FROM (
        SELECT *
        FROM time_aggregated
        ORDER BY timestamp_interval DESC
        LIMIT 10000
      ) subquery
      ORDER BY observation_timestamp ASC;
    `;

    const result = await client.query(query, [params.city, timescale]);
    client.release();
    return json(result.rows);
  } catch (err) {
    console.error("Database query failed:", err);
    return json({ error: "Failed to fetch data" }, { status: 500 });
  }
}