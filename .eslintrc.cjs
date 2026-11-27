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
        project: './tsconfig.eslint.json',
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
        // Select the project by file path so linting a workspace only loads its own config.
        ...Object.entries({
            docs: 'tsconfig.json',
            'examples/nodejs': 'tsconfig.eslint.json',
            'examples/reactnative': 'tsconfig.eslint.json',
            'examples/wallet': 'tsconfig.eslint.json',
            'examples/wallet-connection/contractupdate': 'tsconfig.json',
            'examples/wallet-connection/proofs': 'tsconfig.json',
            'examples/wallet-connection/sign-message': 'tsconfig.json',
            'examples/wallet-connection/sponsoredTransactions': 'tsconfig.json',
            'packages/ccd-js-gen': 'tsconfig.eslint.json',
            'packages/react-components': 'tsconfig.json',
            'packages/react-native/module': 'tsconfig.json',
            'packages/rust-bindings': 'tsconfig.json',
            'packages/sdk': 'tsconfig.json',
            'packages/wallet-connectors': 'tsconfig.eslint.json',
        }).map(([directory, tsconfig]) => ({
            files: [`${directory}/**/*`],
            parserOptions: { project: `./${directory}/${tsconfig}` },
        })),
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
