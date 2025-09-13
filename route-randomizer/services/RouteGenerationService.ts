import polyline from '@mapbox/polyline';
import { Route, Location, RoutePoint, UserPreferences, WeatherConditions, RouteGenerationOptions } from '@/utils';
import { weatherService } from './WeatherService';
import axios from 'axios';
import { MAX_ATTEMPTS, BASE_SAFETY_SCORE } from '@/constants';
const DIRECTIONS_BASE_URL = 'https://maps.googleapis.com/maps/api/directions/json';
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

class RouteGenerationService {

  async generateRoute(options: RouteGenerationOptions): Promise<Route | null> {
    const { startLocation, distance, preferences, weatherConditions, roundTrip = true } = options;
    
    return await this.findValidRoute(startLocation, Math.round(distance), preferences, weatherConditions, roundTrip);
  }

  // Factors that go into a route:
  private async findValidRoute(
    startLocation: Location,
    targetDistance: number,
    preferences: UserPreferences,
    weatherConditions: WeatherConditions,
    roundTrip: boolean
  ): Promise<Route | null> {

    const travelMode = 'walking'; // Use the walking setting for Google Maps
    
    // Try up to 15 times for a route
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {

      const randomPin = this.generateRandomPin(startLocation, targetDistance); // within the specified distance
      const routeData = await this.getRouteFromGoogleMaps(startLocation, randomPin, travelMode);
      
      if (routeData && this.isValidRoute(routeData, targetDistance)) {
        return this.createRoute(routeData, startLocation, preferences, weatherConditions, roundTrip);
      }
    }
  
    return null;
  }

  private isValidRoute(routeData: any, targetDistance: number): boolean {
    if (!routeData?.points || routeData.points.length < 2) return false;
    return this.calculateTotalDistance(routeData.points) <= targetDistance;
  }

  private createRoute(
    routeData: { points: RoutePoint[], duration: number },
    startLocation: Location,
    preferences: UserPreferences,
    weatherConditions: WeatherConditions,
    roundTrip: boolean
  ): Route {
    const totalDistance = this.calculateTotalDistance(routeData.points);
    const endLocation = routeData.points[routeData.points.length - 1];

    // Calculate factors that go into a route
    const difficulty = this.calculateDifficulty(totalDistance, weatherConditions, preferences);
    const safetyScore = this.calculateSafetyScore(routeData.points, weatherConditions, preferences);
    const weatherNotes = weatherService.getWeatherRecommendations(weatherConditions);

    return {
      id: this.generateRouteId(),
      name: this.generateRouteName(totalDistance, weatherConditions, preferences),
      distance: totalDistance,
      duration: routeData.duration,
      points: routeData.points,
      startLocation,
      endLocation,
      weatherConditions,
      createdAt: new Date(),
      isLoop: roundTrip,
      difficulty,
      safetyScore,
      weatherNotes,
    };
  }

  private calculateDestinationPoint(start: Location, bearing: number, distance: number): Location {
    const EARTH_RADIUS = 6371000; // Earth's radius in meters
    const angularDistance = distance / EARTH_RADIUS;
    
    const startLatRad = this.degreesToRadians(start.latitude);
    const startLonRad = this.degreesToRadians(start.longitude);
    
    const destLatRad = this.calculateDestinationLatitude(startLatRad, angularDistance, bearing);
    const destLonRad = this.calculateDestinationLongitude(startLatRad, startLonRad, destLatRad, angularDistance, bearing);
    
    const result = {
      latitude: this.radiansToDegrees(destLatRad),
      longitude: this.radiansToDegrees(destLonRad),
    };

    return this.validateCoordinates(result, start);
  }

  private degreesToRadians(degrees: number): number {
    return degrees * Math.PI / 180;
  }

  private radiansToDegrees(radians: number): number {
    return radians * 180 / Math.PI;
  }

  private calculateDestinationLatitude(startLatRad: number, angularDistance: number, bearing: number): number {
    return Math.asin(
      Math.sin(startLatRad) * Math.cos(angularDistance) + 
      Math.cos(startLatRad) * Math.sin(angularDistance) * Math.cos(bearing)
    );
  }

