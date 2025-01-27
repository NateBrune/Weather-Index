
export async function load({ fetch, params }) {
  const response = await fetch(`/api/weather-cities/${params.city}`);
  const weatherData = await response.json();
  return { 
    data: weatherData, 
    city: params.city 
  };
}
