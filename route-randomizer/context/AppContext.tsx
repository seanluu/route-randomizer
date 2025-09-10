import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { databaseService } from '@/services/DatabaseService';

export type Units = 'metric' | 'imperial';

interface AppContextType {
    units: Units;
    setUnits: (units: Units) => void;
    temperatureUnits: 'celsius' | 'fahrenheit';
    setTemperatureUnits: (units: 'celsius' | 'fahrenheit') => void;
    formatTemperature: (celsius: number) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined); // use the interface

interface AppProviderProps {
    children: ReactNode;
}

export function AppProvider ({ children }: AppProviderProps) {

    const [units, setUnitsState] = useState<Units>('metric');
    const [temperatureUnits, setTemperatureUnitsState] = useState<'celsius' | 'fahrenheit'>('celsius');
    // Removed unused isInitialized state

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        const preferences = await databaseService.getUserPreferences();

        if (preferences) {
            if (preferences.units) {
                setUnitsState(preferences.units);
            } 
            if (preferences.temperatureUnits) {
                setTemperatureUnitsState(preferences.temperatureUnits);
            }
        }
    };

    const savePreference = async (key: 'units' | 'temperatureUnits', value: any) => {
        const preferences = await databaseService.getUserPreferences();
        if (preferences) {
            const updatedPreferences = { ...preferences, [key]: value };
            await databaseService.saveUserPreferences(updatedPreferences);
        }
    };

    const handleSetUnits = async (units: Units) => {
        setUnitsState(units);
        await savePreference('units', units);
    };

    const handleSetTemperatureUnits = async (units: 'celsius' | 'fahrenheit') => {
        setTemperatureUnitsState(units);
        await savePreference('temperatureUnits', units);
    };

    const formatTemperature = (celsius: number): string => {
        const temp = temperatureUnits === 'celsius' ? celsius : (celsius * 9/5) + 32;
        const unit = temperatureUnits === 'celsius' ? '°C' : '°F';
        return `${Math.round(temp)}${unit}`;
    }

    const value: AppContextType = {
        units,
        setUnits: handleSetUnits,
        temperatureUnits: temperatureUnits,
        setTemperatureUnits: handleSetTemperatureUnits,
        formatTemperature,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp(): AppContextType {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}

// hook for only units data and functions
export const useUnits = () => {
    const { units, setUnits } = useApp();
    return { units, setUnits };
};

// hook for only temperature data and functions
export const useTemperature = () => {
    const { temperatureUnits, setTemperatureUnits, formatTemperature } = useApp();
    return { temperatureUnits, setTemperatureUnits, formatTemperature };
}
