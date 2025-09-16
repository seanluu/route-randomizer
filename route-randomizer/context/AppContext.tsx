import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { databaseService } from '@/services/DatabaseService';

// Type definitions for the app's unit systems
export type Units = 'metric' | 'imperial';

// Interface defining what data and functions the context provides
interface AppContextType {
  // Distance units (metric = km, imperial = miles)
  units: Units;
  setUnits: (units: Units) => void;
  
  // Temperature units
  temperatureUnits: 'celsius' | 'fahrenheit';
  setTemperatureUnits: (units: 'celsius' | 'fahrenheit') => void;
  formatTemperature: (celsius: number) => string;
}

// Create the context (this will be used by components to access app state)
const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

// Main provider component that wraps the entire app
export function AppProvider({ children }: AppProviderProps) {
  // State for distance units (metric or imperial)
  const [units, setUnitsState] = useState<Units>('metric');
  
  // State for temperature units (celsius or fahrenheit)
  const [temperatureUnits, setTemperatureUnitsState] = useState<'celsius' | 'fahrenheit'>('celsius');
  

  // Load user preferences from database when the app starts
  useEffect(() => {
    loadPreferences();
  }, []);

  // Load saved preferences from the database
  const loadPreferences = async () => {
    const preferences = await databaseService.getUserPreferences();
    if (preferences) {
      // Update units if saved in database
      if (preferences.units) {
        setUnitsState(preferences.units);
      }
      // Update temperature units if saved in database
      if (preferences.temperatureUnits) {
        setTemperatureUnitsState(preferences.temperatureUnits);
      }
    }
  };

  // Helper function to save preferences to database
  const savePreference = async (key: 'units' | 'temperatureUnits', value: any) => {
    const preferences = await databaseService.getUserPreferences();
    if (preferences) {
      const updatedPreferences = { ...preferences, [key]: value };
      await databaseService.saveUserPreferences(updatedPreferences);
    }
  };

  // Handle changing distance units (metric/imperial)
  const handleSetUnits = async (newUnits: Units) => {
    setUnitsState(newUnits);
    await savePreference('units', newUnits);
  };

  // Handle changing temperature units (celsius/fahrenheit)
  const handleSetTemperatureUnits = async (newUnits: 'celsius' | 'fahrenheit') => {
    setTemperatureUnitsState(newUnits);
    await savePreference('temperatureUnits', newUnits);
  };

  // Format temperature with the appropriate unit symbol
  const formatTemperature = (celsius: number): string => {
    const temp = temperatureUnits === 'fahrenheit' ? (celsius * 9/5) + 32 : celsius;
    const unit = temperatureUnits === 'fahrenheit' ? '°F' : '°C';
    return `${Math.round(temp)}${unit}`;
  };

  // Create the context value object
  const value: AppContextType = {
    units,
    setUnits: handleSetUnits,
    temperatureUnits,
    setTemperatureUnits: handleSetTemperatureUnits,
    formatTemperature,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to access the app context (must be used inside AppProvider)
export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Simplified hook - get all app context data
export const useAppContext = () => {
  return useApp();
};
