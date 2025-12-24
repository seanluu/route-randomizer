# Route Randomizer

Route Randomizer is a mobile app that generates random walking routes based on your current location, preferred distance, and weather conditions; just select your distance preference and the app will create a unique walking path from your current location, complete with weather-aware safety scoring and navigation integration.

## Installation

**Prerequisites:** Node.js 20+, Expo CLI, iOS Simulator or Android Emulator (or physical device)

```bash
# Clone the repository
git clone https://github.com/seanluu/routerandomiza.git
cd routerandomiza

# Set up frontend
npm install
```

Open http://localhost:8081 (Expo Dev Tools)

### Set up API Keys

1. **Google Maps API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Maps JavaScript API and Directions API
   - Create credentials (API Key)
   - Add `GOOGLE_MAPS_API_KEY=your_key_here` to `.env` file

2. **Weather API Key:**
   - Go to [WeatherAPI](https://www.weatherapi.com/)
   - Sign up for a free account
   - Get your API key from the dashboard
   - Add `WEATHER_API_KEY=your_key_here` to `.env` file

## Usage

1. Start the Expo development server: `npm start` (runs on http://localhost:8081)
2. Press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go app
3. Grant location permissions when prompted
4. Select your preferred distance and generate a new route
5. View route details, start navigation in Google Maps, and track your walking progress

## Features

- **Random Route Generation**: Discover new walking paths based on your current location
- **Distance Selection**: Choose from preset distances (0.25mi to 3mi or 0.5km to 5km)
- **Weather Integration**: Routes are generated with current weather conditions in mind
- **Route History**: Save and view all your generated routes with search and filter options
- **Progress Tracking**: Track total distance, time, and walking streaks
- **Safety Scoring**: Each route includes a safety score based on distance and weather conditions
- **Navigation Integration**: Open routes in Google Maps for turn-by-turn directions
- **Customizable Preferences**: Set distance units (metric/imperial), temperature units, and route preferences

## Tech Stack

- **Frontend**: React Native, Expo, TypeScript, Expo Router
- **Backend**: Route Generation Service, Weather Service, Location Service, Database Service
- **APIs**: Google Maps Directions API, WeatherAPI
- **Database**: SQLite
