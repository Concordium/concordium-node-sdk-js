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

## React native

To use the SDK in a react native context, it is required to include some polyfills for functionality used in the SDK.
The list of polyfills to be installed in the project alongside `@concordium/web-sdk` include:

```json
{
    ...
    "dependencies": {
        "@azure/core-asynciterator-polyfill": "...",
        "@stardazed/streams-polyfill": "...",
        "react-native-get-random-values": "...",
        "react-native-polyfill-globals": "...",
        "text-encoding": "..."
}
}
```

### Installation

```bash
yarn add @concordium/web-sdk react-native-polyfill-globals react-native-get-random-values text-encoding @azure/core-asynciterator-polyfill @stardazed/streams-polyfill # or npm install
npx pod-install # if building for ios, adds native modules from dependencies to project.
```

### Building App

The initial app build may take a significant amount of RAM (up to 10Gb), due to converted wasm module to js code.
If you encounter the error `Reached heap limit Allocation failed - JavaScript heap out of memory`
You need to increase memory limit `NODE_OPTIONS=--max-old-space-size`

Example of start script in `package.json`

```json
{
    "start": "NODE_OPTIONS=--max-old-space-size=12288 react-native start"
}
```

### Adding polyfill to app

```js
// polyfill.js
import '@stardazed/streams-polyfill';
import '@azure/core-asynciterator-polyfill';
import { polyfill as polyfillEncoding } from 'react-native-polyfill-globals/src/encoding'; // Requires peer dependency `text-encoding`
import { polyfill as polyfillCrypto } from 'react-native-polyfill-globals/src/crypto'; // Requires peer dependency `react-native-get-random-values`

polyfillEncoding();
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
