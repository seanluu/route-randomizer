import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WeatherConditions, getWindSpeedText } from '@/backend/utils';
import { card } from '@/styles/common';
import { weatherService } from '@/backend/services/WeatherService';
import { usePreferences } from '@/context/AppContext';

interface WeatherCardProps {
  weather: WeatherConditions;
}

export default function WeatherCard({ weather }: WeatherCardProps) {
  const { units, temperatureUnits, formatTemperature } = usePreferences();
  const weatherIcon = weatherService.getWeatherIcon(weather.weatherCode);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.mainInfo}>
          <View style={styles.temperatureSection}>
            <Text style={styles.temperature}>{formatTemperature(weather.temperature, temperatureUnits)}</Text>
            <Text style={styles.description}>{weather.description}</Text>
          </View>
          <View style={styles.iconSection}>
            <Text style={styles.weatherIcon}>{weatherIcon}</Text>
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Ionicons name="thermometer" size={16} color="#4A90E2" />
            <Text style={styles.detailText}>{weather.humidity}%</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="speedometer" size={16} color="#4A90E2" />
            <Text style={styles.detailText}>{getWindSpeedText(weather.windSpeed, units || 'metric')}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="rainy" size={16} color="#4A90E2" />
            <Text style={styles.detailText}>{weather.precipitation}mm</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: card,
  content: {
    padding: 20,
  },
  mainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  temperatureSection: {
    flex: 1,
  },
  temperature: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textTransform: 'capitalize',
  },
  iconSection: {
    alignItems: 'center',
  },
  weatherIcon: {
    fontSize: 32,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 8,
    gap: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    color: '#333',
    fontSize: 12,
    marginLeft: 4,
    textAlign: 'center',
  },
});
