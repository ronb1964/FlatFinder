const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add Tamagui support
config.resolver.sourceExts.push('mjs');

module.exports = config;
