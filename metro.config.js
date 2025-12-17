const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Speed up bundling
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_classnames: true,
    keep_fnames: true,
    mangle: {
      keep_classnames: true,
      keep_fnames: true,
    },
  },
};

config.resetCache = false;

config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    if (platform === 'web' && moduleName.includes('react-native-maps')) {
      // Return empty module for web
      return {
        type: 'empty',
      };
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;

