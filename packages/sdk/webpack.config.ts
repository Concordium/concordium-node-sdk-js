/* eslint-disable import/no-extraneous-dependencies */
// eslint-disable-next-line import/no-named-as-default
import webpack from 'webpack';
import { resolve } from 'path';
import url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

function configFor(
    target: 'web' | 'node' | 'react-native'
): webpack.Configuration {
    const t = target === 'react-native' ? 'web' : target;
    const entry =
        target === 'react-native'
            ? 'src/index.react-native.ts'
            : 'src/index.ts';

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
            concordium: resolve(__dirname, entry),
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
        config.resolve!.conditionNames = [
            'react-native',
            'browser',
            'module',
            'require',
        ];
    }

    return config;
}

export default [configFor('web'), configFor('node'), configFor('react-native')];
