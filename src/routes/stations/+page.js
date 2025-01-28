
export async function load({ fetch, url }) {
  const timeRange = url.searchParams.get('timeRange') || '24h';
  const response = await fetch(`/api/weather-cities/stats/stations?timeRange=${timeRange}`);
  const data = await response.json();
  return {
    stationData: data
  };
}
