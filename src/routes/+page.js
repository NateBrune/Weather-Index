
export async function load({ fetch, url }) {
  const groupBy = url.searchParams.get('groupBy') || 'city';
  const response = await fetch(`/api/weather-cities?groupBy=${groupBy}`);
  const data = await response.json();
  return { data, activeTab: groupBy };
}
