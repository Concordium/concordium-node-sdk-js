import type { Config } from 'jest';
import type {} from 'ts-jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleFileExtensions: ['js', 'ts', 'json'],
    moduleDirectories: ['node_modules'],
    moduleNameMapper: {
        '^(\\.\\.?\\/.+)\\.js$': '$1', // Remap esmodule file extensions
    },
    transform: {
        '^.+\\.[jt]sx?$': [
            'ts-jest',
            {
                useESM: true,
                tsconfig: 'tsconfig.json',
            },
        ],
    },
    extensionsToTreatAsEsm: ['.ts'],
};

export default config;
