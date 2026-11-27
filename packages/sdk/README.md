# concordium-web-sdk

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.0-4baaaa.svg)](https://github.com/Concordium/.github/blob/main/.github/CODE_OF_CONDUCT.md)

Wrappers for interacting with the Concordium node, for the web environment.

Please see the
[documentation](https://docs.concordium.com/concordium-node-sdk-js/latest/index.html)
for more information

**Table of Contents:**

<!--toc:start-->
- [concordium-web-sdk](#concordium-web-sdk)
  - [ConcordiumGRPCWebClient](#concordiumgrpcwebclient)
  - [ConcordiumGRPCNodeClient](#concordiumgrpcnodeclient)
  - [React Native](#react-native)
<!--toc:end-->

## ConcordiumGRPCWebClient

The SDK provides a gRPC client, which can interact with the [Concordium
Node](https://github.com/Concordium/concordium-node) using gRPC-web.

For an overview of the endpoints, [click
here](https://docs.concordium.com/concordium-node-sdk-js/latest/classes/grpc.ConcordiumGRPCClient.html).

To create a client, the `ConcordiumGRPCWebClient` class can be used. It
requires the address and port of the concordium node.

```ts
import { ConcordiumGRPCWebClient } from '@concordium/web-sdk';
...
return new ConcordiumGRPCWebClient(
    address,
    port,
    { timeout: 15000 }
);
```

The fourth argument is additional options. In the example
above we sat the timeout for a call to the node to 15
seconds. The options allowed here are those allowed by the
[grpcweb-transport](https://www.npmjs.com/package/@protobuf-ts/grpcweb-transport).

## ConcordiumGRPCNodeClient

_Note that this can ONLY be used in a nodeJS environment_

The SDK provides a gRPC client, which can interact with the [Concordium
Node](https://github.com/Concordium/concordium-node) using gRPC.

For an overview of the endpoints, [click
here](https://docs.concordium.com/concordium-node-sdk-js/latest/classes/grpc.ConcordiumGRPCClient.html).

To create a client, the `ConcordiumGRPCNodeClient` class can be used. It
requires the address and port of the concordium node.

```ts
import { ConcordiumGRPCNodeClient, credentials } from '@concordium/web-sdk/nodejs';
...
const creds = ...; // e.g. credentias.createInsecure();
return new ConcordiumGRPCWebClient(
    address,
    port,
    creds,
    { timeout: 15000 }
);
```

Like with the grpc web client, the fourth argument is additional options.

## React Native

### Native wallet bindings

Install `@concordium/web-sdk` in a React Native app using Hermes and the New
Architecture. Run `pod install` for iOS and rebuild your app after installing
the SDK. Android Gradle and iOS CocoaPods autolink the native module from the
SDK package. Expo apps use a development or production build with native
modules.

Import from `@concordium/web-sdk/react-native` to use the native bindings with
the default Metro configuration. The SDK bundles its own UTF-8 support for Hermes.
The root import also includes the legacy synchronous bindings. See
[Building the app](#building-the-app) for the memory requirements of that import.

```ts
import { createIdentityRequest, generateSeedPhrase, seedFromPhrase } from '@concordium/web-sdk/react-native';
import type { CryptographicParameters, IdentityRequestInput, Versioned } from '@concordium/web-sdk/react-native';

type Provider = Pick<IdentityRequestInput, 'ipInfo' | 'arsInfos'>;

async function getTestnetProviderParameters(providerId: number, arThreshold: number) {
    const proxy = 'https://wallet-proxy.testnet.concordium.com';
    const [providersResponse, globalResponse] = await Promise.all([
        fetch(`${proxy}/v2/ip_info`),
        fetch(`${proxy}/v0/global`),
    ]);
    if (!providersResponse.ok || !globalResponse.ok) {
        throw new Error('Could not load Testnet identity parameters');
    }
    const providers: Provider[] = await providersResponse.json();
    const parameters: Versioned<CryptographicParameters> = await globalResponse.json();
    const provider = providers.find(({ ipInfo }) => ipInfo.ipIdentity === providerId);
    if (!provider || parameters.v !== 0 || !parameters.value) {
        throw new Error('Testnet provider or cryptographic parameters unavailable');
    }
    return { ipInfo: provider.ipInfo, arsInfos: provider.arsInfos, arThreshold, globalContext: parameters.value };
}

const phrase = await generateSeedPhrase();
const seed = seedFromPhrase(phrase);
const parameters = await getTestnetProviderParameters(selectedProviderId, arThreshold);
const request = await createIdentityRequest({ ...parameters, seed, net: 'Testnet', identityIndex: 0 });
```

`selectedProviderId` is the Testnet provider the user chooses. Set `arThreshold`
according to your wallet's policy, between 1 and the smaller of 255 and the
number of available anonymity revokers. Keep the wallet seed in OS-backed
storage if the identity must survive app restarts. The provider list, verification UI, and retrieving
the issued identity belong to the app. The native APIs use the device's
cryptographic randomness and run request generation on a background thread.
The async entrypoint also includes identity recovery, HD wallet derivation,
credential construction and serialization, proofs, and contract schemas.
In the React Native package condition, these APIs are also available under
`Native`. The test app uses React Native 0.76.9.

### WASM-backed SDK APIs

To use the SDK in a react native context, it is required to include some polyfills for functionality used in the SDK.
The list of polyfills to be installed in the project alongside `@concordium/web-sdk` include:

```json
{
    ...
    "dependencies": {
        "@azure/core-asynciterator-polyfill": "...",
        "@stardazed/streams-polyfill": "...",
        "react-native-get-random-values": "...",
        "react-native-polyfill-globals": "..."
}
}
```

### Installation

```bash
yarn add @concordium/web-sdk react-native-polyfill-globals react-native-get-random-values @azure/core-asynciterator-polyfill @stardazed/streams-polyfill # or npm install
npx pod-install # if building for ios, adds native modules from dependencies to project.
```

### Building the app

Metro needs extra memory to bundle the JavaScript generated from the legacy WASM bindings.
If the initial build hits the Node heap limit, increase it with `NODE_OPTIONS=--max-old-space-size`.

Example of start script in `package.json`

```json
{
    "start": "NODE_OPTIONS=--max-old-space-size=16384 react-native start"
}
```

### Adding polyfill to app

```js
// polyfill.js
import '@stardazed/streams-polyfill';
import '@azure/core-asynciterator-polyfill';
import { polyfill as polyfillCrypto } from 'react-native-polyfill-globals/src/crypto'; // Requires peer dependency `react-native-get-random-values`

polyfillCrypto();
```

```js
// index.js
import { AppRegistry } from 'react-native';

import './polyfill'; // polyfills must be added before ./App

import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
```

This ensures the native modules required by the SDK are present.
