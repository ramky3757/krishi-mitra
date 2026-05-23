module.exports = function (api) {
  const isWeb = api.caller((caller) => caller?.platform === 'web');
  api.cache.using(() => isWeb);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind', reanimated: !isWeb }],
      'nativewind/babel',
    ],
    plugins: [],
  };
};
