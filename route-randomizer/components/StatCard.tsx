import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label?: string;
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  color = '#4A90E2',
  size = 'medium'
}) => {
  // Size configurations for different stat card sizes
  const sizeConfig = {
    small: { iconSize: 14, textSize: 12 },
    medium: { iconSize: 16, textSize: 14 },
    large: { iconSize: 20, textSize: 16 },
  };

  // Get the current size configuration
  const currentSize = sizeConfig[size];

  return (
    <View style={styles.container}>
      {/* Icon */}
      <Ionicons 
        name={icon} 
        size={currentSize.iconSize} 
        color={color} 
        style={styles.icon}
      />
      
      {/* Content area with value and optional label */}
      <View style={styles.content}>
        <Text style={[styles.value, { fontSize: currentSize.textSize }]}>
          {value}
        </Text>
        {label && (
          <Text style={[styles.label, { fontSize: currentSize.textSize - 2 }]}>
            {label}
          </Text>
        )}
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
    fontWeight: 'bold',
    color: '#333',
  },
  
  label: {
    color: '#666',
  },
});
