import { json } from "@sveltejs/kit";
import pg from "pg";

const { Pool } = pg;
import { apiCache } from "$lib/cache";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

export async function GET({ url }) {
  try {
    const timeRange = url.searchParams.get("timeRange") || "24h";
    const interval = timeRange === "24h" ? "hour" : "hour";
    const cacheKey = `stats-${timeRange}`;

    // Check cache first
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) {
      return json(cachedData);
    }

    const client = await pool.connect();
    const query = `
      WITH hourly_data AS (
        SELECT 
          DATE_TRUNC($1, observation_timestamp) as hour,
          COUNT(DISTINCT station_id) as active_stations,
          COUNT(DISTINCT CASE WHEN data_quality_score >= 0.8 THEN station_id END) as quality_stations,
          ROUND(AVG(temperature)::numeric, 2) as avg_temp,
          ROUND(AVG(humidity)::numeric, 2) as avg_humidity,
          ROUND(AVG(wind_speed)::numeric, 2) as avg_wind
        FROM observations
        WHERE observation_timestamp >= NOW() - (
          CASE 
            WHEN $2 = '24h' THEN INTERVAL '24 hours'
            WHEN $2 = '7d' THEN INTERVAL '7 days'
            WHEN $2 = '30d' THEN INTERVAL '30 days'
            ELSE INTERVAL '24 hours'
          END
        )
        GROUP BY DATE_TRUNC($1, observation_timestamp)
        ORDER BY hour ASC
      ),
      quality_stats AS (
        SELECT 
          COUNT(DISTINCT s.station_id) as total_stations,
          COUNT(DISTINCT CASE WHEN o.data_quality_score >= 0.8 THEN s.station_id END) as high_quality_stations,
          CAST(AVG(o.data_quality_score) * 100 AS DECIMAL(5,2)) as avg_quality_percentage
        FROM stations s
        LEFT JOIN observations o ON s.station_id = o.station_id
        WHERE o.data_quality_score IS NOT NULL
      ),
      hourly_temps AS (
        SELECT 
          date_trunc('hour', o.observation_timestamp) as hour,
          PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY o.temperature) as temperature
        FROM observations o
        WHERE o.observation_timestamp >= NOW() - INTERVAL '24 hours'
          AND o.data_quality_score >= 0.8
          AND o.temperature BETWEEN -50 AND 50
        GROUP BY hour
        ORDER BY hour ASC
      )
      SELECT 
        qs.total_stations as station_count,
        qs.high_quality_stations,
        qs.avg_quality_percentage,
        ROUND(CAST((SELECT temperature FROM hourly_temps ORDER BY hour DESC LIMIT 1) AS DECIMAL(5,2)), 2) as median_temperature,
        (
          SELECT json_agg(json_build_object(
            'temperature', temperature,
            'timestamp', hour
          ) ORDER BY hour)
          FROM hourly_temps
        ) as sparkline_data,
        (
          SELECT json_agg(json_build_object(
            'timestamp', hour,
            'count', active_stations,
            'quality_count', quality_stations
          ) ORDER BY hour)
          FROM hourly_data
        ) as station_count_history
      FROM quality_stats qs
      LIMIT 1;
    `;

    const result = await client.query(query, [interval, timeRange]);
    client.release();
    return json(result.rows[0]);
  } catch (err) {
    console.error("Database query failed:", err);
    return json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
