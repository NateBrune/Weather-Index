// //import { json } from "@sveltejs/kit";
// import pg from "pg";

// const { Pool } = pg;

// // Configure the PostgreSQL connection pool
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL, // Use DATABASE_URL from environment variables
//   ssl:
//     process.env.NODE_ENV === "production"
//       ? { rejectUnauthorized: false }
//       : false,
// });

// /**
//  * GET handler to fetch aggregated weather data from the database.
//  *
//  * Queries the stations and observations tables to retrieve weather metrics
//  * grouped by city and country.
//  */
// export async function GET() {
//   try {
//     // Connect to the database
//     const client = await pool.connect();

//     // Execute the SQL query to fetch aggregated weather data
//     const query = `
//       SELECT
//         city,
//         country,
//         COUNT(stations.station_id) AS "nodeCount",
//         AVG(temperature) AS "temperature",
//         AVG(humidity) AS "humidity",
//         AVG(wind_speed) AS "windSpeed"
//       FROM stations
//       JOIN observations ON stations.station_id = observations.station_id
//       GROUP BY city, country;
//     `;
//     const result = await client.query(query);

//     // Release the database connection
//     client.release();

//     // Return the query results as a JSON response
//     return json(result.rows);
//   } catch (err) {
//     console.error("Database query failed:", err);

//     // Return an error response with a status code of 500
//     return json(
//       { error: "Failed to fetch data from the database." },
//       { status: 500 },
//     );
//   }
// }
// import { json } from "@sveltejs/kit";
// import pg from "pg";

// const { Pool } = pg;

// // Configure the PostgreSQL connection pool
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL, // Use DATABASE_URL from environment variables
//   ssl:
//     process.env.NODE_ENV === "production"
//       ? { rejectUnauthorized: false }
//       : false,
// });

// /**
//  * GET handler to fetch aggregated weather data from the database.
//  *
//  * Queries the stations and observations tables to retrieve weather metrics
//  * grouped by city and country.
//  */
// export async function GET() {
//   try {
//     // Connect to the database
//     const client = await pool.connect();

//     // Execute the SQL query to fetch aggregated weather data
//     const query = `
//       SELECT
//         city,
//         country,
//         COUNT(stations.station_id) AS "nodeCount",
//         AVG(temperature) AS "temperature",
//         AVG(humidity) AS "humidity",
//         AVG(wind_speed) AS "windSpeed"
//       FROM stations
//       JOIN observations ON stations.station_id = observations.station_id
//       GROUP BY city, country;
//     `;
//     const result = await client.query(query);

//     // Release the database connection
//     client.release();

//     // Return the query results as a JSON response
//     return json(result.rows);
//   } catch (err) {
//     console.error("Database query failed:", err);

//     // Return an error response with a status code of 500
//     return json(
//       { error: "Failed to fetch data from the database." },
//       { status: 500 },
//     );
//   }
// }
