/* eslint-disable import/no-extraneous-dependencies */
import { Configuration } from 'webpack';
import { resolve } from 'path';

function configForTarget(target: 'web' | 'node'): Configuration {
    return {
        mode: 'production',
        cache: {
            type: 'filesystem',
            cacheDirectory: resolve(__dirname, '.webpack-cache'),
        },
        target,
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
}

export default [configForTarget('web'), configForTarget('node')];
