import type { Config } from 'jest';

export const esModules = ['@noble/ed25519'];

const config: Config = {
    preset: 'ts-jest/presets/js-with-ts-esm',
    moduleNameMapper: {
        '^(\\.\\.?\\/.+)\\.js$': '$1', // Remap esmodule file extensions
    },
    globals: {
        __ENV__: 'node',
    },
    transformIgnorePatterns: [`node_modules/(?!${esModules.join('|')})`],
};

export default config;
