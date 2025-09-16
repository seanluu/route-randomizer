import polyline from '@mapbox/polyline';
import { Route, Location, RoutePoint, UserPreferences, WeatherConditions, RouteGenerationOptions } from '@/utils';
import axios from 'axios';
import { DIRECTIONS_BASE_URL, DIRECTIONS_TIMEOUT_MS } from '@/constants';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

class RouteGenerationService {
  private static successCount = 0;
  private static totalAttempts = 0;

  async generateRoute(options: RouteGenerationOptions): Promise<Route | null> {
    RouteGenerationService.totalAttempts++;
    console.time('Route Generation');
    
    const { startLocation, distance, preferences, weatherConditions } = options;
    const result = await this.tryGenerateRoute(startLocation, Math.round(distance), preferences, weatherConditions);
    
    if (result) {
      RouteGenerationService.successCount++;
    }
    
    console.timeEnd('Route Generation');
    return result;
  }

  private async tryGenerateRoute(
    startLocation: Location,
    targetDistance: number,
    preferences: UserPreferences,
    weatherConditions: WeatherConditions
  ): Promise<Route | null> {
    // Try minimal scales for faster success while keeping <= target
    const distanceScales = [0.75, 0.65];
    for (const scale of distanceScales) {
      for (let i = 0; i < 1; i++) {
        try {
          const destination = this.generateDestinationWithScale(startLocation, targetDistance, scale);
          const routeData = await this.getRouteFromGoogleMaps(startLocation, destination);
          if (routeData && this.isValidRoute(routeData, targetDistance)) {
            return this.createRoute(routeData, startLocation, preferences, weatherConditions);
          }
        } catch (error) {
          console.error('Route generation attempt failed:', error);
        }
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
    // Routes must be at or under the target distance
    return actualDistance <= targetDistance && actualDistance > 0;
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
    console.time('Google Maps API');
    
    try {
      if (!GOOGLE_MAPS_API_KEY) {
        console.error('Google Maps API key is missing!');
        return null;
      }
      
      // Add timeout to prevent hanging
      const response = await Promise.race([
        axios.get(DIRECTIONS_BASE_URL, {
          params: {
            origin: `${origin.latitude},${origin.longitude}`,
            destination: `${destination.latitude},${destination.longitude}`,
            mode: 'walking',
            key: GOOGLE_MAPS_API_KEY,
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('API timeout')), DIRECTIONS_TIMEOUT_MS)
        )
      ]) as any;
      
      const route = response.data.routes?.[0];
      if (!route) {
        return null;
      }
      
      const points = this.decodeRoutePoints(route.overview_polyline?.points);
      const duration = route.legs.reduce((total: number, leg: any) => total + leg.duration.value, 0);
      
      console.timeEnd('Google Maps API');
      return { points, duration };
    } catch (error) {
      console.timeEnd('Google Maps API');
      console.error('Google Maps API error:', error);
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
    // Minimal: choose icon by clear/cloudy based on weatherCode range
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

  static getSuccessRate(): number {
    return RouteGenerationService.totalAttempts > 0 
      ? (RouteGenerationService.successCount / RouteGenerationService.totalAttempts) * 100 
      : 0;
  }
}

export const routeGenerationService = new RouteGenerationService();