const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Pin React/RN to the mobile app's local copies (React 19) to prevent any
// hoisted package from accidentally pulling in a different version.
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    react: path.resolve(projectRoot, 'node_modules/react'),
    'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
    'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  },
};

module.exports = withNativeWind(config, { input: './global.css' });
