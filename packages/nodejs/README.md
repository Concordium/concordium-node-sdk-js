# Concordium NodeJS SDK

## Deprecation notice

The `@concordium/node-sdk` package is now deprecated and will not receive major/minor version updates going forward.`@concordium/web-sdk@^7` is now compatible with nodeJS, and can be used for both browser and nodeJS runtimes. A GRPC client for nodeJS runtimes is accessible at `@concoridum/web-sdk/nodejs` (does not use GRPC-web).

More information can be found in [the upgrade guide](https://developer.concordium.software/concordium-node-sdk-js/pages/misc-pages/upgrade-guide.html#web-sdk-version-7)

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.0-4baaaa.svg)](https://github.com/Concordium/.github/blob/main/.github/CODE_OF_CONDUCT.md)

Wrappers for interacting with the Concordium node, using nodejs.

Please see the
[documentation](https://developer.concordium.software/concordium-node-sdk-js/index.html)
for more information

## ConcordiumGRPCClient

The SDK provides a gRPC client, which can interact with the [Concordium
Node](https://github.com/Concordium/concordium-node)

For an overview of the endpoints, [click
here](https://developer.concordium.software/concordium-node-sdk-js/modules/Common_GRPC_Client.html).

To create a client, the function `createConcordiumClient` can be used. It
requires the address and port of the node.  It also requires credentials to
be specified. These can be used for create either an insecure connection or
a TLS connection. In the following example the credentials are created for
a TLS connection:

```ts
import { credentials } from '@grpc/grpc-js/';
import { createConcordiumClient } from '@concordium/node-sdk';
...
return createConcordiumClient(
    address,
    port,
    credentials.createSsl(),
    { timeout: 15000 }
);
```

The fourth argument is additional options. In the example
above we sat the timeout for a call to the node to 15
seconds. The options allowed here are those allowed by the
[grpc-transport](https://www.npmjs.com/package/@protobuf-ts/grpc-transport).

The connection to a node can be either an insecure connection or a TLS
connection. Note that the node that you are trying to connect to must support
TLS, for a TLS connection to work. Otherwise an insecure connection can be
created by using `credentials.createInsecure()` instead.

To see the documentation for the deprecated v1 client, [click
here](https://developer.concordium.software/concordium-node-sdk-js/pages/misc-pages/grpc-v1.html).
For an overview of how to migrate from the v1 client to the v2 client, [click
here](https://developer.concordium.software/concordium-node-sdk-js/pages/misc-pages/grpc-migration.html).
