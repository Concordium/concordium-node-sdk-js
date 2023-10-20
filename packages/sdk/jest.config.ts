import type { Config } from 'jest';

const esModules = ['@noble/ed25519'].join('|');

const config: Config = {
    preset: 'ts-jest/presets/js-with-ts-esm',
    moduleNameMapper: {
        '^(\\.\\.?\\/.+)\\.js$': '$1', // Remap esmodule file extensions
    },
    transformIgnorePatterns: [`node_modules/(?!${esModules})`],
};

export default config;
