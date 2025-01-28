
export async function load({ fetch, url }) {
  const groupBy = url.searchParams.get('groupBy') || 'city';
  const response = await fetch(`/api/weather-cities?groupBy=${groupBy}`);
  const data = await response.json();
  return { data, activeTab: groupBy };
}
export async function load({ fetch, url }) {
  const groupBy = url.searchParams.get('groupBy') || 'city';
  const [citiesResponse, statsResponse] = await Promise.all([
    fetch(`/api/weather-cities?groupBy=${groupBy}`),
    fetch('/api/weather-cities/stats')
  ]);
  
  const [data, networkStats] = await Promise.all([
    citiesResponse.json(),
    statsResponse.json()
  ]);
  
  return { data, networkStats, activeTab: groupBy };
}
