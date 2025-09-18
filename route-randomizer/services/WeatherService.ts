import { WeatherConditions, Location } from '@/utils';
import axios from 'axios';

const BASE_URL = 'https://api.weatherapi.com/v1';
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || '';

class WeatherService {
  async getCurrentWeather(location: Location): Promise<WeatherConditions> {
    if (!WEATHER_API_KEY) {
      console.warn('Weather API key is missing, returning default weather');
      return this.getDefaultWeather();
    }

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
        weatherCode: current.condition.code,
        description: current.condition.text,
        icon: this.getWeatherIcon(current.condition.code),
      };
    } catch (error) {
      console.error('Weather API error:', error);
      return this.getDefaultWeather();
    }
  }

  private getDefaultWeather(): WeatherConditions {
    return {
      temperature: 20,
      humidity: 50,
      windSpeed: 10,
      windDirection: 0,
      precipitation: 0,
      weatherCode: 1000,
      description: 'Clear',
      icon: '☀️',
    };
  }

  /**
   * Get simple emoji icon for weather condition
   */
  getWeatherIcon(code: number): string {
    // Simple mapping for common weather codes
    if (code >= 1000 && code <= 1003) return '☀️'; // Clear
    if (code >= 1006 && code <= 1009) return '☁️'; // Cloudy
    if (code === 1087) return '⛈️'; // Thunderstorm
    if (code >= 1063 || code === 1150 || code === 1153) return '🌦️'; // Rain
    if (code >= 1200) return '❄️'; // Snow
    return '🌤️'; // Default
  }

}

export const weatherService = new WeatherService();