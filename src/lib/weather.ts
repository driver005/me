export async function check_weather() {
  try {
    const response = await fetch("/api/weather");

    // Check if the response is actually okay (200-299 status)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const weather = await response.json();

    return weather.isRaining;
  } catch (e) {
    console.error("Failed to fetch weather route", e);
    return null;
  }
}
