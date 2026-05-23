module.exports = function (api) {
  api.cache(true);
  const isWeb = api.caller((caller) => caller?.platform === 'web');
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      // reanimated/plugin uses native-only worklets transform, skip on web
      ...(!isWeb ? ['react-native-reanimated/plugin'] : []),
    ],
  };
};
