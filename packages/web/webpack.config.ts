/* eslint-disable import/no-extraneous-dependencies */
import webpack from 'webpack';
import { resolve } from 'path';
import url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const config: webpack.Configuration = {
    mode: 'production',
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
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
        // new webpack.NormalModuleReplacementPlugin(/^\..+\.js$/, (resource) => {
        //     resource.request = resource.request.replace(/\.js$/, '');
        // }),
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
