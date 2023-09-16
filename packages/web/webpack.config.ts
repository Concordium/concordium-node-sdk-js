/* eslint-disable import/no-extraneous-dependencies */
import { Configuration, SourceMapDevToolPlugin, ProvidePlugin } from 'webpack';
import { resolve } from 'path';

const config: Configuration = {
    mode: 'production',
    cache: {
        type: 'filesystem',
        cacheDirectory: resolve(__dirname, '.webpack-cache'),
    },
    entry: {
        concordium: resolve(__dirname, 'src/index.ts'),
    },
    plugins: [
        new SourceMapDevToolPlugin({
            filename: '[file].map',
        }),
        new ProvidePlugin({
            process: 'process/browser',
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
                        transpileOnly: true,
                        configFile: resolve(__dirname, './tsconfig.build.json'),
                    },
                },
                exclude: /node_modules/,
            },
        ],
    },
    output: {
        filename: '[name].min.js',
        path: resolve(__dirname, 'lib/umd'),
        library: 'concordiumSDK',
        libraryTarget: 'umd',
        publicPath: '',
    },
};

export default config;
