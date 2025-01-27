
export async function load({ fetch, params }) {
  const response = await fetch(`/api/weather-cities/${params.city}`);
  const data = await response.json();
  return { data, city: params.city };
}
