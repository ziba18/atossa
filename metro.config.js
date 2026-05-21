// Metro bundler config — extends Expo's defaults.
// We add `tflite` to assetExts so react-native-fast-tflite can `require()`
// the bundled model files. Drop new .tflite files into assets/models/ and
// they'll be picked up on the next Metro bundle.

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('tflite');

module.exports = config;
