import { WeatherConditions, Location } from '@/utils';
import axios from 'axios';
import { WEATHER_CACHE_DURATION } from '@/constants';

const BASE_URL = 'https://api.weatherapi.com/v1';
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || '';

class WeatherService {
  // Cache to store weather data (and to avoid calling API too much)
  private cache: Map<string, { data: WeatherConditions; timestamp: number }> = new Map();
  private isRequesting = false;

  async getCurrentWeather(location: Location): Promise<WeatherConditions> {
    const cacheKey = `${location.latitude},${location.longitude}`;
    const cached = this.cache.get(cacheKey);
    
    // Continue returning cached data if still valid
    if (cached && Date.now() - cached.timestamp < WEATHER_CACHE_DURATION) {
      return cached.data;
    }

    // Wait for req to finish
    if (this.isRequesting) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.getCurrentWeather(location);
    }

    this.isRequesting = true;

    try { // api call to WeatherAPI
      const response = await axios.get(`${BASE_URL}/current.json`, {
        params: {
          key: WEATHER_API_KEY,
          q: `${location.latitude},${location.longitude}`,
          aqi: 'yes',
        }
      });

      this.isRequesting = false;

      const weatherData = response.data;
      const current = weatherData.current;
      
      const weather: WeatherConditions = {
        temperature: current.temp_c, // Celsius
        humidity: current.humidity, // percentage
        windSpeed: current.wind_kph, // uses km/h
        windDirection: current.wind_degree || 0,
        precipitation: current.precip_mm || 0,
        uvIndex: current.uv,
        weatherCode: this.mapWeatherCode(current.condition.code),
        description: current.condition.text,
        icon: this.getWeatherIcon(current.condition.code),
        airQuality: weatherData.current.air_quality?.us_epa_index || 1,
      };

      // Cache weather data w/ current timestamp
      this.cache.set(cacheKey, { data: weather, timestamp: Date.now() });
      return weather;
    } catch (error) {
      this.isRequesting = false;
      throw new Error(`Weather API error: ${error}`);
    }
  }

  // WeatherAPI conditions to standard weather codes
  private mapWeatherCode(apiCode: number): number {
    if (apiCode >= 1000 && apiCode <= 1003) return 800; // Clear sky condiitons
    if (apiCode >= 1006 && apiCode <= 1009) return 804; // Cloudy conditions
    if (apiCode >= 1063 && apiCode <= 1069) return 300; // Rainy conditions
    if (apiCode === 1087) return 200; // Thunder
    if (apiCode >= 600 && apiCode <= 700) return 600; // Snow
    return 800; // Clear sky by default
  }

  getWeatherIcon(code: number): string {
    if (code >= 1000 && code <= 1003) return '☀️';
    if (code >= 1006 && code <= 1009) return '☁️';
    if (code >= 1063 && code <= 1069) return '🌦️';
    if (code === 1087) return '⛈️';
    if (code >= 600 && code <= 700) return '❄️';
    return '🌤️';
  }

  getWeatherRecommendations(weather: WeatherConditions): string[] {
    const recommendations: string[] = [];

    // Temperature recommendations
    if (weather.temperature < 5) {
      recommendations.push('Bundle up! It\'s quite cold out there.');
    } else if (weather.temperature > 30) {
      recommendations.push('Stay hydrated and consider a shorter route due to heat.');
    } else if (weather.temperature > 25) {
      recommendations.push('Consider a shaded route to stay cool.');
    }

    // Precipitation recommendations
    if (weather.precipitation > 10) {
      recommendations.push('Heavy rain expected - bring waterproof gear or consider indoor alternatives.');
    } else if (weather.precipitation > 2) {
      recommendations.push('Light rain possible - bring an umbrella.');
    }

    // Wind recommendations
    if (weather.windSpeed > 25) {
      recommendations.push('Strong winds - avoid open areas and consider a sheltered route.');
    } else if (weather.windSpeed > 15) {
      recommendations.push('Moderate winds - dress accordingly.');
    }

    // UV index recommendations
    if (weather.uvIndex && weather.uvIndex > 7) {
      recommendations.push('High UV index - wear sunscreen and protective clothing.');
    } else if (weather.uvIndex && weather.uvIndex > 5) {
      recommendations.push('Moderate UV index - consider sunscreen.');
    }

    // Severe weather recommendations
    if (weather.weatherCode >= 200 && weather.weatherCode < 300) {
      recommendations.push('Thunderstorm conditions - consider postponing your walk.');
    } else if (weather.weatherCode >= 600 && weather.weatherCode < 700) {
      recommendations.push('Snow conditions - wear appropriate footwear.');
    }

    return recommendations;
  }

  getWeatherImpactOnRoute(weather: WeatherConditions, sensitivity: 'low' | 'moderate' | 'high' = 'moderate'): {
    difficultyAdjustment: number;
    safetyAdjustment: number;
    distanceMultiplier: number;
  } {
    // Weather factors into route based on user preference
    const sensitivityMultiplier = sensitivity === 'low' ? 0.5 : sensitivity === 'high' ? 1.5 : 1.0;
    
    let difficulty = 0;
    let safety = 0;
    let distance = 1.0;

    // Check for extreme temps (too hot or too cold)
    if (weather.temperature < 5 || weather.temperature > 30) {
      difficulty += 0.5 * sensitivityMultiplier;
      safety -= 5 * sensitivityMultiplier;
      distance *= 0.85;
    }

    // Check if it's raining heavily
    if (weather.precipitation > 10) { // 10mm or more
      difficulty += 1.5 * sensitivityMultiplier;
      safety -= 15 * sensitivityMultiplier;
      distance *= 0.6;
    } else if (weather.precipitation > 2) {
      // Light rain
      difficulty += 0.5 * sensitivityMultiplier;
      safety -= 5 * sensitivityMultiplier;
      distance *= 0.8;
    }

    // Check if it's very windy
    if (weather.windSpeed > 25) { // 25 km/h or more
      difficulty += 1.0 * sensitivityMultiplier;
      safety -= 10 * sensitivityMultiplier;
      distance *= 0.7;
    }

    // Check for severe weather like thunderstorms
    if (weather.weatherCode >= 200 && weather.weatherCode < 300) {
      difficulty += 2.0 * sensitivityMultiplier;
      safety -= 20 * sensitivityMultiplier;
      distance *= 0.5;
    }

    return {
      difficultyAdjustment: Math.min(difficulty, 3),
      safetyAdjustment: Math.max(safety, -30),
      distanceMultiplier: Math.max(distance, 0.3),
    };
  }

  getWeatherColor(weatherCode: number): string {
    if (weatherCode >= 1000 && weatherCode <= 1003) return '#FFD700'; // Clear sky conditions use gold color
    if (weatherCode >= 1006 && weatherCode <= 1009) return '#87CEEB'; // Cloudy conditions use sky blue
    if (weatherCode >= 1063 && weatherCode <= 1069) return '#4682B4'; // Rainy conditions use steel blue
    if (weatherCode === 1087) return '#4B0082'; // Thunder conditions use indigo
    if (weatherCode >= 600 && weatherCode <= 700) return '#B0E0E6'; // Snow conditions use powder blue
    return '#87CEEB'; // default to Sky Blue
  }
}

export const weatherService = new WeatherService();