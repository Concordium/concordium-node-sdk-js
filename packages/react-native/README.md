# Concordium SDK for React Native

Use the Concordium SDK to add wallet functionality to iOS and Android apps
running Hermes and the New Architecture. UniFFI connects the TypeScript API
to Rust for mnemonic generation, HD key derivation, identity issuance and
recovery, credential deployment, proofs, and contract schema operations.

## Install in an app

Use React Native 0.76 or later and install a release of `@concordium/web-sdk`
that includes the native bindings.

```sh
npm install @concordium/web-sdk
```

For iOS, run `pod install` from your app's `ios/` directory. CocoaPods and
Android Gradle autolink the `ConcordiumNative` module from the package.
Rebuild the app to load the native module. In Expo, use a development or
production build that includes native modules.

Use the default Metro configuration. The SDK bundles its own UTF-8 support,
so the app can import it directly.

## Derive an account public key

Import the async wallet from `@concordium/web-sdk/react-native`.

```ts
import { ConcordiumHdWallet } from '@concordium/web-sdk/react-native';

async function deriveAccountPublicKey(importedPhrase: string, providerIndex: number) {
    const wallet = ConcordiumHdWallet.fromSeedPhrase(importedPhrase, 'Testnet');
    const publicKey = await wallet.getAccountPublicKey(providerIndex, 0, 0);
    return publicKey.toString('hex');
}
```

The example uses identity index `0` and credential counter `0`. Use
`generateSeedPhrase()` to create a 24-word English BIP-39 mnemonic from
device randomness. Use `fromHex` when the app already has a hex-encoded
64-byte seed.
Keep mnemonics and seeds in OS-backed storage if the wallet must survive
app restarts.

See the SDK's [identity request example](../sdk/README.md#native-wallet-bindings)
for fetching provider and chain parameters. For smart contracts, use
`Parameter.fromSchemaType` from the native subpath to encode a parameter,
and `ReturnValue.parseWithSchemaType` or `ContractEvent.parseWithSchemaType`
to decode a result.

## Async operations

Issuance, recovery, credential construction, proof generation, and schema
operations run on Rust worker threads. The bindings accept four concurrent
worker jobs. On saturation they reject with the `WorkerBusy` error tag.
Issuance, recovery, and proof generation accept a `signal` option for an
`AbortSignal`. Aborting discards the result and the running Rust job releases
its slot when it finishes. Native errors expose a stable `tag` for error
handling.

Use the native subpath to keep the legacy WASM bindings out of the app bundle.
The React Native root import also exposes the async APIs through `Native`
alongside the synchronous SDK APIs.

## Build and pack from source

Use Node.js 22 or 24, the repository's Yarn version, and Rust 1.89. Install
Xcode for iOS builds. For Android, install NDK 27.1.12297006 and set
`ANDROID_NDK_HOME` or `ANDROID_HOME`.

From the repository root, build and pack the SDK for both platforms.

```sh
git submodule update --init --recursive
rustup toolchain install 1.89 --profile minimal
rustup target add --toolchain 1.89 \
  aarch64-apple-ios aarch64-apple-ios-sim x86_64-apple-ios \
  aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
cargo +1.89 install cargo-ndk --version 3.5.4 --locked
yarn install --immutable
CONCORDIUM_NATIVE_TARGETS=ios,android yarn build:all
mkdir -p packages/react-native/artifacts
yarn workspace @concordium/web-sdk pack --out ../react-native/artifacts/web-sdk.tgz
node packages/react-native/scripts/verify-package.mjs packages/react-native/artifacts/web-sdk.tgz
```

Install the archive from your app directory with
`npm install /path/to/web-sdk.tgz`, then repeat the platform setup above.
Set `CONCORDIUM_NATIVE_TARGETS` to `ios` or `android` for a single-platform
local archive. The package verifier checks for artifacts from both
platforms.

For an existing SDK build, regenerate only the native artifacts with
`yarn workspace @concordium/web-sdk build:native ios,android`.
