/* eslint-disable import/no-extraneous-dependencies */
// eslint-disable-next-line import/no-named-as-default
import webpack from 'webpack';
import { resolve } from 'path';
import url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

function configFor(
    target: 'web' | 'node' | 'react-native'
): webpack.Configuration {
    const t = target === 'react-native' ? 'node' : target;
    const config: webpack.Configuration = {
        // mode: 'production',
        mode: 'development',
        devtool: 'inline-source-map',
        target: t,
        cache: {
            type: 'filesystem',
            cacheDirectory: resolve(__dirname, '.webpack-cache'),
        },
        entry: {
            concordium: resolve(__dirname, 'src/index.ts'),
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
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true,
                            configFile: resolve(
                                __dirname,
                                './tsconfig.build.json'
                            ),
                        },
                    },
                    exclude: /node_modules/,
                },
            ],
        },
        output: {
            filename: `[name]-${target}.min.js`,
            path: resolve(__dirname, 'lib/umd'),
            library: 'concordiumSDK',
            libraryTarget: 'umd',
            publicPath: '',
        },
    };

    if (target === 'react-native') {
        config.resolve!.fallback = {
            crypto: resolve(__dirname, 'shims/node-webcrypto.ts'),
            process: 'process/browser',
        };
        config.externalsPresets = {
            node: false,
        };
    }

    return config;
}

export default [configFor('web'), configFor('node'), configFor('react-native')];
