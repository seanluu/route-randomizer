import { PreferencesProvider } from '@/context/AppContext';
import { databaseService } from '@/services/DatabaseService';
import { locationService } from '@/services/LocationService';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize database and location permissions
        await Promise.all([
          databaseService.init(),
          locationService.requestPermissions()
        ]);
        
        setIsReady(true);
      } catch (error) {
        console.error('App initialization failed:', error);
        setIsReady(true);
      } finally {
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Initializing app...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="route-generation" 
            options={{ 
              presentation: 'modal',
              headerShown: false 
            }} 
          />
        </Stack>
        <StatusBar style="light" backgroundColor="#4A90E2" />
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#4A90E2',
    opacity: 0.8,
  },
});
