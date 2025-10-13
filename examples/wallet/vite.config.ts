import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import topLevelAwait from 'vite-plugin-top-level-await';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import wasm from 'vite-plugin-wasm';

export default defineConfig({
    plugins: [
        react(),
        svgr(),
        wasm(),
        topLevelAwait(), // For legacy browser compatibility
    ],
    resolve: {
        alias: {
            '@concordium/rust-bindings': '@concordium/rust-bindings/bundler', // Resolve bundler-specific wasm entrypoints.
        },
    },
    worker: {
        plugins: () => [wasm(), topLevelAwait()],
    },
});
