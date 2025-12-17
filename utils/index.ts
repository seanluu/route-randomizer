// Types
export interface Location {
  latitude: number;
  longitude: number;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface Route {
  id: string;
  name: string;
  distance: number; // in meters
  duration: number; // in seconds
  points: RoutePoint[];
  startLocation: Location;
  endLocation: Location;
  weatherConditions: WeatherConditions;
  createdAt: Date;
  walkedAt?: Date;
  difficulty: 'easy' | 'moderate' | 'hard';
  safetyScore: number; // 0-100
}

export interface WeatherConditions {
  temperature: number; // Celsius
  humidity: number; // percentage
  windSpeed: number; // km/h
  windDirection: number; // degrees
  precipitation: number; // mm
  weatherCode: number; // OpenWeatherMap codes
  description: string;
  icon: string;
}

export interface UserPreferences {
  preferredDuration: number; // in minutes
  avoidHighways: boolean;
  preferShadedRoutes: boolean;
  preferQuietStreets: boolean;
  weatherSensitivity: 'low' | 'medium' | 'high';
  units?: 'metric' | 'imperial'; // metric = km, imperial = miles
  temperatureUnits?: 'celsius' | 'fahrenheit'; // temperature display preference
  // Notification preferences
  enableWeatherAlerts?: boolean; // Enable weather-based notifications
  enableMorningNotifications?: boolean; // Enable morning weather summary
  morningNotificationTime?: number; // Hour for morning notification (0-23)
}

export interface RouteGenerationOptions {
  startLocation: Location;
  distance: number;
  preferences: UserPreferences;
  weatherConditions: WeatherConditions;
}

export interface UserStats {
  totalRoutes: number;
  totalDistance: number; // in meters
  totalTime: number; // in seconds
  currentStreak: number;
  lastWalkDate?: Date;
}


// Simple color utilities
const colors = {
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
};

// Get color for difficulty level
export const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty.toLowerCase()) {
    case 'easy': return colors.success;    // Green for easy
    case 'moderate': return colors.warning; // Orange for moderate
    case 'hard': return colors.error;       // Red for hard
    default: return colors.success;         // Default to green
  }
};

export const getSafetyColor = (score: number): string => {
  if (score >= 80) return colors.success;  // Green for safe
  if (score >= 60) return colors.warning;  // Orange for moderate
  return colors.error;                     // Red for unsafe
};

export function getWindSpeedText(windSpeed: number, units: 'metric' | 'imperial' | string): string {
  if (units === 'imperial') {
    return `${Math.round(windSpeed / 1.60934)} mph`;
  }
  return `${Math.round(windSpeed)} km/h`;
}

export function formatDate(date: Date): string {
  try {
    return date.toLocaleDateString();
  } catch {
    return new Date(date).toLocaleDateString();
  }
}


// Navigation utilities
export const serializeRouteForNavigation = (route: Route) => {
  const serialized = {
    id: route.id,
    name: route.name,
    distance: route.distance,
    duration: route.duration,
    points: route.points ? route.points.map(point => ({
      latitude: point.latitude,
      longitude: point.longitude,
    })) : [],
    startLocation: {
      latitude: route.startLocation.latitude,
      longitude: route.startLocation.longitude
    },
    endLocation: {
      latitude: route.endLocation.latitude,
      longitude: route.endLocation.longitude
    },
    weatherConditions: route.weatherConditions,
    createdAt: route.createdAt.toISOString(),
    walkedAt: route.walkedAt ? route.walkedAt.toISOString() : undefined,
  };
  
  return serialized;
};

