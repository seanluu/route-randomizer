import '@testing-library/jest-native/extend-expect';

// mocks for native/expo modules used
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MapView = React.forwardRef((props: any, _ref) => React.createElement(View, props));
  MapView.Marker = View;
  MapView.Polyline = View;
  return MapView;
});

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getForegroundPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(async () => ({ coords: { latitude: 37.7749, longitude: -122.4194 } })),
  getLastKnownPositionAsync: jest.fn(async () => null),
  Accuracy: { Balanced: 2 },
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => ({
    execAsync: jest.fn(),
    runAsync: jest.fn(),
    getAllAsync: jest.fn(async () => []),
    withTransactionAsync: jest.fn(async (cb: any) => cb()),
  })),
}));

jest.mock('expo-constants', () => ({
  expoConfig: { extra: { googleMapsApiKey: 'test-google', weatherApiKey: 'test-weather' } },
}));

jest.mock('expo', () => ({}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
}));


