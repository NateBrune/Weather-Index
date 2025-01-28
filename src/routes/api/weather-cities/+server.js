import { json } from "@sveltejs/kit";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

export async function GET({ url }) {
  try {
    const client = await pool.connect();
    const groupBy = url.searchParams.get("groupBy") || "city";

    const query = `
      WITH grouped_stations AS (
        SELECT 
          CASE 
            WHEN $1 = 'city' THEN g.city
            WHEN $1 = 'state' THEN COALESCE(g.state, 'Unknown')
            ELSE COALESCE(g.country, 'Unknown')
          END as location_name,
          COUNT(DISTINCT s.station_id) AS station_count,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.temperature) as median_temperature,
          mode() WITHIN GROUP (ORDER BY o.weather_condition) as weather_icon
        FROM stations s
        JOIN geocodes g ON s.latitude = g.latitude AND s.longitude = g.longitude
        LEFT JOIN observations o ON s.station_id = o.station_id
        WHERE o.temperature IS NOT NULL
          AND o.temperature BETWEEN -50 AND 50
          AND CASE 
            WHEN $1 = 'city' THEN g.city != 'Unknown'
            WHEN $1 = 'state' THEN g.state IS NOT NULL AND g.state != 'Unknown'
            ELSE g.country IS NOT NULL
          END
        GROUP BY location_name
        HAVING COUNT(DISTINCT s.station_id) > 0
      )
      SELECT 
        location_name,
        station_count,
        ROUND(median_temperature::numeric, 2) as median_temperature,
        weather_icon
      FROM grouped_stations
      ORDER BY station_count DESC;
    `;

    const result = await client.query(query, [groupBy]);
    client.release();

    return json(result.rows);
  } catch (err) {
    console.error("Database query failed:", err);
    return json({ error: "Failed to fetch data" }, { status: 500 });
  }
}