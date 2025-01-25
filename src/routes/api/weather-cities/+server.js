
import { json } from "@sveltejs/kit";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

export async function GET() {
  try {
    const client = await pool.connect();
    const query = `
      SELECT 
        g.city,
        COUNT(DISTINCT s.station_id) as station_count,
        ROUND(AVG(o.temperature)::numeric, 2) as avg_temperature
      FROM stations s
      JOIN geocodes g ON s.latitude = g.latitude AND s.longitude = g.longitude
      LEFT JOIN observations o ON s.station_id = o.station_id
      WHERE g.city != 'Unknown'
      GROUP BY g.city
      ORDER BY station_count DESC;
    `;
    const result = await client.query(query);
    client.release();

    return json(result.rows);
  } catch (err) {
    console.error("Database query failed:", err);
    return json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
