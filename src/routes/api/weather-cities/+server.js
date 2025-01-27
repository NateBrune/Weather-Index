
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
      WITH current_temps AS (
        SELECT 
          g.city,
          COUNT(DISTINCT s.station_id) as station_count,
          ROUND(AVG(o.temperature)::numeric, 2) as avg_temperature,
          MAX(o.timestamp) as latest_time
        FROM stations s
        JOIN geocodes g ON s.latitude = g.latitude AND s.longitude = g.longitude
        LEFT JOIN observations o ON s.station_id = o.station_id
        WHERE g.city != 'Unknown'
        GROUP BY g.city
      ),
      day_ago_temps AS (
        SELECT 
          g.city,
          ROUND(AVG(o.temperature)::numeric, 2) as old_temperature
        FROM stations s
        JOIN geocodes g ON s.latitude = g.latitude AND s.longitude = g.longitude
        LEFT JOIN observations o ON s.station_id = o.station_id
        WHERE g.city != 'Unknown'
        AND o.timestamp <= (SELECT MAX(latest_time) - INTERVAL '24 hours' FROM current_temps)
        AND o.timestamp > (SELECT MAX(latest_time) - INTERVAL '25 hours' FROM current_temps)
        GROUP BY g.city
      )
      SELECT 
        c.city,
        c.station_count,
        c.avg_temperature,
        ROUND((c.avg_temperature - d.old_temperature)::numeric, 2) as temperature_change_24h
      FROM current_temps c
      LEFT JOIN day_ago_temps d ON c.city = d.city
      ORDER BY c.station_count DESC;
    `;
    const result = await client.query(query);
    client.release();

    return json(result.rows);
  } catch (err) {
    console.error("Database query failed:", err);
    return json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
