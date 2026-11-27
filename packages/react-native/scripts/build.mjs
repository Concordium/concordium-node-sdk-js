import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const native = fileURLToPath(new URL('../', import.meta.url));
const moduleDir = join(native, 'module');
const sdk = join(native, '../sdk');
const templatesDir = join(native, 'templates');
const assets = join(sdk, 'lib/react-native');
const binding = join(sdk, 'lib/esm/react-native/nativeBridge.js');
const podspec = 'ConcordiumNative.podspec';
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const requested = process.argv[2] ?? process.env.CONCORDIUM_NATIVE_TARGETS ?? '';
const targets = new Set(requested.split(',').filter(Boolean));
for (const target of targets) {
    if (target !== 'ios' && target !== 'android') {
        throw new Error(`Unknown native target "${target}". Use ios, android, or ios,android.`);
    }
}
if (targets.has('ios') && process.platform !== 'darwin') {
    throw new Error('The iOS SDK artifacts require macOS and Xcode.');
}

function run(command, args) {
    execFileSync(command, args, {
        cwd: moduleDir,
        stdio: 'inherit',
        env: { ...process.env, RUSTUP_TOOLCHAIN: process.env.CONCORDIUM_NATIVE_RUST_TOOLCHAIN ?? '1.89' },
    });
}

function copy(source, destination) {
    mkdirSync(dirname(destination), { recursive: true });
    cpSync(source, destination, { recursive: true });
}

function replaceRequired(source, pattern, value) {
    if (!pattern.test(source)) {
        throw new Error(`The UniFFI Android template changed: ${pattern}`);
    }
    return source.replace(pattern, value);
}

rmSync(assets, { force: true, recursive: true });
rmSync(join(sdk, 'android'), { force: true, recursive: true });
rmSync(join(sdk, podspec), { force: true });
copy(join(templatesDir, 'NativeConcordiumNative.ts'), join(assets, 'spec/NativeConcordiumNative.ts'));
copy(join(sdk, 'src/react-native/nativeBridge.d.ts'), join(dirname(binding), 'nativeBridge.d.ts'));
writeFileSync(
    binding,
    `function unavailable() {
    throw new Error('This SDK build has no React Native artifacts. Use a mobile SDK release or set CONCORDIUM_NATIVE_TARGETS when building locally.');
}
export const bindings = new Proxy({}, { get: () => unavailable });
`
);

if (targets.size) {
    run(npm, ['ci', '--legacy-peer-deps']);
    for (const target of targets) {
        run(npm, ['run', `build:${target}`]);
    }

    const runtime = join(moduleDir, 'node_modules/uniffi-bindgen-react-native');
    copy(join(runtime, 'cpp/includes'), join(assets, 'runtime/include'));
    copy(join(runtime, 'typescript/src'), join(assets, 'runtime/typescript'));
    copy(join(runtime, 'LICENSE'), join(assets, 'runtime/LICENSE'));
    copy(join(moduleDir, 'cpp'), join(assets, 'cpp'));
    copy(join(moduleDir, 'src/NativeConcordiumNative.ts'), join(assets, 'spec/NativeConcordiumNative.ts'));
    run(join(moduleDir, 'node_modules/.bin/esbuild'), [
        'src/index.ts',
        '--bundle',
        '--format=esm',
        '--platform=neutral',
        '--target=es2020',
        '--external:react-native',
        `--alias:uniffi-bindgen-react-native=${join(runtime, 'typescript/src/index.ts')}`,
        `--outfile=${binding}`,
    ]);

    if (targets.has('ios')) {
        copy(join(templatesDir, podspec), join(sdk, podspec));
        copy(join(moduleDir, 'ios/ConcordiumNative.h'), join(assets, 'ios/ConcordiumNative.h'));
        copy(join(moduleDir, 'ios/ConcordiumNative.mm'), join(assets, 'ios/ConcordiumNative.mm'));
        const framework = 'ConcordiumReactNativeFramework.xcframework';
        copy(join(moduleDir, framework), join(assets, framework));
    }

    if (targets.has('android')) {
        const android = join(moduleDir, 'android');
        for (const path of ['src/main', 'cpp-adapter.cpp', 'proguard-rules.pro']) {
            copy(join(android, path), join(sdk, 'android', path));
        }
        copy(
            join(templatesDir, 'android/ConcordiumNativePackage.java'),
            join(sdk, 'android/src/legacy/java/com/concordium/sdk/reactnative/ConcordiumNativePackage.java')
        );
        const gradle = readFileSync(join(android, 'build.gradle'), 'utf8');
        let stagedGradle = replaceRequired(
            gradle,
            /jsRootDir = file\("\.\.\/src\/"\)/,
            'jsRootDir = file("../lib/react-native/spec")'
        );
        stagedGradle = replaceRequired(
            stagedGradle,
            /  externalNativeBuild \{\n    cmake \{\n      path "CMakeLists.txt"\n    \}\n  \}/,
            `  if (isNewArchitectureEnabled()) {
    externalNativeBuild {
      cmake {
        path "CMakeLists.txt"
      }
    }
  }`
        );
        stagedGradle = replaceRequired(
            stagedGradle,
            /"generated\/jni"\n          \]\n      \}/,
            `"generated/jni"
          ]
      } else {
        java.srcDirs = ["src/legacy/java"]
      }`
        );
        writeFileSync(join(sdk, 'android/build.gradle'), stagedGradle);
        const cmake = readFileSync(join(android, 'CMakeLists.txt'), 'utf8');
        let relocated = replaceRequired(
            cmake,
            /# Resolve the path to the uniffi-bindgen-react-native package[\s\S]*?get_filename_component\([^\n]*\)\n/,
            ''
        );
        relocated = replaceRequired(relocated, /\.\.\/cpp/g, '../lib/react-native/cpp');
        relocated = replaceRequired(
            relocated,
            /\$\{UNIFFI_BINDGEN_PATH\}\/cpp\/includes/,
            '../lib/react-native/runtime/include'
        );
        relocated = replaceRequired(
            relocated,
            /cmake_minimum_required\(VERSION 3\.9\.0\)/,
            'cmake_minimum_required(VERSION 3.22)'
        );
        writeFileSync(
            join(sdk, 'android/CMakeLists.txt'),
            relocated + '\ntarget_link_options(concordium-native PRIVATE "-Wl,-z,max-page-size=16384")\n'
        );
    }
}
