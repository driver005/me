import { json } from '@sveltejs/kit';

export async function GET() {
  const lat = 48.521637;
  const lon = 9.057645;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=precipitation,weather_code`;

  const response = await fetch(url);

  const data = await response.json();

  // Mapping the weather data into a clean object
  const weather = {
    precipitation: data.current.precipitation,
    isRaining: data.current.precipitation > 0 || data.current.weather_code >= 51,
    city: 'BW',
    timestamp: new Date().toISOString()
  };

  return json(weather);
}
