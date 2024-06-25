import { Config } from 'jest';

import baseConfig from './jest.config.ts';

const config: Config = {
    ...baseConfig,
    testEnvironment: 'jsdom',
    globals: {
        __ENV__: 'web',
    },
    setupFiles: ['<rootDir>/test/setup.web.ts'],
};

export default config;
