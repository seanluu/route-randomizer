import { useState, useEffect, useCallback } from 'react';
import { locationService } from '@/services/LocationService';
import { Location } from '@/utils';

// use hooks to reuse certain functions
// specifically, we use them for grabbing current location, loading data

// used in home screen, route generation, weather display
export function useCurrentLocation() {

    const [currentLocation, setCurrentLocation] = useState<Location | null>(null); // state for storing current location of user
    const [isLoading, setIsLoading] = useState(false); // state for loading status
    const [error, setError] = useState<string | null>(null); // state for storing error messages

    const tryFallbackLocation = async () => {
        try {
            const fallback = await locationService.getLastKnownLocation();
            setCurrentLocation(fallback);
            setError('Using fallback location');
        } catch (fallbackErr) {
            setError('Unable to get location.');
        }
    }

    const fetchLocation = async() => { 
        setIsLoading(true);
        setError(null);

        try { // Try to get the current location, otherwise we use fallback location
            const loc = await locationService.getCurrentLocation();
            if (loc) {
                setCurrentLocation(loc);
            } else {
                await tryFallbackLocation();
            }
        } catch (err) {
            setError('Unable to get location.');
        } finally {
            setIsLoading(false);
        }
    }

    return { currentLocation, isLoading, error, fetchLocation };
}

// data loading hook (for basically anything like weather, routes, user prefs, etc)

    export function useDataLoader<T>(loadFunction: () => Promise<T>) {
        const [data, setData] = useState<T | null>(null);
        const [isLoading, setIsLoading] = useState(true);

        const loadData = useCallback(async () => {
            try {
                setIsLoading(true);
                const result = await loadFunction();
                setData(result);
            } catch (error) {
                console.error('Unable to load data.', error);
            } finally {
                setIsLoading(false);
            } 
        }, [loadFunction]);

        useEffect(() => {
            loadData();
        }, [loadData]);

        return { data, isLoading, refresh: loadData };
    }