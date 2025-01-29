// Uncached
// export async function load({ fetch, params, url }) {
//   const timescale = url.searchParams.get('timescale') || 'daily';
//   const response = await fetch(`/api/weather-cities/${params.city}?timescale=${timescale}`);
//   const weatherData = await response.json();
//   return {
//     data: weatherData,
//     city: params.city
//   };
// }
import { apiCache } from "$lib/cache";

export async function load({ fetch, params, url }) {
  const timescale = url.searchParams.get("timescale") || "daily";
  const cacheKey = `city-${params.city}-${timescale}`;

  const cachedData = apiCache.get(cacheKey);
  if (cachedData) {
    return {
      data: cachedData,
      city: params.city,
    };
  }

  const response = await fetch(
    `/api/weather-cities/${params.city}?timescale=${timescale}`,
  );
  const weatherData = await response.json();

  apiCache.set(cacheKey, weatherData, 300000); // Cache for 5 minutes

  return {
    data: weatherData,
    city: params.city,
  };
}
