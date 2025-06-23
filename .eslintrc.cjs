module.exports = {
    env: {
        browser: true,
        es2020: true,
    },
    extends: ['plugin:import/recommended', 'plugin:import/typescript', 'prettier'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        tsconfigRootDir: __dirname,
        project: [
            './packages/**/tsconfig.json',
            './examples/wallet-connection/*/tsconfig.json',
            './docs/**/tsconfig.json',
            '**/tsconfig.eslint.json',
        ],
    },
    plugins: ['@typescript-eslint', 'import'],
    rules: {
        'import/no-unresolved': [
            2,
            {
                ignore: [
                    '^@concordium/rust-bindings(/(.*))?$',
                    'grpc-api',
                    '^@concordium/web-sdk(/(.*))?$',
                    '^#.+$', // ESLint resolver does not support subpath imports: https://github.com/import-js/eslint-plugin-import/issues/1868.
                ],
            },
        ],
        'import/no-extraneous-dependencies': [
            'error',
            {
                devDependencies: ['**/*/test/*', '**/*.config.*', '**/*/__tests__/*'],
            },
        ],
        '@typescript-eslint/no-unused-vars': [
            'warn',
            {
                ignoreRestSiblings: true,
            },
        ],
    },
    overrides: [
        {
            files: ['*.config.js'],
            rules: {
                '@typescript-eslint/no-var-requires': 'off',
                'import/namespace': 'off',
            },
        },
    ],
    ignorePatterns: ['**/pkg/**/*', '**/dist/**/*', '**/lib/**/*', 'deps/**/*', '**/src/grpc-api/*', 'typedoc/**'],
    settings: {
        'import/ignore': ['bs58check'],
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx'],
        },
        'import/resolver': {
            exports: true,
            typescript: {
                project: ['packages/*/tsconfig.json'],
            },
            node: {
                project: ['packages/*/tsconfig.json'],
            },
        },
    },
};
