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
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  // Check if location permissions are already granted
  async checkPermissions(): Promise<boolean> {
    try {
      const result = await Location.getForegroundPermissionsAsync();
      return result.status === 'granted';
    } catch (error) {
      console.error('Error checking location permissions:', error);
      return false;
    }
  }

  // Get the user's current location
  async getCurrentLocation(): Promise<LocationType | null> {
    // Check if we have permission first
    const hasPermission = await this.checkPermissions();
    if (!hasPermission) {
      // Try to request permission
      const granted = await this.requestPermissions();
      if (!granted) {
        console.error('Location permission denied');
        // Fall back to last known location
        const lastKnown = await this.getLastKnownLocation();
        return lastKnown;
      }
    }

    // Try to get current location
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 2000, // Wait up to 2 seconds for location
        distanceInterval: 10,
      });

      const currentLocation: LocationType = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Cache this location for future use
      this.lastKnownLocation = currentLocation;
      return currentLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      
      // If current location fails, try last known location
      const lastKnown = await this.getLastKnownLocation();
      if (lastKnown) {
        return lastKnown;
      }
      
      return null;
    }
  }

  // Get the last known location (cached or from device)
  async getLastKnownLocation(): Promise<LocationType | null> {
    // Return cached location if available
    if (this.lastKnownLocation) {
      return this.lastKnownLocation;
    }

    try {
      // Try to get last known position from device
      const location = await Location.getLastKnownPositionAsync({});
      
      if (location) {
        this.lastKnownLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        return this.lastKnownLocation;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting last known location:', error);
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