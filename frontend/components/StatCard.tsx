import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label?: string;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  color = '#4A90E2'
}) => {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={16} color={color} style={styles.icon} />
      <View style={styles.content}>
        <Text style={styles.value}>{value}</Text>
        {label && <Text style={styles.label}>{label}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  
  icon: {
    marginRight: 8,
  },
  
  content: {
    flex: 1,
  },
  
  value: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  
  label: {
    fontSize: 12,
    color: '#666',
  },
});
