
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
      WITH city_temperatures AS (
        SELECT 
          g.city,
          o.temperature
        FROM 
          stations s
        JOIN 
          geocodes g ON s.latitude = g.latitude AND s.longitude = g.longitude
        LEFT JOIN 
          observations o ON s.station_id = o.station_id
        WHERE 
          g.city != 'Unknown'
      ),
      city_temperature_medians AS (
        SELECT
          city,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY temperature) AS median_temperature
        FROM
          city_temperatures
        WHERE 
          temperature IS NOT NULL
        GROUP BY
          city
      )
      SELECT 
        g.city,
        COUNT(DISTINCT s.station_id) AS station_count,
        ROUND(ctm.median_temperature::numeric, 2) AS median_temperature
      FROM 
        stations s
      JOIN 
        geocodes g ON s.latitude = g.latitude AND s.longitude = g.longitude
      LEFT JOIN 
        city_temperature_medians ctm ON g.city = ctm.city
      WHERE 
        g.city != 'Unknown'
      GROUP BY 
        g.city, ctm.median_temperature
      ORDER BY 
        station_count DESC;
    `;
    const result = await client.query(query);
    client.release();

    return json(result.rows);
  } catch (err) {
    console.error("Database query failed:", err);
    return json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
