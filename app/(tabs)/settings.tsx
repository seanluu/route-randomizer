import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreferences } from '@/context/AppContext';
import { card } from '@/styles/common';

export default function SettingsScreen() {
  const {
    units,
    temperatureUnits,
    avoidHighways,
    preferShadedRoutes,
    setUnits,
    setTemperatureUnits,
    setAvoidHighways,
    setPreferShadedRoutes,
  } = usePreferences();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Customize your route preferences</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Distance Units</Text>
              <Text style={styles.settingDescription}>Display distances in miles or kilometers</Text>
            </View>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={[styles.pickerOption, units === 'imperial' && styles.pickerOptionSelected]}
                onPress={() => setUnits('imperial')}
              >
                <Text style={units === 'imperial' ? styles.pickerOptionTextSelected : styles.pickerOptionText}>
                  Miles
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerOption, units === 'metric' && styles.pickerOptionSelected]}
                onPress={() => setUnits('metric')}
              >
                <Text style={units === 'metric' ? styles.pickerOptionTextSelected : styles.pickerOptionText}>
                  Kilometers
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Temperature Units</Text>
              <Text style={styles.settingDescription}>Display temperature in Celsius or Fahrenheit</Text>
            </View>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={[styles.pickerOption, temperatureUnits === 'fahrenheit' && styles.pickerOptionSelected]}
                onPress={() => setTemperatureUnits('fahrenheit')}
              >
                <Text style={temperatureUnits === 'fahrenheit' ? styles.pickerOptionTextSelected : styles.pickerOptionText}>
                  Fahrenheit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerOption, temperatureUnits === 'celsius' && styles.pickerOptionSelected]}
                onPress={() => setTemperatureUnits('celsius')}
              >
                <Text style={temperatureUnits === 'celsius' ? styles.pickerOptionTextSelected : styles.pickerOptionText}>
                  Celsius
                </Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route Preferences</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Avoid Highways</Text>
              <Text style={styles.settingDescription}>Prefer quieter residential streets</Text>
            </View>
            <Switch
              value={avoidHighways}
              onValueChange={setAvoidHighways}
              trackColor={{ false: '#e0e0e0', true: '#4A90E2' }}
              thumbColor={avoidHighways ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Prefer Shaded Routes</Text>
              <Text style={styles.settingDescription}>Choose routes with more tree cover</Text>
            </View>
            <Switch
              value={preferShadedRoutes}
              onValueChange={setPreferShadedRoutes}
              trackColor={{ false: '#e0e0e0', true: '#4A90E2' }}
              thumbColor={preferShadedRoutes ? '#fff' : '#f4f3f4'}
            />
          </View>

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
  
  scrollView: {
    flex: 1,
    padding: 15,
  },
  
  header: {
    marginBottom: 20,
  },
  
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  
  section: {
    ...card,
    marginBottom: 4,
    padding: 12,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  
  settingInfo: {
    flex: 1,
    marginRight: 10,
  },
  
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  
  settingDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  
  pickerContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 2,
  },
  
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 2,
  },
  
  pickerOptionSelected: {
    backgroundColor: '#4A90E2',
  },
  
  pickerOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A90E2',
  },
  
  pickerOptionTextSelected: {
    color: '#fff',
  },

});