
export async function load({ fetch, params, url }) {
  const timescale = url.searchParams.get('timescale') || 'daily';
  const response = await fetch(`/api/weather-cities/country/${params.country}?timescale=${timescale}`);
  const weatherData = await response.json();
  return { 
    data: weatherData, 
    country: params.country,
    timescale
  };
}
