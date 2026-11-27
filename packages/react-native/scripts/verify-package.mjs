import { execFileSync } from 'node:child_process';

const tarball = process.argv[2];
if (!tarball) {
    throw new Error('Usage: node verify-package.mjs <web-sdk.tgz>');
}

const files = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' });
const entries = new Set(files.split('\n'));
const metroIndex = 'lib/min/react-native/index.js';
const metroNative = 'lib/min/react-native/pub/react-native.js';
const required = [
    'react-native.js',
    'lib/esm/index.js',
    'lib/esm/index.react-native.js',
    'lib/esm/index.react-native.d.ts',
    'lib/esm/pub/react-native.js',
    'lib/esm/pub/react-native.d.ts',
    metroIndex,
    metroNative,
    'lib/min/react-native/LICENSE.exodus-bytes.txt',
    'lib/esm/react-native/nativeBridge.js',
    'lib/esm/react-native/nativeBridge.d.ts',
    'lib/react-native/spec/NativeConcordiumNative.ts',
    'lib/react-native/runtime/LICENSE',
    'lib/react-native/runtime/include/UniffiJsiTypes.h',
    'lib/react-native/runtime/typescript/index.ts',
    'lib/react-native/cpp/generated/concordium_native.cpp',
    'lib/react-native/ios/ConcordiumNative.mm',
    'lib/react-native/ConcordiumReactNativeFramework.xcframework/Info.plist',
    'lib/react-native/ConcordiumReactNativeFramework.xcframework/ios-arm64/libconcordium_native.a',
    'lib/react-native/ConcordiumReactNativeFramework.xcframework/ios-arm64_x86_64-simulator/libconcordium_native.a',
    'ConcordiumNative.podspec',
    'android/CMakeLists.txt',
    'android/build.gradle',
    'android/src/main/AndroidManifestNew.xml',
    'android/src/main/java/com/concordium/sdk/reactnative/ConcordiumNativeModule.kt',
    'android/src/main/java/com/concordium/sdk/reactnative/ConcordiumNativePackage.kt',
    'android/src/legacy/java/com/concordium/sdk/reactnative/ConcordiumNativePackage.java',
    ...['arm64-v8a', 'armeabi-v7a', 'x86', 'x86_64'].map(
        (abi) => `android/src/main/jniLibs/${abi}/libconcordium_native.a`
    ),
];
const missing = required.filter((path) => !entries.has(`package/${path}`));
if (missing.length) {
    throw new Error(`Incomplete React Native SDK release:\n${missing.join('\n')}`);
}
const manifest = JSON.parse(execFileSync('tar', ['-xOzf', tarball, 'package/package.json'], { encoding: 'utf8' }));
if (
    manifest['react-native'] !== metroIndex ||
    manifest.exports?.['.']?.['react-native']?.default !== `./${metroIndex}` ||
    manifest.exports?.['./react-native']?.['react-native'] !== `./${metroNative}`
) {
    throw new Error('The SDK package manifest is missing the Metro entrypoints.');
}
if (
    manifest.exports?.['./package.json'] !== './package.json' ||
    manifest.codegenConfig?.name !== 'ConcordiumNativeSpec' ||
    manifest.codegenConfig?.jsSrcsDir !== 'lib/react-native/spec' ||
    manifest.codegenConfig?.android?.javaPackageName !== 'com.concordium.sdk.reactnative'
) {
    throw new Error('The SDK package manifest is missing React Native Codegen metadata.');
}
const bridge = execFileSync('tar', ['-xOzf', tarball, 'package/lib/esm/react-native/nativeBridge.js'], {
    encoding: 'utf8',
});
if (
    !bridge.includes('ConcordiumNative') ||
    !bridge.includes('installRustCrate') ||
    bridge.includes('This SDK build has no React Native artifacts')
) {
    throw new Error('The SDK contains no UniFFI JavaScript bridge.');
}
for (const binding of [
    'generateMnemonicEntropy',
    'createIdentityRecoveryRequest',
    'getAccountPublicKey',
    'createUnsignedCredentialV1',
    'verifyIdProof',
    'createPresentationV1',
    'serializeTypeValue',
    'generateValidatorKeyFixture',
]) {
    if (!bridge.includes(binding)) throw new Error(`Missing native binding ${binding}`);
}
console.log('Verified the SDK tarball contains the iOS and Android React Native artifacts.');
