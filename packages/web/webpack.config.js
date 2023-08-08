const path = require('path');
const webpack = require('webpack');

module.exports = {
    mode: 'production',
    cache: {
        type: 'filesystem',
        cacheDirectory: path.resolve(__dirname, '.webpack-cache'),
    },
    entry: {
        concordium: './lib/esm/index.js',
    },
    plugins: [
        new webpack.SourceMapDevToolPlugin({
            filename: '[file].map',
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
    ],
    resolve: {
        fallback: {
            stream: require.resolve('stream-browserify'),
        },
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            [
                                '@babel/preset-env',
                                {
                                    useBuiltIns: 'entry',
                                    corejs: 3,
                                    targets: {
                                        chrome: 67,
                                    },
                                },
                            ],
                        ],
                        plugins: [
                            '@babel/plugin-transform-runtime',
                            '@babel/plugin-transform-modules-commonjs',
                        ],
                    },
                },
            },
            {
                test: /\.wasm$/,
                type: 'asset/inline',
            },
        ],
    },
    experiments: {
        asyncWebAssembly: true,
    },
    output: {
        filename: '[name].min.js',
        path: path.resolve(__dirname, 'lib/umd'),
        library: 'concordiumSDK',
        libraryTarget: 'umd',
        publicPath: '',
    },
};
