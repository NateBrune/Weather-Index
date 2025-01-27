
import { json } from "@sveltejs/kit";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

export async function GET({ params }) {
  try {
    const client = await pool.connect();
    const query = `
      WITH valid_stations AS (
          SELECT s.station_id
          FROM stations s
          JOIN observations o ON s.station_id = o.station_id
          GROUP BY s.station_id
          HAVING SUM(CASE WHEN o.temperature IS NULL THEN 1 ELSE 0 END) < 10
      ),
      hourly_medians AS (
          SELECT 
              o.observation_timestamp,
              PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.temperature) as temperature
          FROM stations s
          JOIN geocodes g ON s.latitude = g.latitude AND s.longitude = g.longitude
          JOIN observations o ON s.station_id = o.station_id
          WHERE g.city = $1
            AND o.temperature IS NOT NULL
            AND o.temperature BETWEEN -100 AND 100
            AND o.observation_timestamp IS NOT NULL
            AND s.station_id IN (SELECT station_id FROM valid_stations)
          GROUP BY o.observation_timestamp
      )
      SELECT temperature, observation_timestamp
      FROM hourly_medians
      ORDER BY observation_timestamp DESC
      LIMIT 100;
    `;
    const result = await client.query(query, [params.city]);
    client.release();
    return json(result.rows);
  } catch (err) {
    console.error("Database query failed:", err);
    return json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
