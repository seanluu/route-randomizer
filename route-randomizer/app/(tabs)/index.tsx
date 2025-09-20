import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { locationService } from '@/services/LocationService';
import { weatherService } from '@/services/WeatherService';

import { Location, WeatherConditions, UserPreferences } from '@/utils';
import { usePreferences } from '@/context/AppContext';

import WeatherCard from '@/components/WeatherCard';
import DistanceSelector from '@/components/DistanceSelector';
import { RouteMap } from '@/components/RouteMap';
import { card, button } from '@/styles/common';

export default function HomeScreen() {
  // States
  const { units, avoidHighways, preferShadedRoutes } = usePreferences();
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [weather, setWeather] = useState<WeatherConditions | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [selectedDistance, setSelectedDistance] = useState(1609);
  
  const userPreferences: UserPreferences = {
    preferredDuration: 30,
    avoidHighways,
    preferShadedRoutes,
    preferQuietStreets: true,
    weatherSensitivity: 'medium',
    units,
    temperatureUnits: 'celsius',
  };

  const initializeApp = async () => {
    setIsLoadingLocation(true);
    
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        const weatherData = await weatherService.getCurrentWeather(location);
        setWeather(weatherData);
      } else {
        // Try fallback location
        const lastLocation = await locationService.getLastKnownLocation();
        if (lastLocation) {
          setCurrentLocation(lastLocation);
          const weatherData = await weatherService.getCurrentWeather(lastLocation);
          setWeather(weatherData);
        } else {
          Alert.alert(
            'Location Required',
            'This app needs your location to generate walking routes. Please enable location permissions in your device settings.',
            [
              { text: 'Settings', onPress: () => locationService.requestPermissions() },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Initialize the app when it first loads
  useEffect(() => {
    initializeApp();
  }, []);

  const generateNewRoute = () => {
    // Check if we have all required data
    if (!currentLocation || !userPreferences || !weather) {
      Alert.alert('Error', 'Unable to generate route. Please check your location and try again.');
      return;
    }

    console.log('Generating route with preferences:', userPreferences.units);

    router.push({
      pathname: '/route-generation',
      params: {
        selectedDistance: selectedDistance.toString(),
        weather: JSON.stringify(weather),
        userPreferences: JSON.stringify(userPreferences),
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Route Randomizer</Text>
          <Text style={styles.subtitle}>Discover new walking paths every day</Text>
        </View>

        {/* Location permission request (shown when location is not available) */}
        {!currentLocation && (
          <View style={styles.locationRequestContainer}>
            <LinearGradient
              colors={['#FF6B6B', '#FF8E8E']}
              style={styles.locationRequestGradient}
            >
              <Ionicons name="location-outline" size={32} color="#fff" />
              <Text style={styles.locationRequestTitle}>Location Required</Text>
              <Text style={styles.locationRequestText}>
                We need your location to generate personalized walking routes
              </Text>
              <TouchableOpacity
                style={styles.locationRequestButton}
                onPress={async () => {
                  setIsLoadingLocation(true);
                  const location = await locationService.getCurrentLocation();
                  if (location) {
                    setCurrentLocation(location);
                    const weatherData = await weatherService.getCurrentWeather(location);
                    setWeather(weatherData);
                  }
                  setIsLoadingLocation(false);
                }}
                disabled={isLoadingLocation}
              >
                <Text style={styles.locationRequestButtonText}>Enable Location</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {weather && (
          <WeatherCard weather={weather} />
        )}

        <DistanceSelector
          selectedDistance={selectedDistance}
          onDistanceChange={setSelectedDistance}
          units={units}
        />

        {/* Map showing current location */}
        {currentLocation && (
          <RouteMap
            currentLocation={currentLocation}
            style={styles.mapContainer}
          />
        )}

        {/* Generate a new walking route */}
        <TouchableOpacity
          style={[styles.generateButton, !currentLocation && styles.generateButtonDisabled]}
          onPress={generateNewRoute}
          disabled={!currentLocation}
        >
          <LinearGradient
            colors={['#4A90E2', '#357ABD']}
            style={styles.generateButtonGradient}
          >
            {!currentLocation ? (
              <>
                <Ionicons name="location-outline" size={24} color="#fff" />
                <Text style={styles.generateButtonText}>Location Required</Text>
              </>
            ) : (
              <>
                <Ionicons name="shuffle" size={24} color="#fff" />
                <Text style={styles.generateButtonText}>Generate New Route</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollView: { flex: 1 },
  scrollViewContent: { 
    paddingBottom: -20, 
  },
  header: { 
    padding: 20, 
    paddingBottom: 10 
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: { 
    fontSize: 16, 
    color: '#666' 
  },
  mapContainer: {
    ...card,
    marginTop: 5,
    borderRadius: 12,
  },
  generateButton: { 
    ...card,
    marginTop: 10,
    borderRadius: 12,
  },
  generateButtonDisabled: { 
    opacity: 0.7,
    marginBottom: -20,
  },
  generateButtonGradient: {
    ...button,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  generateButtonText: { 
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8 
  },
  locationRequestContainer: {
    ...card,
    borderRadius: 12,
  },
  locationRequestGradient: { 
    padding: 20, 
    alignItems: 'center' 
  },
  locationRequestTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  locationRequestText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
  },
  locationRequestButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  locationRequestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
