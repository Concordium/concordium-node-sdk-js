## Optimizing bundled applications with async WASM

As part of the logic of the SDK's is implemented in rust, some functionality
requires WASM modules to be loaded. By default, this is embedded in a UMD
to make it easy to use, however the recommended way to load WASM into the browser
is to asynchronously load and initiate the module. To facilitate this, each
WASM module exposes by `@concordium/rust-bindings` have a corresponding
`bundler` entrypoint, which can be used by aliasing `@concordium/rust-bindings`
as `@concordium/rust-bindings/bundler`. This does require some special handling
by the bundler, which is why it's not the default.

### Webpack 5

The following example shows how to optimize the produced bundle of your
application with **Webpack 5**.

```ts
// webpack.config.ts
import { Configuration } from 'webpack';

const config: Configuration = {
    ..., // Other webpack configuration options.
    resolve: {
        ...,
        alias: {
             // Resolve bundler-specific wasm entrypoints.
            '@concordium/rust-bindings': '@concordium/rust-bindings/bundler',
        }
    },
    experiments: {
         // Needed to handle bundler-specific wasm entrypoint
        asyncWebAssembly: true
    }
};

export default config;
```

### Vite

The following example shows how to optimize the produced bundle of your
application with **Vite**.

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait() // For compatibility with older browsers.
  ],
  resolve: {
    alias: {
      '@concordium/rust-bindings': '@concordium/rust-bindings/bundler', // Resolve bundler-specific wasm entrypoints.
    }
  }
});
```