  private calculateDestinationLongitude(
    startLatRad: number, 
    startLonRad: number, 
    destLatRad: number, 
    angularDistance: number, 
    bearing: number
  ): number {
    return startLonRad + Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(startLatRad),
      Math.cos(angularDistance) - Math.sin(startLatRad) * Math.sin(destLatRad)
    );
  }

  // return fallback if invalid
  private validateCoordinates(result: Location, start: Location): Location {
    const isValid = isFinite(result.latitude) && isFinite(result.longitude) &&
                   result.latitude >= -90 && result.latitude <= 90 &&
                   result.longitude >= -180 && result.longitude <= 180;

    if (isValid) {
      return result;
    }

    console.warn('Invalid coordinates generated, using fallback');
    return {
      latitude: start.latitude + (Math.random() - 0.5) * 0.001,
      longitude: start.longitude + (Math.random() - 0.5) * 0.001,
    };
  }


  // Polyline (from Mapbox library the goat)for storing lat/lng points as a single string
  private decodePolyline(encoded: string): number[] {
    return polyline.decode(encoded).flat();
  }

  private async getRouteFromGoogleMaps(
    origin: Location,
    destination: Location,
    mode: 'walking'
  ): Promise<{ points: RoutePoint[], duration: number } | null> {
   
    // API request
    try {
      const response = await axios.get(DIRECTIONS_BASE_URL, {
        params: {
          origin: `${origin.latitude},${origin.longitude}`,
          destination: `${destination.latitude},${destination.longitude}`,
          mode,
          key: GOOGLE_MAPS_API_KEY,
        }
      });
      
      const route = response.data.routes?.[0];
      if (!route) {
        return null;
      }
      
      const points = this.decodeRoutePoints(route.overview_polyline?.points);
      const duration = this.calculateRouteDuration(route.legs);
      
      return { points, duration };
    } catch (error) {
      // API call failed
      console.error('Google Maps API error:', error);
      return null;
    }
  }

  // Convert polyline string to RoutePoint array
  private decodeRoutePoints(polylineString: string): RoutePoint[] {
    if (!polylineString) return [];
    
    const points: RoutePoint[] = [];
    const decoded = this.decodePolyline(polylineString);
    let timestamp = Date.now();
    
    // Process coordinates in pairs (latitude, longitude)
    for (let i = 0; i + 1 < decoded.length; i += 2) {
      const lat = decoded[i];
      const lng = decoded[i + 1];
      
      if (this.isValidCoordinate(lat, lng)) {
        points.push({ latitude: lat, longitude: lng, timestamp });
        timestamp += 1000; // add 1 second between each point
      }
    }
    
    return points;
  }

  private calculateRouteDuration(legs: any[]): number {
    return legs.reduce((total, leg) => total + leg.duration.value, 0);
  }

  private isValidCoordinate(lat: number, lng: number): boolean {
    return isFinite(lat) && isFinite(lng) && 
           lat >= -90 && lat <= 90 && 
           lng >= -180 && lng <= 180;
  }

  // within the target distance
  private generateRandomPin(startLocation: Location, targetDistance: number): Location {
    const angle = Math.random() * Math.PI * 2; // Random direction
    const pinDistance = targetDistance * (0.6 + Math.random() * 0.2); // We don't want it to be exactly the target distance, so 60-80% of target
    return this.calculateDestinationPoint(startLocation, angle, pinDistance);
  }

  // Sum distances between consecutive points
  private calculateTotalDistance(points: RoutePoint[]): number {
    return points.slice(1).reduce((total, point, i) => 
      total + this.calculateDistance(points[i], point), 0
    );
  }

  private calculateDistance(point1: RoutePoint, point2: RoutePoint): number {
    const EARTH_RADIUS = 6371000; 
    
    const lat1Rad = this.degreesToRadians(point1.latitude);
    const lat2Rad = this.degreesToRadians(point2.latitude);
    const deltaLatRad = this.degreesToRadians(point2.latitude - point1.latitude);
    const deltaLonRad = this.degreesToRadians(point2.longitude - point1.longitude);

    // Haversine formula
    const a = Math.sin(deltaLatRad / 2) ** 2 + 
              Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLonRad / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS * c;
  }

  // Calculate route difficulty based on distance and weather
  private calculateDifficulty(distance: number, weather: WeatherConditions, preferences: UserPreferences): 'easy' | 'moderate' | 'hard' {
    // Get how weather affects the route
    const weatherImpact = weatherService.getWeatherImpactOnRoute(weather, preferences.weatherSensitivity);
    
    // adjust distance based on weather
    const adjustedDistance = distance * weatherImpact.distanceMultiplier;
    
    // use distance in km + weather to calculate difficulty
    const difficultyScore = adjustedDistance / 1000 + weatherImpact.difficultyAdjustment;

    if (difficultyScore < 2) return 'easy';
    if (difficultyScore < 4) return 'moderate';
    return 'hard';
  }

  private calculateSafetyScore(points: RoutePoint[], weather: WeatherConditions, preferences: UserPreferences): number {
    let score = BASE_SAFETY_SCORE;

    const weatherImpact = weatherService.getWeatherImpactOnRoute(weather, preferences.weatherSensitivity);
    score += weatherImpact.safetyAdjustment;
    score += this.getRouteLengthSafetyPenalty(points.length);
    score += this.getTimeOfDaySafetyPenalty();
    score += this.getWeatherCodeSafetyPenalty(weather.weatherCode);

    return Math.max(0, Math.min(100, score));
  }

  private getRouteLengthSafetyPenalty(pointCount: number): number {
    if (pointCount > 100) return 20; // very long route
    if (pointCount > 50) return 10;  // long route
    return 0; // short route
  }

  private getTimeOfDaySafetyPenalty(): number {
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) return 10; // very late/early
    if (hour < 8 || hour > 20) return 5;  // late/early
    return 0; // daytime
  }

  private getWeatherCodeSafetyPenalty(weatherCode: number): number {
    if (weatherCode >= 200 && weatherCode < 300) return -20; // thunderstorms
    if (weatherCode >= 600 && weatherCode < 700) return -8;  // snow
    return 0;
  }

  private generateRouteName(distance: number, weather: WeatherConditions, preferences: UserPreferences): string {
    const weatherIcon = weatherService.getWeatherIcon(weather.weatherCode);
    const timeOfDay = this.getTimeOfDay();
    const randomAdjective = this.getRandomAdjective();
    
    return `${weatherIcon} ${randomAdjective} ${timeOfDay} Walk`;
  }

  private getRandomAdjective(): string {
    const adjectives = ['Scenic', 'Peaceful', 'Adventure', 'Discovery', 'Explorer', 'Wanderer'];
    return adjectives[Math.floor(Math.random() * adjectives.length)];
  }

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    if (hour < 20) return 'Evening';
    return 'Night';
  }

  private generateRouteId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `route_${timestamp}_${random}`;
  }

}

export const routeGenerationService = new RouteGenerationService();
