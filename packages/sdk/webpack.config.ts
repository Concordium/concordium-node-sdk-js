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
            ? [
                  resolve(__dirname, './polyfill/react-native.ts'),
                  resolve(__dirname, './src/index.react-native.ts'),
              ]
            : resolve(__dirname, './src/index.ts');

    const config: webpack.Configuration = {
        mode: 'production',
        target: t,
        cache: {
            type: 'filesystem',
            cacheDirectory: resolve(__dirname, '.webpack-cache'),
        },
        entry: {
            concordium: entry,
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
            filename: `[name].${target}.min.js`,
            path: resolve(__dirname, 'lib/umd'),
            library: {
                name: 'concordiumSDK',
                type: 'umd',
            },
        },
    };

    if (target === 'react-native') {
        config.resolve!.conditionNames = [
            'react-native',
            'browser',
            'module',
            'require',
        ];
        config.externals = [
            'react-native-get-random-values', // Is a peer dependency, and thus required as a direct dependency in react native dependants, as native modules are not installed for transitive dependencies.
            'react-native/Libraries/Utilities/PolyfillFunctions',
        ];
    }

    return config;
}

export default [configFor('web'), configFor('node'), configFor('react-native')];
