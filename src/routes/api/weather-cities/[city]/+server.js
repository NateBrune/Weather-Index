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

export async function GET({ params, url }) {
  try {
    const client = await pool.connect();
    const timescale = url.searchParams.get("timescale") || "daily";

    // Define the time interval and range based on the selected timescale
    let timeInterval;
    let timeRange;
    switch (timescale) {
      case "hourly":
        timeInterval = "hour";
        timeRange = "7 days"; // Fetch data for the last 7 days for hourly granularity
        break;
      case "daily":
        timeInterval = "day";
        timeRange = "1 month"; // Fetch data for the last 1 month for daily granularity
        break;
      case "weekly":
        timeInterval = "week";
        timeRange = "3 months"; // Fetch data for the last 3 months for weekly granularity
        break;
      case "monthly":
        timeInterval = "month";
        timeRange = "1 year"; // Fetch data for the last 1 year for monthly granularity
        break;
      case "yearly":
        timeInterval = "year";
        timeRange = "10 years"; // Fetch data for the last 10 years for yearly granularity
        break;
      default:
        timeInterval = "day";
        timeRange = "1 month";
    }

    const query = `
      WITH time_aggregated AS (
        SELECT 
          date_trunc('${timeInterval}', o.observation_timestamp) as timestamp_interval,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.temperature) as temperature,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.humidity) as humidity,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.wind_speed) as wind_speed,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.pressure) as pressure
        FROM stations s
        JOIN geocodes g ON s.latitude = g.latitude AND s.longitude = g.longitude
        JOIN observations o ON s.station_id = o.station_id
        WHERE g.city = $1
          AND o.observation_timestamp >= NOW() - INTERVAL '${timeRange}'
        GROUP BY timestamp_interval
        ORDER BY timestamp_interval DESC
      )
      SELECT 
        temperature,
        humidity,
        wind_speed,
        pressure,
        timestamp_interval as observation_timestamp
      FROM time_aggregated
      ORDER BY observation_timestamp ASC;
    `;

    const result = await client.query(query, [params.city]);
    client.release();

    if (result.rows.length === 0) {
      return json(
        { error: `No data available for ${timescale} timescale.` },
        { status: 404 },
      );
    }

    return json(result.rows);
  } catch (err) {
    console.error("Database query failed:", err);
    return json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
