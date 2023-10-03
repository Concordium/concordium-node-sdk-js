# concordium-web-sdk

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.0-4baaaa.svg)](https://github.com/Concordium/.github/blob/main/.github/CODE_OF_CONDUCT.md)

Wrappers for interacting with the Concordium node, for the web environment.

Please see the
[documentation](https://developer.concordium.software/concordium-node-sdk-js/index.html)
for more information

**Table of Contents:**

<!--toc:start-->
- [concordium-web-sdk](#concordium-web-sdk)
  - [ConcordiumGRPCWebClient](#concordiumgrpcwebclient)
  - [ConcordiumGRPCNodeClient](#concordiumgrpcnodeclient)
<!--toc:end-->

## ConcordiumGRPCWebClient

The SDK provides a gRPC client, which can interact with the [Concordium
Node](https://github.com/Concordium/concordium-node) using gRPC-web.

For an overview of the endpoints, [click
here](https://developer.concordium.software/concordium-node-sdk-js/classes/index.ConcordiumGRPCClient.html).

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
here](https://developer.concordium.software/concordium-node-sdk-js/classes/index.ConcordiumGRPCClient.html).

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
