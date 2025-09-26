import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { UserStats, formatDate } from '@/utils';
import { databaseService } from '@/services/DatabaseService';
import { locationService } from '@/services/LocationService';
import { usePreferences } from '@/context/AppContext';

import { card } from '@/styles/common';

export default function StatsScreen() {
  const { units } = usePreferences();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = async () => {
    try {
      const data = await databaseService.getUserStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (isLoading || !stats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading stats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Stats</Text>
          <Text style={styles.subtitle}>Track your walking progress</Text>
        </View>

        <View style={styles.overviewSection}>
          <LinearGradient
            colors={['#4A90E2', '#357ABD']}
            style={styles.overviewGradient}
          >
            <View style={styles.overviewContent}>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewValue}>{stats.totalRoutes}</Text>
                <Text style={styles.overviewLabel}>Routes</Text>
              </View>
              <View style={styles.overviewDivider} />
              <View style={styles.overviewItem}>
                <Text style={styles.overviewValue}>{locationService.formatDistance(stats.totalDistance, units)}</Text>
                <Text style={styles.overviewLabel}>Total Distance</Text>
              </View>
              <View style={styles.overviewDivider} />
              <View style={styles.overviewItem}>
                <Text style={styles.overviewValue}>{locationService.formatDuration(stats.totalTime)}</Text>
                <Text style={styles.overviewLabel}>Total Time</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Streak</Text>
          <View style={styles.streakContainer}>
            <View style={styles.info}>
              <Text style={styles.icon}>🔥</Text>
              <View style={styles.text}>
                <Text style={styles.value}>{stats.currentStreak} days</Text>
                <Text style={styles.label}>Current Streak</Text>
              </View>
            </View>
          </View>
        </View>

        {stats.lastWalkDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Last Walk</Text>
            <View style={styles.card}>
              <Ionicons name="time-outline" size={20} color="#4A90E2" />
              <Text style={styles.cardText}>{formatDate(stats.lastWalkDate)}</Text>
            </View>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={loadStats}
            accessibilityRole="button"
          >
            <Ionicons name="refresh" size={24} color="#4A90E2" />
            <Text style={styles.actionText}>Refresh Stats</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  overviewSection: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  overviewGradient: {
    padding: 20,
  },
  overviewContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  overviewItem: {
    alignItems: 'center',
    flex: 1,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  overviewLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  overviewDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  section: {
    ...card,
    marginHorizontal: 20,
    marginVertical: 5,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 32,
    marginRight: 15,
  },
  text: {
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  cardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  actions: {
    padding: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
    marginLeft: 8,
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