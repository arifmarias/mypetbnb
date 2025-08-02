const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Add resolver configuration for React Native
defaultConfig.resolver.platforms = ['native', 'ios', 'android', 'web'];

// Add source extensions
defaultConfig.resolver.sourceExts.push('jsx', 'js', 'ts', 'tsx', 'json');

// Add asset extensions
defaultConfig.resolver.assetExts.push('png', 'jpg', 'jpeg', 'gif', 'svg');

// Configure transformer for React Native
defaultConfig.transformer.minifierPath = 'metro-minify-terser';
defaultConfig.transformer.minifierConfig = {
  ecma: 8,
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

module.exports = defaultConfig;