import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Route, getDifficultyColor, getSafetyColor } from '@/utils';
import { locationService } from '@/services/LocationService';
import { commonCard, commonButton, commonText } from '@/styles/common';

interface RouteCardProps {
  route: Route;
  onStartNavigation?: () => void;
  onViewDetails: () => void;
  units?: 'metric' | 'imperial';
  showNavigationButton?: boolean;
}

export default function RouteCard({ route, onStartNavigation, onViewDetails, units = 'metric', showNavigationButton = true }: RouteCardProps) {

  // Helper function to get safety level text based on score
  const getSafetyLevel = (score: number) => {
    if (score >= 80) return 'Very Safe';
    if (score >= 60) return 'Moderate';
    return 'Use Caution';
  };

  // Check if we should show the navigation button
  const shouldShowNavigation = showNavigationButton && onStartNavigation;

  return (
    <View style={styles.container}>
      {/* Route header with name and difficulty badge */}
      <View style={styles.header}>
        <Text style={styles.routeName}>{route.name}</Text>
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(route.difficulty) }]}>
          <Text style={styles.badgeText}>{route.difficulty.toUpperCase()}</Text>
        </View>
      </View>

      {/* Route statistics (distance, duration, safety) */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="map" size={20} color="#4A90E2" />
          <Text style={styles.statValue}>{locationService.formatDistance(route.distance, units)}</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={20} color="#4A90E2" />
          <Text style={styles.statValue}>{locationService.formatDuration(route.duration)}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="shield-checkmark" size={20} color={getSafetyColor(route.safetyScore)} />
          <Text style={styles.statValue}>{route.safetyScore}%</Text>
          <Text style={styles.statLabel}>{getSafetyLevel(route.safetyScore)}</Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onViewDetails}
        >
          <Ionicons name="information-circle" size={20} color="#4A90E2" />
          <Text style={styles.secondaryButtonText}>Details</Text>
        </TouchableOpacity>

        {shouldShowNavigation && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onStartNavigation}
          >
            <Ionicons name="navigate" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Start Walk</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: commonCard,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    paddingVertical: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  secondaryButton: {
    ...commonButton,
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  secondaryButtonText: {
    ...commonText,
    color: '#4A90E2',
    marginLeft: 5,
  },
  primaryButton: {
    ...commonButton,
    flex: 2,
    backgroundColor: '#4A90E2',
  },
  primaryButtonText: {
    ...commonText,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});
