// Distance conversion
export const MILES_TO_METERS = 1609.34;
export const KM_TO_METERS = 1000;

// Map settings
export const MAP_HEIGHT = 300;
export const DEFAULT_LATITUDE_DELTA = 0.01;
export const DEFAULT_LONGITUDE_DELTA = 0.01;

// Route generation
export const DIRECTIONS_BASE_URL = 'https://maps.googleapis.com/maps/api/directions/json';
export const DIRECTIONS_TIMEOUT_MS = 10000; // 10s

// Default values
export const DEFAULT_WEATHER = {
  temperature: 20,
  humidity: 50,
  windSpeed: 10,
  windDirection: 0,
  precipitation: 0,
  weatherCode: 800,
  description: 'Clear',
  icon: '☀️'
} as const;

export const DEFAULT_USER_PREFERENCES = {
  preferredDuration: 30,
  avoidHighways: true,
  preferShadedRoutes: true,
  preferQuietStreets: true,
  weatherSensitivity: 'medium' as const,
  units: 'metric' as const,
  temperatureUnits: 'celsius' as const,
  enableWeatherAlerts: false,
  enableMorningNotifications: false,
  morningNotificationTime: 8
} as const;
