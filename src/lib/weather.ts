export async function check_weather() {
  try {
    const lat = 48.521637;
    const lon = 9.057645;
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=precipitation,weather_code`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Mapping the weather data into a clean object
    const isRaining = data.current.precipitation > 0 ||
      data.current.weather_code >= 51;

    return isRaining;
  } catch (e) {
    console.error("Failed to fetch weather route", e);
    return null;
  }
}
