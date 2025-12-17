const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

module.exports = {
  expo: {
    name: "route-randomizer",
    slug: "route-randomizer",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "routerandomizer",
    userInterfaceStyle: "automatic",
    newArchEnabled: false,
    ios: {
      supportsTablet: true
    },
    android: {
      edgeToEdgeEnabled: true
    },
    web: {
      bundler: "metro",
      output: "static"
    },
    plugins: [
      "expo-router",
      "expo-sqlite",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#ffffff"
        }
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow $(PRODUCT_NAME) to use your location to generate walking routes."
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      weatherApiKey: process.env.WEATHER_API_KEY
    }
  }
};

