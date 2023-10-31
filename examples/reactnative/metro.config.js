const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
    resolver: {
        unstable_enableSymlinks: true, // This is only needed due to @concordium/web-sdk being symlinked.
        unstable_enablePackageExports: true, // Enables referencing by "exports" field in package.json
    },
    watchFolders: [
        path.resolve(__dirname, '../../node_modules'),
        path.resolve(__dirname, '../../node_modules/@concordium/web-sdk'),
    ],
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
