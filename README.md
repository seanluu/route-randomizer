# 🚶‍♂️ Route Randomizer

Route Randomizer is a mobile app that generates random walking routes based on distance, weather, and your preferences, and finds new routes so they don't get repetitive in your daily routine, and also keeps track of your walking history and stats, and adapts to current weather conditions.

## 🔧 Installation

Clone the repo and install dependencies:
```bash
git clone https://github.com/seanluu/route-randomizer3.git
cd route-randomizer3
npm install
```

Create a `.env` file with your API keys:
```bash
GOOGLE_MAPS_API_KEY=your_key_here
WEATHER_API_KEY=your_key_here
```

Get API keys:
- Google Maps: Go to [Google Cloud Console](https://console.cloud.google.com/), enable Directions API, create credentials
- Weather: Sign up at [WeatherAPI.com](https://www.weatherapi.com/) and grab your key

Run the app:
```bash
npm start          # development with Expo Go
npm run ios        # iOS simulator
npm run android    # Android emulator
```

## ✨ Features

- Random route generation that loops back to your starting point
- Real-time weather integration
- Safety scoring for routes
- Distance slider (0.5 to 5 miles or 1 to 8 km)
- Google Maps with route visualization
- Route history stored in SQLite
- Statistics tracking
- Customizable preferences (units, avoid highways, prefer shade)
- Offline storage
- Works on both iOS and Android

## 🧰 Tech Stack
- React Native
- Expo
- TypeScript
- Google Maps Directions API
- WeatherAPI.com
- SQLite
- React Native Maps
- Expo Location
- Context API
- AsyncStorage
