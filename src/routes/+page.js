
export async function load({ fetch }) {
  const response = await fetch('/api/weather-cities');
  const data = await response.json();
  return { data };
}
