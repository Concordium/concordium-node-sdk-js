/* eslint-disable import/no-extraneous-dependencies */
import { Configuration, SourceMapDevToolPlugin } from 'webpack';
import { resolve } from 'path';

const config: Configuration = {
    mode: 'production',
    cache: {
        type: 'filesystem',
        cacheDirectory: resolve(__dirname, '.webpack-cache'),
    },
    entry: resolve(__dirname, './ts-src/index.ts'),
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
            },
        ],
    },
    output: {
        filename: 'rust-bindings.min.js',
        path: resolve(__dirname, 'lib/web'),
        libraryTarget: 'umd',
        publicPath: '',
    },
};

export default config;
