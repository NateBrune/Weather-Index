// export async function load({ fetch, url }) {
//   const groupBy = url.searchParams.get('groupBy') || 'city';
//   const [citiesResponse, statsResponse] = await Promise.all([
//     fetch(`/api/weather-cities?groupBy=${groupBy}`),
//     fetch('/api/weather-cities/stats')
//   ]);

//   const [data, networkStats] = await Promise.all([
//     citiesResponse.json(),
//     statsResponse.json()
//   ]);

//   return { data, networkStats, activeTab: groupBy };
// }

import { apiCache } from "$lib/cache";

export async function load({ fetch, url }) {
  const groupBy = url.searchParams.get("groupBy") || "city";
  const cacheKey = `main-${groupBy}`;

  const cachedData = apiCache.get(cacheKey);
  if (cachedData) {
    return {
      data: cachedData.data,
      networkStats: cachedData.networkStats,
      activeTab: groupBy,
    };
  }

  const [citiesResponse, statsResponse] = await Promise.all([
    fetch(`/api/weather-cities?groupBy=${groupBy}`),
    fetch("/api/weather-cities/stats"),
  ]);

  const [data, networkStats] = await Promise.all([
    citiesResponse.json(),
    statsResponse.json(),
  ]);

  apiCache.set(cacheKey, { data, networkStats }, 300000); // Cache for 5 minutes

  return {
    data: data,
    networkStats: networkStats,
    activeTab: groupBy,
  };
}
