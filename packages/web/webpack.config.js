const path = require("path");
const webpack = require("webpack");

module.exports = {
    mode: "production",
    entry: {
        concordium: "./lib/index.js",
    },
    plugins: [
        new webpack.SourceMapDevToolPlugin({
            filename: "[file].map",
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
                    loader: "babel-loader",
                    options: {
                        presets: [
                            [
                                "@babel/preset-env",
                                {
                                    useBuiltIns: "entry",
                                    corejs: 3,
                                    targets: {
                                        chrome: 67,
                                    },
                                },
                            ],
                        ],
                        plugins: [
                            "@babel/plugin-transform-runtime",
                            "@babel/plugin-transform-modules-commonjs",
                        ],
                    },
                },
            },
            {
                test: /\.wasm$/,
                type: "asset/inline",
            }
        ],
    },
    experiments: {
        asyncWebAssembly: true,
    },
    output: {
        filename: "[name].min.js",
        path: path.resolve(__dirname, "lib"),
        library: "concordium",
        libraryTarget: "umd",
        publicPath: '',
    },
};
