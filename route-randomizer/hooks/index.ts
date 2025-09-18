import { useState } from 'react';
import { locationService } from '@/services/LocationService';
import { Location } from '@/utils';

export function useCurrentLocation() {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loc = await locationService.getCurrentLocation();
      if (loc) {
        setCurrentLocation(loc);
      } else {
        const fallback = await locationService.getLastKnownLocation();
        setCurrentLocation(fallback);
        setError('Using fallback location.');
      }
    } catch {
      setError('Unable to get location.');
    } finally {
      setIsLoading(false);
    }
  };

  return { currentLocation, isLoading, error, fetchLocation };
}

