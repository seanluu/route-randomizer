import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { databaseService } from '@/services/DatabaseService';
import { locationService } from '@/services/LocationService';
import { Route, serializeRouteForNavigation, formatDate } from '@/utils';
import { usePreferences } from '@/context/AppContext';

export default function RouteHistoryScreen() {
  const { units } = usePreferences();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRoutes = async () => {
    try {
      const data = await databaseService.getAllRoutes();
      setRoutes(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const renderItem = ({ item }: { item: Route }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        const serializable = serializeRouteForNavigation(item);
        router.push({
          pathname: '/route-generation',
          params: { route: JSON.stringify(serializable), isViewingHistory: 'true' },
        });
      }}
    >
      <View style={styles.row}>
        <Text style={styles.name} numberOfLines={1}>{item.name || 'Untitled Route'}</Text>
        <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
      </View>
      <View style={styles.row}>
        <View style={styles.meta}>
          <Ionicons name="map" size={16} color="#4A90E2" />
          <Text style={styles.metaText}>{locationService.formatDistance(item.distance, units)}</Text>
        </View>
        <View style={styles.meta}>
          <Ionicons name="time-outline" size={16} color="#4A90E2" />
          <Text style={styles.metaText}>{locationService.formatDuration(item.duration)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loading}>Loading routes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Route History</Text>
        <Text style={styles.subtitle}>{routes.length} routes</Text>
      </View>

      {routes.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="map-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No routes yet</Text>
          <Text style={styles.emptyText}>Generate a route on the Home tab to get started.</Text>
        </View>
      ) : (
        <FlatList
          data={routes}
          keyExtractor={(r) => r.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

export const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
},
  header: { 
    padding: 20, 
    paddingBottom: 10 
},
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#333' 
},
  subtitle: { 
    fontSize: 16, 
    color: '#666' 
  },

  list: { 
    paddingHorizontal: 15, 
    paddingTop: 8, 
    paddingBottom: 20 
  },

  item: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' },
  name: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#333', 
    flex: 1, 
    marginRight: 8 },
  date: { 
    fontSize: 12, 
    color: '#777' },

  meta: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 10, 
    marginRight: 12 
  },
  metaText: { 
    marginLeft: 6, 
    fontSize: 13, 
    color: '#333' 
  },

  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24 
  },
  loading: { 
    marginTop: 12, 
    color: '#555' 
  },

  emptyTitle: { 
    marginTop: 14, 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#333' 
  },
  emptyText: { 
    marginTop: 6, 
    fontSize: 14, 
    color: '#666', 
    textAlign: 'center' 
  },
});