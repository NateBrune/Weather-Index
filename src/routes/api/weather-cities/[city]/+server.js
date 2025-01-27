
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
      SELECT o.temperature, o.observation_timestamp
      FROM stations s
      JOIN geocodes g ON s.latitude = g.latitude AND s.longitude = g.longitude
      JOIN observations o ON s.station_id = o.station_id
      WHERE g.city = $1
      ORDER BY o.observation_timestamp DESC
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
