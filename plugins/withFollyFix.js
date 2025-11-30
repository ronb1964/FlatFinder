/**
 * Custom Expo config plugin to fix the folly/coro/Coroutine.h error
 * in React Native 0.80+ by adding compiler flags to disable coroutines.
 *
 * See: https://github.com/facebook/react-native/issues/53575
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const { withPodfile } = require('@expo/config-plugins');

const withFollyFix = (config) => {
  return withPodfile(config, async (config) => {
    let podfile = config.modResults.contents;

    // Add the environment variable to use prebuilt React Native dependencies
    // This fixes the folly/coro/Coroutine.h issue in RN 0.80+
    const envVarLine = "ENV['RCT_USE_RN_DEP'] = '1'";

    if (!podfile.includes(envVarLine)) {
      // Add at the beginning of the Podfile, after require statements
      podfile = podfile.replace(
        /(require_relative.*\n)/,
        `$1\n# Fix for folly/coro/Coroutine.h not found in RN 0.80+\n# Use prebuilt React Native dependencies\n${envVarLine}\n`
      );
    }

    // Also inject the C++ flags fix into the post_install block
    const cppFlagsCode = `
    # Fix for folly coroutines issue
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        existing = build_config.build_settings['OTHER_CPLUSPLUSFLAGS'] || ['$(inherited)']
        existing = [existing] if existing.is_a?(String)
        unless existing.include?('-DFOLLY_CFG_NO_COROUTINES=1')
          existing << '-DFOLLY_CFG_NO_COROUTINES=1'
          existing << '-DFOLLY_HAVE_CLOCK_GETTIME=1'
        end
        build_config.build_settings['OTHER_CPLUSPLUSFLAGS'] = existing
      end
    end`;

    // Check if there's already a post_install block and add our fix
    if (podfile.includes('post_install do |installer|')) {
      // Add after the opening of post_install
      podfile = podfile.replace(
        /post_install do \|installer\|/,
        `post_install do |installer|${cppFlagsCode}`
      );
    }

    config.modResults.contents = podfile;
    return config;
  });
};

module.exports = withFollyFix;
