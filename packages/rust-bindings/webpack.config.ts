/* eslint-disable import/no-extraneous-dependencies */
import { resolve } from 'path';
import url from 'url';
import type { Configuration } from 'webpack';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

type WebpackEnv = Partial<{
    package: string;
}>;

function configFor(target: 'web' | 'node', pkg?: string): Configuration {
    const config: Configuration = {
        mode: 'production',
        cache: {
            type: 'filesystem',
            cacheDirectory: resolve(__dirname, '.webpack-cache'),
        },
        target,
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
            filename: `[name]/${target}/umd/index.min.js`,
            path: resolve(__dirname, 'lib'),
            libraryTarget: 'umd',
            publicPath: '',
        },
    };

    if (!pkg) {
        config.entry = {
            dapp: resolve(__dirname, './ts-src/dapp.ts'),
            wallet: resolve(__dirname, './ts-src/wallet.ts'),
        };
    } else {
        config.entry = {
            [pkg]: resolve(__dirname, `./ts-src/${pkg}.ts`),
        };
    }

    return config;
}

export default (env: WebpackEnv) => [configFor('web', env.package), configFor('node', env.package)];
