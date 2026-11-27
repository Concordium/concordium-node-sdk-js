import { build } from 'esbuild';
import { globSync } from 'glob';
import { copyFile, rm } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const sdk = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(sdk, 'lib/min/react-native');
const bridge = relative(output, resolve(sdk, 'lib/esm/react-native/nativeBridge.js')).split(sep).join('/');
const subpaths = globSync(['lib/esm/pub/**/*.js', 'lib/esm/extensions/**/*.js'], {
    cwd: sdk,
    ignore: 'lib/esm/pub/nodejs.js',
}).sort();
const encodingEntry = 'scripts/react-native-encoding.js';

// Keep the codec's own runtime detection pointed at the host globals.
// Injecting into its source would make its fallback depend on itself.
const encoding = await build({
    absWorkingDir: sdk,
    entryPoints: [encodingEntry],
    bundle: true,
    platform: 'neutral',
    conditions: ['react-native'],
    format: 'esm',
    define: {
        TextEncoder: 'globalThis.TextEncoder',
        TextDecoder: 'globalThis.TextDecoder',
    },
    write: false,
});

await rm(output, { recursive: true, force: true });
// Resolve dependency exports at build time for Metro versions that use file-based resolution.
// A shared build keeps runtime types identical when consumers mix SDK entrypoints.
const { metafile } = await build({
    absWorkingDir: sdk,
    entryPoints: [{ in: 'lib/esm/index.react-native.js', out: 'index' }, ...subpaths],
    outbase: 'lib/esm',
    outdir: output,
    bundle: true,
    splitting: true,
    platform: 'browser',
    conditions: ['react-native'],
    format: 'esm',
    target: 'es2020',
    minify: true,
    inject: [encodingEntry],
    metafile: true,
    plugins: [
        {
            name: 'private-utf8',
            setup(bundler) {
                bundler.onLoad({ filter: /react-native-encoding\.js$/ }, () => ({
                    contents: encoding.outputFiles[0].text,
                }));
            },
        },
        {
            name: 'native-bridge',
            setup(bundler) {
                // The shared chunk loads the bridge staged by the separate mobile build.
                bundler.onResolve({ filter: /^\.\/nativeBridge\.js$/ }, () => ({ path: bridge, external: true }));
            },
        },
    ],
});

// Metro follows dynamic imports for Release bundles too. Keep the native subpath
// independent of the generated legacy bindings while sharing classes with the root.
const pending = ['lib/min/react-native/pub/react-native.js'];
const visited = new Set();
while (pending.length) {
    const path = pending.pop();
    if (visited.has(path)) continue;
    visited.add(path);
    const chunk = metafile.outputs[path];
    const legacy = Object.keys(chunk.inputs).find((input) => /(?:^|\/)rust-bindings\/lib\//.test(input));
    if (legacy) throw new Error(`The React Native subpath includes a legacy binding: ${legacy}`);
    pending.push(...chunk.imports.filter(({ external }) => !external).map(({ path }) => path));
}

await copyFile(
    new URL('LICENSE', import.meta.resolve('@exodus/bytes/encoding-lite.js')),
    resolve(output, 'LICENSE.exodus-bytes.txt')
);
