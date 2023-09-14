module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleFileExtensions: ['js', 'ts', 'json'],
    moduleDirectories: ['node_modules'],
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.json',
            },
        ],
        '^.*src/grpc-api/.+\\.js$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.json',
            },
        ],
    },
};
