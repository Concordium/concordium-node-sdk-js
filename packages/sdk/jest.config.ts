import type { Config } from 'jest';

export const esModules = ['@noble/ed25519', 'cbor2'];

const config: Config = {
    preset: 'ts-jest/presets/js-with-ts-esm',
    moduleNameMapper: {
        '^(\\.\\.?\\/.+)\\.js$': '$1', // Remap esmodule file extensions
    },
    globals: {
        __ENV__: 'node',
    },
    transformIgnorePatterns: [`node_modules/(?!${esModules.join('|')})`],
    // Needed due to a bug in Jest, issue: https://github.com/jestjs/jest/issues/11617
    workerThreads: true,
};

export default config;
