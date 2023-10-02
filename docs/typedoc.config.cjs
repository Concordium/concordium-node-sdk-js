/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('node:path');

module.exports = {
    name: 'Concordium JS-SDKs',
    out: path.resolve(__dirname, '../typedoc'),
    entryPointStrategy: 'expand',
    entryPoints: [
        path.resolve(__dirname, '../packages/sdk/src/index.ts'),
        path.resolve(__dirname, '../packages/sdk/src/nodejs/index.ts'),
    ],
    tsconfig: path.resolve(__dirname, '../tsconfig.json'),
    readme: path.resolve(__dirname, './pages/documentation.md'),
    plugin: [
        '@knodes/typedoc-plugin-code-blocks',
        '@knodes/typedoc-plugin-pages',
        'typedoc-plugin-merge-modules',
    ],
    mergeModulesMergeMode: 'module',
    pluginCodeBlocks: {
        source: path.resolve(__dirname, '../examples'),
    },
    pluginPages: {
        source: path.resolve(__dirname, './pages'),
        pages: [
            {
                name: 'Concordium JS-SDKs',
                children: [
                    {
                        name: 'CIS2-Contracts',
                        source: 'cis2-contracts.md',
                    },
                    {
                        name: 'Identity Proofs',
                        source: 'identity-proofs.md',
                    },
                    {
                        name: 'Runnable Examples',
                        source: 'runnable-examples.md',
                    },
                    {
                        name: 'Transactions',
                        source: 'transactions.md',
                    },
                    {
                        name: 'Utility Functions',
                        source: 'utility-functions.md',
                    },
                    {
                        name: 'Miscellaneous Pages',
                        childrenDir: 'misc-pages',
                        children: [
                            {
                                name: 'Account Creation',
                                source: 'account-creation.md',
                            },
                            {
                                name: 'Optimizing bundled applications',
                                source: 'bundler-optimizations.md',
                            },
                            {
                                name: 'GRPCv1 to GRPCv2 Migration Guide',
                                source: 'grpc-migration.md',
                            },
                            {
                                name: 'Old GRPC-Client',
                                source: 'grpc-v1.md',
                            },
                            {
                                name: 'Upgrade Guide',
                                source: 'upgrade-guide.md',
                            },
                        ],
                    },
                ],
            },
        ],
    },
};
