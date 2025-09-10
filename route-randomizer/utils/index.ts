// Types

export interface Location {
  latitude: number;
  longitude: number;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp?: number; // optional timestamp
}

export interface Route {
  id: string;
  name: string;
  distance: number;
  duration: number;
  points: RoutePoint[];
  startLocation: Location;
  endLocation: Location;
  weatherConditions: WeatherConditions;
  createdAt: Date;
  walkedAt?: Date;
  isLoop: boolean;
  difficulty: 'easy' | 'moderate' | 'hard';
  safetyScore: number;
  weatherNotes: string[]; // message about weather conditions
}

export interface WeatherConditions {
  temperature: number; // initially in celsius
  humidity: number; // percentage points
  windSpeed: number; // go through km/s first
  windDirection: number; // degrees
  precipitation: number; // milimeters
  weatherCode: number; // weatherAPI codes for different conditions
  description: string;
  icon: string;
  airQuality?: number; // aqi index
  uvIndex?: number; // uv index
}

export interface UserPreferences {
  preferredDuration: number; // in minutes
  avoidHighways: boolean;
  preferShadedRoutes: boolean;
  preferQuietStreets: boolean;
  weatherSensitivity: 'low' | 'moderate' | 'high';
  units?: 'metric' | 'imperial';
  temperatureUnits?: 'celsius' | 'fahrenheit';
}

export interface RouteGenerationOptions {
  startLocation: Location;
  distance: number;
  preferences: UserPreferences;
  weatherConditions: WeatherConditions;
  // if true, we want to generate a loop from start to end,
  // otherwise we want to generate a point-to-point route
  roundTrip?: boolean;
  endLocation?: Location;
  kCandidates?: number;
}

export interface UserStats {
  totalRoutes: number;
  totalDistance: number; // meters
  totalTime: number; // seconds
  currentStreak: number;
  longestStreak: number;
  uniqueRoutes: number;
  lastWalkDate?: Date;
  // time-based stats below (meters and seconds)
  // later convert to miles based on user preference
  todayRoutes: number;
  todayDistance: number; // meters
  todayTime: number;
  thisWeekRoutes: number;
  thisWeekDistance: number; // meters
  thisWeekTime: number;
  thisMonthRoutes: number;
  thisMonthDistance: number; // meters
  thisMonthTime: number;
  thisYearRoutes: number;
  thisYearDistance: number; // meters
  thisYearTime: number;
}

export interface SafetyInfo {
  score: number; // score how safe the route is from 0 to 100
  warnings: string[];
  recommmendations: string[];
  lightingLevel: 'good' | 'moderate' | 'poor'; // how bright it is outside duh
  trafficLevel: 'low' | 'moderate' | 'high'; // how busy the roads are
}

export interface NavigationState {
  isNavigating: boolean;
  currentRoute?: Route;
  currentLocation?: Location;
  distanceRemaining: number;
  timeRemaining: number;
  isPaused: boolean;
}

// Internal colors
const colors = {

  // Primary colors
  primary: '#4A90E2',
  primaryDark: '357ABD',

  // Success colors
  success: '#4CAF50',
  successDark: '#45A049',

  // Warning colors
  warning: '#FF9800',
  warningDark: '#F57C00',

  // Error colors
  error: '#F44336',
  errorDark: '#D32F2F',

  // Neutral colors
  text: '#333',
  textSecondary: '#666',
  background: '#f5f5f5',
  white: '#fff',

  // Gradient colors
  gradientPrimary: ['#4A90E2', '#357ABD'],
  gradientSuccess: ['#4CAF50', '#45A049'],
  gradientWarning: ['#FF9800', '#F57C00'],
  gradientError: ['#F44336', '#D32F2F'],
  gradientLocation: ['#FF6B6B', '#FF8E8E'],
}

export const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return colors.success; // green -> easy
    case 'moderate':
      return colors.warning; // orange -> moderate
    case 'hard':
      return colors.error; // red -> hard
    default:
      return colors.text; // return green if none specified
  }
};

export const getSafetyColor = (score: number): string => {
  if (score >= 80)
    return colors.success; // green -> safe
  
  if (score >= 60)
    return colors.warning; // orange -> moderate
  
  return colors.error; // red -> unsafe
};

export const getStreakColor = (streak: number): string => {
  if (streak >= 30) 
    return '🔥';
  if (streak >= 7) 
    return '⚡';
  if (streak >= 1) 
    return '💪';

  return '🚀';
}

// Navigation utilities

export const serializeRouteForNavigation = (route: Route) => {

  // Convert Route object to a serializable format
  const serialized = {
    id: route.id,
    name: route.name,
    distance: route.distance,
    duration: route.duration,
    points: route.points ? route.points.map(point => ({
      latitude: point.latitude,
      longitude: point.longitude,
      timestamp: point.timestamp
    })) : [],
    startLocation: {
      latitude: route.startLocation.latitude,
      longitude: route.startLocation.longitude,
    },
    endLocation: {
      latitude: route.endLocation.latitude,
      longitude: route.endLocation.longitude,
    },
    weatherConditions: route.weatherConditions,
    createdAt: route.createdAt.toISOString(),
    walkedAt: route.walkedAt ? route.walkedAt.toISOString() : undefined,
    isLoop: route.isLoop,
    difficulty: route.difficulty,
    safetyScore: route.safetyScore,
    weatherNotes: route.weatherNotes || [] // if no notes, return empty array
  };
    
  return serialized;
};