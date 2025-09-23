import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { databaseService } from '@/services/DatabaseService';
import { locationService } from '@/services/LocationService';
import { Route, serializeRouteForNavigation, getDifficultyColor, getSafetyColor, formatDate } from '@/utils';

import { StatCard } from '@/components/StatCard';

import { usePreferences } from '@/context/AppContext';

export default function RouteHistoryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  
  const { units } = usePreferences();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRoutes = async () => {
    try {
      const data = await databaseService.getAllRoutes();
      setRoutes(data);
    } catch (error) {
      console.error('Failed to load routes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const filteredRoutes = routes.filter(route => {
    try {

      if (filter === 'completed' && !route.walkedAt) return false;
      if (filter === 'pending' && route.walkedAt) return false;

      if (searchQuery) {
        return route.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      }

      return true;
    } catch (error) {
      console.error('Error filtering route:', error);
      return false;
    }
  });

  const deleteRoute = (routeId: string) => {
    Alert.alert(
      'Delete Route',
      'Are you sure you want to delete this route? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteRoute(routeId);
              loadRoutes(); // Refresh the routes list
            } catch (error) {
              console.error('Failed to delete route:', error);
              Alert.alert('Error', 'Failed to delete route.');
            }
          },
        },
      ]
    );
  };

  const markAsCompleted = async (routeId: string) => {
    try {
      await databaseService.markRouteAsWalked(routeId);
      loadRoutes(); // Refresh the routes list
      Alert.alert('Route Completed!', 'Great job!');
    } catch (error) {
      console.error('Failed to mark route as completed:', error);
      Alert.alert('Error', 'Failed to mark route as completed.');
    }
  };

  const renderRouteItem = ({ item }: { item: Route }) => (
    <TouchableOpacity
      style={styles.routeCard}
      onPress={() => {
        const serializableRoute = serializeRouteForNavigation(item);
        router.push({
          pathname: '/route-generation',
          params: {
            route: JSON.stringify(serializableRoute),
            isViewingHistory: 'true'
          }
        });
      }}
    >
      <View style={styles.routeHeader}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeName}>{item.name}</Text>
          <Text style={styles.routeDate}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
        <View style={styles.routeActions}>
          {item.walkedAt ? (
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => markAsCompleted(item.id)}
            >
              <Ionicons name="checkmark" size={16} color="#4CAF50" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteRoute(item.id)}
          >
            <Ionicons name="trash" size={16} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.routeStats}>
        <StatCard
          icon="map"
          value={locationService.formatDistance(item.distance, units)}
          color="#4A90E2"
        />
        <StatCard
          icon="time-outline"
          value={locationService.formatDuration(item.duration)}
          color="#4A90E2"
        />
        <StatCard
          icon="trending-up"
          value={item.difficulty.toUpperCase()}
          color={getDifficultyColor(item.difficulty)}
        />
        <StatCard
          icon="shield-checkmark"
          value={`${item.safetyScore}%`}
          color={getSafetyColor(item.safetyScore)}
        />
      </View>

    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading routes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Route History</Text>
        <Text style={styles.subtitle}>{filteredRoutes.length} routes found</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search routes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'completed' && styles.filterButtonActive]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterButtonText, filter === 'completed' && styles.filterButtonTextActive]}>Completed</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterButtonText, filter === 'pending' && styles.filterButtonTextActive]}>Pending</Text>
        </TouchableOpacity>
      </View>

      {filteredRoutes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="map-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No routes found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery || filter !== 'all' 
              ? 'Try adjusting your search or filter'
              : 'Generate your first route to get started'
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRoutes}
          renderItem={renderRouteItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 20,
    marginTop: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#4A90E2',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 15,
    paddingTop: 10,
  },
  routeCard: {
    borderRadius: 16,
    padding: 15,
    marginBottom: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routeInfo: {
    flex: 1,
    marginRight: 10,
  },
  routeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  routeDate: {
    fontSize: 12,
    color: '#666',
  },
  routeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  completeButton: {
    padding: 4,
    marginRight: 8,
  },
  deleteButton: {
    padding: 4,
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  emptyContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#555',
  },
});
