import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Location, Route } from '../utils';
import { MAP_HEIGHT, DEFAULT_LATITUDE_DELTA, DEFAULT_LONGITUDE_DELTA } from '@/constants';

interface RouteMapProps {
  route?: Route | null;
  currentLocation?: Location | null;
  style?: object;
}

export const RouteMap: React.FC<RouteMapProps> = ({
  route,
  currentLocation,
  style,
}) => {
  const mapRef = useRef<MapView>(null);

  // Helper function to calculate map region based on route or location
  const calculateMapRegion = () => {
    // If we have a route with points, show the entire route
    if (route?.points && route.points.length > 0) {
      const lats = route.points.map(p => p.latitude);
      const lngs = route.points.map(p => p.longitude);
      
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max((maxLat - minLat) * 1.2, 0.01),
        longitudeDelta: Math.max((maxLng - minLng) * 1.2, 0.01),
      };
    }
    
    // If we have current location but no route, show current location
    if (currentLocation) {
      return {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: DEFAULT_LATITUDE_DELTA,
        longitudeDelta: DEFAULT_LONGITUDE_DELTA,
      };
    }
    
    // default location is San Francisco
    return {
      latitude: 37.7749,
      longitude: -122.4194,
      latitudeDelta: DEFAULT_LATITUDE_DELTA,
      longitudeDelta: DEFAULT_LONGITUDE_DELTA,
    };
  };

  const centerOnLocation = () => {
    if (mapRef.current) {
      const region = calculateMapRegion();
      mapRef.current.animateToRegion(region, 1000);
    }
  };

  // Get initial region for map
  const getInitialRegion = () => {
    return calculateMapRegion();
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={getInitialRegion()}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
      >
        {/* Refresh button */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={centerOnLocation}
        >
          <Ionicons name="refresh" size={20} color="#4A90E2" />
        </TouchableOpacity>

        {/* Current location marker */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Your Location"
            pinColor="#4A90E2"
          />
        )}

        {/* Route polyline */}
        {route?.points && (
          <Polyline
            coordinates={route.points}
            strokeColor="#4A90E2"
            strokeWidth={4}
          />
        )}

        {route?.startLocation && (
          <Marker
            coordinate={route.startLocation}
            title="Start"
            pinColor="#4CAF50"
          />
        )}

        {route?.endLocation && (
          <Marker
            coordinate={route.endLocation}
            title="End"
            pinColor="#F44336"
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  map: {
    height: MAP_HEIGHT,
    width: '100%',
  },
  
  refreshButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});
