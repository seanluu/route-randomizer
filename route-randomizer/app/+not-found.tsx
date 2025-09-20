import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function NotFoundScreen() {
  const router = useRouter();
  
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#4A90E2', '#357ABD']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Ionicons name="warning-outline" size={80} color="#fff" />
          <Text style={styles.title}>Page Not Found</Text>
          <Text style={styles.subtitle}>
            The page you are looking for does not exist.
          </Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/(tabs)')}
          >
            <Ionicons name="home" size={20} color="#4A90E2" />
            <Text style={styles.buttonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 40,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
