# Concordium Nodejs SDK

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.0-4baaaa.svg)](https://github.com/Concordium/.github/blob/main/.github/CODE_OF_CONDUCT.md)

Wrappers for interacting with the Concordium node, using nodejs.

[Note that this package contains and exports the functions from the common-sdk, check the readme of that package for an overview of those](../common/README.md).


**Table of Contents**
- [ConcordiumNodeClient](#concordiumnodeclient)
- [Build](#build)
    - [Building for a release](#building-for-a-release)
    - [Publishing a release](#publishing-a-release)
- [Test](#test)

# ConcordiumNodeClient
The SDK provides a gRPC client, which can interact with the [Concordium Node](https://github.com/Concordium/concordium-node)

For an overview of the endpoints, [check here](../../docs/gRPC.md).

To create a client, the function `createConcordiumClient` can be used. It requires the address and port of the node. 
It also requires credentials to be specified. These can be used for create either an insecure connection or a TLS connection. In the following example the credentials are created for a TLS connection:

```js
import { credentials } from '@grpc/grpc-js/';
...
return createConcordiumClientV2(
    address,
    port,
    credentials.createSsl(),
    { timeout: 15000 }
);
```

The fourth argument is additional options. In the example above we sat the timeout for a call to the node to 15 seconds. The options allowed here are those allowed by the [grpc-transport](https://www.npmjs.com/package/@protobuf-ts/grpc-transport).

The connection to a node can be either an insecure connection or a TLS connection. Note that the node that you are trying to connect to must support TLS, for a TLS connection to work. Otherwise an insecure connection can be created by using `credentials.createInsecure()` instead.

To see the documentation for the deprecated v1 client, [check here](../../docs/grpc-v1.md).
For an overview of how to migrate from the v1 client to the v2 client, [check here](../../docs/grpc-migration.md).

# Build

## Building for a release
To build the package run
```
yarn build
```

Note that the dependent packages must already have been built. To easily do this, build from the package root instead.

## Publishing a release
Before publishing a new release it is essential that it has been built first. So make sure that 
you have just built the up-to-date code you want to publish. To publish the release run
```
yarn npm publish
```
and step through the steps presented to you.

# Test
An automatic test suite is part of this project, and it is run by executing:
```
yarn test
```
Note that the tests require a locally running concordium-node on the testnet. Otherwise the tests will fail.
