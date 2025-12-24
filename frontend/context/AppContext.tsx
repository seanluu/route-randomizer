import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type Units = 'metric' | 'imperial';
export type TemperatureUnits = 'celsius' | 'fahrenheit';

interface PreferencesContextType {
  units: Units;
  temperatureUnits: TemperatureUnits;
  avoidHighways: boolean;
  preferShadedRoutes: boolean;
  setUnits: (units: Units) => Promise<void>;
  setTemperatureUnits: (units: TemperatureUnits) => Promise<void>;
  setAvoidHighways: (value: boolean) => Promise<void>;
  setPreferShadedRoutes: (value: boolean) => Promise<void>;
  formatTemperature: (celsius: number, units: TemperatureUnits) => string;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

interface PreferencesProviderProps {
  children: ReactNode;
}

export const PreferencesProvider: React.FC<PreferencesProviderProps> = ({ children }) => {
  const [units, setUnitsState] = useState<Units>('metric');
  const [temperatureUnits, setTemperatureUnitsState] = useState<TemperatureUnits>('celsius');
  const [avoidHighways, setAvoidHighwaysState] = useState<boolean>(false);
  const [preferShadedRoutes, setPreferShadedRoutesState] = useState<boolean>(false);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [savedUnits, savedTempUnits, savedAvoidHighways, savedPreferShaded] = await Promise.all([
          AsyncStorage.getItem('units').then(units => (units as Units) || 'metric'),
          AsyncStorage.getItem('temperatureUnits').then(units => (units as TemperatureUnits) || 'celsius'),
          AsyncStorage.getItem('avoidHighways').then(value => value === 'true'),
          AsyncStorage.getItem('preferShadedRoutes').then(value => value === 'true')
        ]);
        
        setUnitsState(savedUnits);
        setTemperatureUnitsState(savedTempUnits);
        setAvoidHighwaysState(savedAvoidHighways);
        setPreferShadedRoutesState(savedPreferShaded);
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    };
    
    loadPreferences();
  }, []);

  const setUnits = async (newUnits: Units) => {
    try {
      await AsyncStorage.setItem('units', newUnits);
      setUnitsState(newUnits);
    } catch (error) {
      console.error('Failed to save units:', error);
    }
  };

  const setTemperatureUnits = async (newUnits: TemperatureUnits) => {
    try {
      await AsyncStorage.setItem('temperatureUnits', newUnits);
      setTemperatureUnitsState(newUnits);
    } catch (error) {
      console.error('Failed to save temperature units:', error);
    }
  };

  const setAvoidHighways = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('avoidHighways', value.toString());
      setAvoidHighwaysState(value);
    } catch (error) {
      console.error('Failed to save avoid highways setting:', error);
    }
  };

  const setPreferShadedRoutes = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('preferShadedRoutes', value.toString());
      setPreferShadedRoutesState(value);
    } catch (error) {
      console.error('Failed to save prefer shaded routes setting:', error);
    }
  };

  const formatTemperature = (celsius: number, units: TemperatureUnits): string => {
    if (units === 'fahrenheit') {
      return `${Math.round(celsius * 9/5 + 32)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  const value: PreferencesContextType = {
    units,
    temperatureUnits,
    avoidHighways,
    preferShadedRoutes,
    setUnits,
    setTemperatureUnits,
    setAvoidHighways,
    setPreferShadedRoutes,
    formatTemperature,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};
