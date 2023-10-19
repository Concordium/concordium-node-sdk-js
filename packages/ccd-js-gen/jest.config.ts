import type { Config } from 'jest';
import type {} from 'ts-jest';

const config: Config = {
    preset: 'ts-jest/presets/js-with-ts-esm',
    moduleNameMapper: {
        '^(\\.\\.?\\/.+)\\.js$': '$1', // Remap esmodule file extensions
    },
    transformIgnorePatterns: [
        'node_modules/(?!@noble/ed25519)', // @noble/ed25519 is an ES module only
    ],
};

export default config;
