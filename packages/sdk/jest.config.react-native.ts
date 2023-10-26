import type { Config } from 'jest';

import nodeConfig, { esModules } from './jest.config.ts';

const rnEsModules = [...esModules, 'react-native', '@react-native'];

const config: Config = {
    preset: 'react-native',
    // testEnvironmentOptions: {
    //     customExportConditions: ['react-native', 'browser'],
    // },
    moduleNameMapper: {
        ...nodeConfig.moduleNameMapper,
        // No idea why, but the following declaration seems to force the resolver to not respect package.json exports.
        // This hack is needed due to importing from `/src/index.js` instead of deep importing from the file where it's declared.
        '@concordium/rust-bindings/wallet': '@concordium/rust-bindings/wallet',
    },
    globals: {
        __ENV__: 'react-native',
    },
    transformIgnorePatterns: [`node_modules/(?!${rnEsModules.join('|')})`],
    transform: {
        '^.+\\.jsx$': 'babel-jest',
        '^.+\\.tsx?$': 'ts-jest',
    },
};

export default config;
