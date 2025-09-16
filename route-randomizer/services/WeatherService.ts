import { WeatherConditions, Location } from '@/utils';
import axios from 'axios';

const BASE_URL = 'https://api.weatherapi.com/v1';
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || '';

class WeatherService {

  async getCurrentWeather(location: Location): Promise<WeatherConditions> {
    try {
      const response = await axios.get(`${BASE_URL}/current.json`, {
        params: {
          key: WEATHER_API_KEY,
          q: `${location.latitude},${location.longitude}`,
          aqi: 'no',
        }
      });

      const current = response.data.current;
      
      return {
        temperature: current.temp_c,
        humidity: current.humidity,
        windSpeed: current.wind_kph,
        windDirection: current.wind_degree || 0,
        precipitation: current.precip_mm || 0,
        weatherCode: this.mapWeatherCode(current.condition.code),
        description: current.condition.text,
        icon: this.getWeatherIcon(this.mapWeatherCode(current.condition.code)),
      };
    } catch (error) {
      throw new Error(`Weather API error: ${error}`);
    }
  }

  // convert condition codes to standard weather codes

  private mapWeatherCode(apiCode: number): number {
    if (apiCode >= 1000 && apiCode <= 1003) return 800; // Clear
    if (apiCode >= 1006 && apiCode <= 1009) return 804; // Cloudy
    if (apiCode === 1087) return 200; // Thunderstorm
    if (apiCode >= 1063 || apiCode === 1150 || apiCode === 1153) return 300; // Rain-like
    if (apiCode >= 1200) return 600; // Snow-like
    return 800;
  }

  getWeatherIcon(code: number): string {
    // Code is already normalized (800 clear, 804 cloudy, 300 rain, 200 thunder, 600 snow)
    if (code === 800) return '☀️';
    if (code === 804) return '☁️';
    if (code === 300) return '🌦️';
    if (code === 200) return '⛈️';
    if (code === 600) return '❄️';
    return '🌤️';
  }

}

export const weatherService = new WeatherService();