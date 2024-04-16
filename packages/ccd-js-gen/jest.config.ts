import type { Config } from 'jest';
import type {} from 'ts-jest';

export const esModules = ['@noble/ed25519', '@concordium/web-sdk'];

const config: Config = {
    preset: 'ts-jest/presets/js-with-ts-esm',
    moduleNameMapper: {
        '^(\\.\\.?\\/.+)\\.js$': '$1', // Remap esmodule file extensions
    },
    transformIgnorePatterns: [`node_modules/(?!${esModules.join('|')})`],
};

export default config;
