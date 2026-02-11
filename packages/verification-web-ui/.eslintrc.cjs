module.exports = {
    extends: ['../../.eslintrc.cjs'],
    parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
    },
    rules: {
        'import/no-unresolved': [
            'error',
            {
                ignore: [
                    '^@/.*$', // Ignore the @/ path alias (handled by Vite)
                    '^\\./(react|vue|index)$', // Ignore relative module declarations in global.d.ts
                ],
            },
        ],
        '@typescript-eslint/no-unused-vars': [
            'warn',
            {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                ignoreRestSiblings: true,
            },
        ],
    },
    settings: {
        'import/resolver': {
            typescript: {
                project: './tsconfig.json',
            },
        },
    },
};
