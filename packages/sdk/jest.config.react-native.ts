// eslint-disable-next-line import/no-extraneous-dependencies
import type { Config } from 'jest';

import nodeConfig, { esModules } from './jest.config.ts';

const rnEsModules = [...esModules, 'react-native', '@react-native'];

const config: Config = {
    preset: 'react-native',
    moduleNameMapper: {
        ...nodeConfig.moduleNameMapper,
    },
    transformIgnorePatterns: [`node_modules/(?!${rnEsModules.join('|')})`],
    transform: {
        '^.+\\.jsx$': 'babel-jest',
        '^.+\\.tsx?$': 'ts-jest',
    },
};

export default config;
