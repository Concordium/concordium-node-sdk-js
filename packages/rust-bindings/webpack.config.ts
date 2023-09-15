/* eslint-disable import/no-extraneous-dependencies */
import { Configuration, SourceMapDevToolPlugin } from 'webpack';
import { resolve } from 'path';

const config: Configuration = {
    mode: 'production',
    cache: {
        type: 'filesystem',
        cacheDirectory: resolve(__dirname, '.webpack-cache'),
    },
    entry: {
        dapp: resolve(__dirname, './ts-src/dapp.ts'),
        wallet: resolve(__dirname, './ts-src/wallet.ts'),
    },
    plugins: [
        new SourceMapDevToolPlugin({
            filename: '[file].map',
        }),
    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        configFile: resolve(__dirname, './tsconfig.build.json'),
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
        filename: '[name]/web/index.min.js',
        path: resolve(__dirname, 'lib'),
        libraryTarget: 'umd',
        publicPath: '',
    },
};

export default config;
