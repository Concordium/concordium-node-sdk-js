module.exports = {
    env: {
        browser: true,
        es2020: true,
    },
    extends: [
        'plugin:prettier/recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/recommended',
        'plugin:import/typescript',
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        tsconfigRootDir: __dirname,
        project: [
            './packages/**/tsconfig.json',
            './packages/**/tsconfig.eslint.json',
            './tsconfig.eslint.json',
            './examples/tsconfig.eslint.json',
        ],
    },
    plugins: ['@typescript-eslint', 'import'],
    rules: {
        quotes: [
            2,
            'single',
            {
                avoidEscape: true,
            },
        ],
        'import/no-unresolved': [
            2,
            {
                ignore: ['@concordium/rust-bindings', 'grpc-api'],
            },
        ],
        'import/no-extraneous-dependencies': [
            'error',
            {
                devDependencies: [
                    '**/*.test.ts',
                    '**/*.test.tsx',
                    '**/*.config.js',
                ],
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
    ignorePatterns: [
        '**/pkg/**/',
        '**/dist/**/',
        '**/lib/**/',
        'deps/**/*',
        '**/src/grpc-api/*',
        'typedoc/**',
    ],
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
