import polyline from '@mapbox/polyline';
import { Route, Location, RoutePoint, UserPreferences, WeatherConditions, RouteGenerationOptions } from '../utils';
import axios from 'axios';
import Constants from 'expo-constants';
import { DIRECTIONS_BASE_URL, DIRECTIONS_TIMEOUT_MS } from '../constants';

const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey || '';

class RouteGenerationService {
  async generateRoute(options: RouteGenerationOptions): Promise<Route | null> {
    const { startLocation, distance, preferences, weatherConditions } = options;
    return await this.tryGenerateRoute(startLocation, Math.round(distance), preferences, weatherConditions);
  }

  private async tryGenerateRoute(
    startLocation: Location,
    targetDistance: number,
    preferences: UserPreferences,
    weatherConditions: WeatherConditions
  ): Promise<Route | null> {
    // more scales to get closer to target distance
    const distanceScales = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3];
    for (const scale of distanceScales) {
      try {
        const destination = this.generateDestinationWithScale(startLocation, targetDistance, scale);
        const routeData = await this.getRouteFromGoogleMaps(startLocation, destination);
        if (routeData && this.isValidRoute(routeData, targetDistance)) {
          return this.createRoute(routeData, startLocation, preferences, weatherConditions);
        }
      } catch (error) {
        continue;
      }
    }
    return null;
  }

  private generateDestinationWithScale(startLocation: Location, targetDistance: number, scale: number): Location {
    const angle = Math.random() * Math.PI * 2;
    const distance = targetDistance * scale;
    const latOffset = (distance / 111000) * Math.cos(angle);
    const lngOffset = (distance / 111000) * Math.sin(angle) / Math.cos(startLocation.latitude * Math.PI / 180);
    return { latitude: startLocation.latitude + latOffset, longitude: startLocation.longitude + lngOffset };
  }

  private isValidRoute(routeData: any, targetDistance: number): boolean {
    if (!routeData?.points || routeData.points.length < 2) return false;
    const actualDistance = this.calculateTotalDistance(routeData.points);
    // Accept routes that are 70-100% of target distance
    const minDistance = targetDistance * 0.7;
    const maxDistance = targetDistance * 1.0;
    return actualDistance >= minDistance && actualDistance <= maxDistance;
  }

  private createRoute(
    routeData: { points: RoutePoint[], duration: number },
    startLocation: Location,
    preferences: UserPreferences,
    weatherConditions: WeatherConditions
  ): Route {
    const totalDistance = this.calculateTotalDistance(routeData.points);
    const endLocation = routeData.points[routeData.points.length - 1];

    return {
      id: this.generateRouteId(),
      name: this.generateRouteName(totalDistance, weatherConditions, preferences.units || 'metric'),
      distance: totalDistance,
      duration: routeData.duration,
      points: routeData.points,
      startLocation,
      endLocation,
      weatherConditions,
      createdAt: new Date(),
      difficulty: this.calculateSimpleDifficulty(totalDistance),
      safetyScore: this.calculateSimpleSafetyScore(totalDistance, weatherConditions),
    };
  }

  private calculateSimpleDifficulty(distance: number): 'easy' | 'moderate' | 'hard' {
    const km = distance / 1000;
    if (km < 2) return 'easy';
    if (km < 5) return 'moderate';
    return 'hard';
  }

  private calculateSimpleSafetyScore(distance: number, weather: WeatherConditions): number {
    let score = 85; // Base score
    if (weather.precipitation > 10) score -= 20;
    else if (weather.precipitation > 2) score -= 10;
    if (weather.windSpeed > 25) score -= 15;
    else if (weather.windSpeed > 15) score -= 5;
    if (weather.temperature < 0 || weather.temperature > 35) score -= 10;
    if (distance > 5000) score -= 10;
    return Math.max(0, Math.min(100, score));
  }

  private async getRouteFromGoogleMaps(
    origin: Location,
    destination: Location
  ): Promise<{ points: RoutePoint[], duration: number } | null> {
    if (!GOOGLE_MAPS_API_KEY) {
      return null;
    }

    try {
      const response = await axios.get(DIRECTIONS_BASE_URL, {
        params: {
          origin: `${origin.latitude},${origin.longitude}`,
          destination: `${destination.latitude},${destination.longitude}`,
          mode: 'walking',
          key: GOOGLE_MAPS_API_KEY,
        },
        timeout: DIRECTIONS_TIMEOUT_MS
      });
      
      if (response.data.status !== 'OK') {
        return null;
      }
      
      const route = response.data.routes?.[0];
      if (!route) {
        return null;
      }
      
      const points = this.decodeRoutePoints(route.overview_polyline?.points);
      const duration = route.legs.reduce((total: number, leg: { duration: { value: number } }) => total + leg.duration.value, 0);
      
      return { points, duration };
    } catch (error) {
      return null;
    }
  }

  private decodeRoutePoints(polylineString: string): RoutePoint[] {
    if (!polylineString) return [];
    const decoded = polyline.decode(polylineString);
    return decoded
      .map(([lat, lng]) => ({ latitude: lat, longitude: lng }))
      .filter(p => this.isValidCoordinate(p.latitude, p.longitude));
  }

  private calculateTotalDistance(points: RoutePoint[]): number {
    return points.slice(1).reduce((total, point, i) => 
      total + this.calculateDistance(points[i], point), 0
    );
  }

  private calculateDistance(point1: RoutePoint, point2: RoutePoint): number {
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = point1.latitude * Math.PI / 180;
    const lat2Rad = point2.latitude * Math.PI / 180;
    const deltaLatRad = (point2.latitude - point1.latitude) * Math.PI / 180;
    const deltaLonRad = (point2.longitude - point1.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLatRad / 2) ** 2 + 
              Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLonRad / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private isValidCoordinate(lat: number, lng: number): boolean {
    return isFinite(lat) && isFinite(lng) && 
           lat >= -90 && lat <= 90 && 
           lng >= -180 && lng <= 180;
  }

  private generateRouteName(distance: number, weather: WeatherConditions, units: 'metric' | 'imperial'): string {
    // Simple weather icon based on weather code
    const weatherIcon = weather.weatherCode >= 800 ? '☀️' : '🌧️';
    
    if (units === 'imperial') {
      const miles = Math.round((distance / 1000) * 0.621371 * 10) / 10;
      return `${weatherIcon} ${miles}mi Walk`;
    } else {
      const km = Math.round(distance / 1000 * 10) / 10;
      return `${weatherIcon} ${km}km Walk`;
    }
  }

  private generateRouteId(): string {
    return `route_${Date.now()}`;
  }

}

export const routeGenerationService = new RouteGenerationService();