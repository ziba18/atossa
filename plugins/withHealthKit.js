const { withEntitlementsPlist, withInfoPlist } = require('@expo/config-plugins');

const withHealthKit = (config) => {
  config = withEntitlementsPlist(config, (mod) => {
    mod.modResults['com.apple.developer.healthkit'] = true;
    mod.modResults['com.apple.developer.healthkit.background-delivery'] = true;
    mod.modResults['com.apple.developer.healthkit.access'] = [];
    return mod;
  });

  config = withInfoPlist(config, (mod) => {
    mod.modResults['NSHealthShareUsageDescription'] =
      mod.modResults['NSHealthShareUsageDescription'] ??
      'Atossa reads health data to enhance your cycle predictions.';
    mod.modResults['NSHealthUpdateUsageDescription'] =
      mod.modResults['NSHealthUpdateUsageDescription'] ??
      'Atossa may write cycle data to Apple Health.';
    return mod;
  });

  return config;
};

module.exports = withHealthKit;
