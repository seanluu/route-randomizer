module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/backend/(.*)$': '<rootDir>/backend/$1',
    '^@/(.*)$': '<rootDir>/frontend/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|react-clone-referenced-element|@react-navigation|expo(nent)?|@expo(nent)?/.*|@expo/vector-icons|react-native-svg|expo-router)'
  ],
};


