
export async function load({ fetch, params, url }) {
  const timescale = url.searchParams.get('timescale') || 'daily';
  const response = await fetch(`/api/weather-cities/state/${params.state}?timescale=${timescale}`);
  const weatherData = await response.json();
  return { 
    data: weatherData, 
    state: params.state 
  };
}
