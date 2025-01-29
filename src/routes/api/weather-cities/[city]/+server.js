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
        timeRange = "1 days"; // Fetch data for the last 7 days for hourly granularity
        break;
      case "daily":
        timeInterval = "hour";
        timeRange = "7 days"; // Fetch data for the last 1 month for daily granularity
        break;
      case "weekly":
        timeInterval = "day";
        timeRange = "30 days"; // Fetch data for the last 3 months for weekly granularity
        break;
      case "monthly":
        timeInterval = "week";
        timeRange = "1 year"; // Fetch data for the last 1 year for monthly granularity
        break;
      case "yearly":
        timeInterval = "month";
        timeRange = "10 years"; // Fetch data for the last 10 years for yearly granularity
        break;
      default:
        timeInterval = "day";
        timeRange = "7 days";
    }

    // Get station data first
    const stationQuery = `
      SELECT DISTINCT ON (s.station_id)
        s.station_id,
        s.name as station_name,
        s.latitude,
        s.longitude,
        o.temperature,
        o.humidity,
        o.wind_speed,
        o.pressure,
        o.observation_timestamp,
        o.data_quality_score
      FROM stations s
      JOIN geocodes g ON s.latitude = g.latitude AND s.longitude = g.longitude
      JOIN observations o ON s.station_id = o.station_id
      WHERE g.city = $1
        AND o.observation_timestamp >= NOW() - INTERVAL '1 hour'
        AND o.data_quality_score >= 0.8
      ORDER BY s.station_id, o.observation_timestamp DESC;
    `;

    const stationResult = await client.query(stationQuery, [params.city]);
    
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
          AND o.temperature BETWEEN -50 AND 50  -- Filter unrealistic temperatures
          AND o.humidity BETWEEN 0 AND 100      -- Filter invalid humidity values
          AND o.pressure BETWEEN 870 AND 1085   -- Filter invalid pressure values (hPa)
          AND o.data_quality_score >= 0.8       -- Filter low quality data
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

    return json({
      timeseries: result.rows,
      stations: stationResult.rows
    });
  } catch (err) {
    console.error("Database query failed:", err);
    return json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
