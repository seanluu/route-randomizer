import { KM_TO_METERS, MILES_TO_METERS } from '@/backend/constants';
import { card } from '@/styles/common';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DistanceSelectorProps {
  selectedDistance: number;
  onDistanceChange: (distance: number) => void;
  units?: 'metric' | 'imperial';
}

const milesToMeters = (miles: number) => Math.round(miles * MILES_TO_METERS);
const kmToMeters = (km: number) => Math.round(km * KM_TO_METERS);

export default function DistanceSelector({ selectedDistance, onDistanceChange, units = 'imperial' }: DistanceSelectorProps) {

  // Get preset distance options based on current units
  const getPresets = () => {
    return units === 'imperial' 
      ? [
          { value: milesToMeters(0.25), label: '0.25 mi' },
          { value: milesToMeters(0.5), label: '0.5 mi' },
          { value: milesToMeters(1), label: '1 mi' },
          { value: milesToMeters(1.5), label: '1.5 mi' },
          { value: milesToMeters(2), label: '2 mi' },
          { value: milesToMeters(3), label: '3 mi' },
        ]
      : [
          { value: kmToMeters(0.5), label: '0.5 km' },
          { value: kmToMeters(1), label: '1 km' },
          { value: kmToMeters(2), label: '2 km' },
          { value: kmToMeters(3), label: '3 km' },
          { value: kmToMeters(5), label: '5 km' },
        ];
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Distance</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetContainer}>
        {getPresets().map((preset) => (
          <TouchableOpacity
            key={preset.value}
            style={[styles.presetButton, selectedDistance === preset.value && styles.presetButtonSelected]}
            onPress={() => onDistanceChange(preset.value)}
          >
            <Ionicons name="walk" size={24} color={selectedDistance === preset.value ? '#fff' : '#4A90E2'} />
            <Text style={[styles.presetLabel, selectedDistance === preset.value && styles.presetLabelSelected]}>
              {preset.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...card,
    marginTop: 5,
    padding: 20,
  },
  header: { marginBottom: 20 },
  title: { 
    fontSize: 18, 
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  presetContainer: { paddingHorizontal: 5 },
  presetButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 5,
    backgroundColor: '#f8f9fa',
    minWidth: 80,
  },
  presetButtonSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  presetLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2',
  },
  presetLabelSelected: { color: '#fff' },
});
