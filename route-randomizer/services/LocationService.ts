import * as Location from 'expo-location';
import { Location as LocationType } from '@/utils';
import { MILES_TO_METERS, KM_TO_METERS } from '@/constants';

class LocationService {
  // Cache the last known location for fallback
  private lastKnownLocation: LocationType | null = null;

  
  // Request location permissions from the user
  async requestPermissions(): Promise<boolean> {
    // try catch is basically second to if else (handles errors) after them
    try {
      const result = await Location.requestForegroundPermissionsAsync();
      return result.status === 'granted';
    } catch (error) {
      console.error('Failed to request location permissions:', error);
      return false;
    }
  }

  // Check if location permissions are already granted
  async checkPermissions(): Promise<boolean> {
    try {
      const result = await Location.getForegroundPermissionsAsync();
      return result.status === 'granted';
    } catch (error) {
      console.error('Failed to check location permissions:', error);
      return false;
    }
  }

  // Get the user's current location
  async getCurrentLocation(): Promise<LocationType | null> {
    const hasPermission = await this.checkPermissions();
    if (!hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) {
        return await this.getLastKnownLocation();
      }
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 2000,
        distanceInterval: 10,
      });

      const currentLocation: LocationType = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      this.lastKnownLocation = currentLocation;
      return currentLocation;
    } catch (error) {
      console.error('Failed to get current location:', error);
      return await this.getLastKnownLocation();
    }
  }

  // Get the last known location (cached or from device)
  async getLastKnownLocation(): Promise<LocationType | null> {
    if (this.lastKnownLocation) {
      return this.lastKnownLocation;
    }

    try {
      const location = await Location.getLastKnownPositionAsync({});
      if (location) {
        this.lastKnownLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        return this.lastKnownLocation;
      }
      return null;
    } catch (error) {
      console.error('Failed to get last known location:', error);
      return null;
    }
  }

  // Format distance in meters to a readable string
  formatDistance(distance: number, units: 'metric' | 'imperial' = 'metric'): string {
    if (units === 'imperial') {
      const miles = distance / MILES_TO_METERS;
      return `${miles.toFixed(1)} mi`;
    }
    // Always show kilometers for metric units, even for short distances
    const km = distance / KM_TO_METERS;
    return `${km.toFixed(1)} km`;
  }

  // Format duration in seconds to a readable string
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
}

export const locationService = new LocationService();
