import type { Config } from '@jest/types';

const esModules = ['@concordium/web-sdk', '@noble/ed25519'].join('|');

const config: Config.InitialOptions = {
    preset: 'ts-jest/presets/js-with-ts-esm',
    transformIgnorePatterns: [`node_modules/(?!${esModules})`],
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.test.json',
            },
        ],
    },
};

export default config;
