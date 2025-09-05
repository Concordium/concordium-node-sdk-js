/* eslint-disable import/no-extraneous-dependencies */
import { resolve } from 'path';
import url from 'url';
// eslint-disable-next-line import/no-named-as-default
import webpack from 'webpack';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

function configFor(target: 'web' | 'node' | 'react-native'): webpack.Configuration {
    const t = target === 'react-native' ? 'web' : target;
    const entry = [resolve(__dirname, './src/index.ts'), resolve(__dirname, './src/pub/plt.ts')];

    const config: webpack.Configuration = {
        mode: 'production',
        target: t,
        cache: {
            type: 'filesystem',
            cacheDirectory: resolve(__dirname, '.webpack-cache'),
        },
        entry: {
            concordium: entry,
        },
        plugins: [
            new webpack.SourceMapDevToolPlugin({
                filename: '[file].map',
            }),
        ],
        resolve: {
            extensionAlias: {
                '.js': ['.ts', '.js'],
            },
            extensions: ['.tsx', '.ts', '.js'],
            alias: {
                // Fix bignumber.js export issue - ensure it resolves to the BigNumber constructor
                'bignumber.js': resolve(__dirname, '../../node_modules/bignumber.js/bignumber.js'),
            },
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true,
                            configFile: resolve(__dirname, './tsconfig.build.json'),
                        },
                    },
                    exclude: /node_modules/,
                },
            ],
        },
        output: {
            filename: `[name].${target}.min.js`,
            path: resolve(__dirname, 'lib/min'),
            library: {
                name: 'concordiumSDK',
                type: 'umd',
            },
        },
    };

    if (target === 'node') {
        config.output = { ...config.output, library: { type: 'commonjs2' } }; // To support legacy versions of nodeJS.
    }

    if (target === 'react-native') {
        config.resolve!.conditionNames = ['react-native', 'browser', 'module', 'require'];
    }

    return config;
}

export default [configFor('web'), configFor('node'), configFor('react-native')];
