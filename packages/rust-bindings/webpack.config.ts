/* eslint-disable import/no-extraneous-dependencies */
import { Configuration } from 'webpack';
import { resolve } from 'path';

function configFor(target: 'web' | 'node' | 'react-native'): Configuration {
    const t = target === 'react-native' ? 'node' : target;
    const config: Configuration = {
        mode: 'production',
        // mode: 'development',
        devtool: 'inline-source-map',
        cache: {
            type: 'filesystem',
            cacheDirectory: resolve(__dirname, '.webpack-cache'),
        },
        target: t,
        entry: {
            dapp: resolve(__dirname, './ts-src/dapp.ts'),
            wallet: resolve(__dirname, './ts-src/wallet.ts'),
        },
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
                            configFile: resolve(
                                __dirname,
                                './tsconfig.build.json'
                            ),
                        },
                    },
                    exclude: /node_modules/,
                },
                {
                    test: /\.wasm$/,
                    type: 'asset/inline',
                    generator: {
                        dataUrl: (data: Buffer) => data.toString('base64'),
                    },
                },
            ],
        },
        output: {
            filename: `[name]/${target}/umd/index.min.js`,
            path: resolve(__dirname, 'lib'),
            libraryTarget: 'umd',
            publicPath: '',
        },
    };

    if (target === 'react-native') {
        config.externalsPresets = {
            node: false,
        };
    }

    return config;
}

export default [configFor('web'), configFor('node'), configFor('react-native')];
