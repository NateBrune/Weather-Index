
export async function load({ fetch, url }) {
  const groupBy = url.searchParams.get('groupBy') || 'city';
  const [citiesResponse, statsResponse] = await Promise.all([
    fetch(`/api/weather-cities?groupBy=${groupBy}`),
    fetch(`/api/weather-cities/stats?groupBy=${groupBy}`)
  ]);
  
  const [data, networkStats] = await Promise.all([
    citiesResponse.json(),
    statsResponse.json()
  ]);
  
  return { data, networkStats, activeTab: groupBy };
}
