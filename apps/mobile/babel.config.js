module.exports = function (api) {
  const isWeb = api.caller((caller) => caller?.platform === 'web');
  api.cache.using(() => isWeb);
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
