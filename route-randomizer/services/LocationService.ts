import * as Location from 'expo-location'; // shout out Expo dawg
import { Location as LocationType } from '@/utils';
import { MILES_TO_METERS, KM_TO_METERS } from '@/constants';

class LocationService {

  // Grab user's last known location for fallback info if we can't get current one
  private lastKnownLocation: LocationType | null = null;

  // Request location perms
  async requestPermissions(): Promise<boolean> {
    try {
      const result = await Location.requestForegroundPermissionsAsync();
      return result.status === 'granted'; // this is included in the Expo framework so we don't have to make it ourselves
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  // Check if perms are enabled
  async checkPermissions(): Promise<boolean> {
    try {
      const result = await Location.getForegroundPermissionsAsync();
      return result.status === 'granted';
    } catch (error) {
      console.error('Error checking location permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationType | null> {
    // Check if we have perms, if we don't then request perms again
    const hasPermission = await this.checkPermissions();
    if (!hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) {
        console.warn('Location permissions denied.');
        const lastKnown = await this.getLastKnownLocation();
        return lastKnown;
      }
    }

    // Worst case scenario just grab current location
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 2000, // wait 2 seconds for location
        distanceInterval: 10,
      });

      const currentLocation: LocationType = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Remember this location for later use by caching
      this.lastKnownLocation = currentLocation; // update last known location
      return currentLocation;
    } catch (error) {
      console.error('Error getting current location:', error);

      // If we can't get current location, return last known location
      const lastKnown = await this.getLastKnownLocation();
      if (lastKnown) {
        return lastKnown
      }
      return null;
    }
  }

  async getLastKnownLocation(): Promise<LocationType | null> {
    if (this.lastKnownLocation) { // cached location if it's available
      return this.lastKnownLocation;
    }

    // Otherwise, try very very hard to get the last known location from device
    try {
      const location = await Location.getLastKnownPositionAsync();
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

  formatDistance(distance: number, units: 'metric' | 'imperial' = 'metric'): string {
    
    // if user selects miles, then we use imperial system
    if (units === 'imperial') { 
      const miles = distance / MILES_TO_METERS;
      return `${miles.toFixed(1)} mi`;
    }

    // otherwise use km (metric system)
    const kilometers = distance / KM_TO_METERS;
    return `${kilometers.toFixed(1)} km`;
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    } else {
      return `${minutes} min`;
    }
  }
}

export const locationService = new LocationService();