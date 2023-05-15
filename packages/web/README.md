# concordium-web-sdk

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.0-4baaaa.svg)](https://github.com/Concordium/.github/blob/main/.github/CODE_OF_CONDUCT.md)

Wrappers for interacting with the Concordium node, for the web environment.

Please see the
[documentation](https://developer.concordium.software/concordium-node-sdk-js/index.html)
for more information

**Table of Contents:**

<!--toc:start-->
- [concordium-web-sdk](#concordium-web-sdk)
  - [ConcordiumNodeClient](#concordiumnodeclient)
  - [JSON-RPC client](#json-rpc-client)
  - [Creating buffers](#creating-buffers)
  - [Examples](#examples)
    - [SendTransaction.html](#sendtransactionhtml)
    - [GetInstanceInfo.html](#getinstanceinfohtml)
    - [Alias.html](#aliashtml)
    - [GetTransactionStatus.html](#gettransactionstatushtml)
    - [GetNonce.html](#getnoncehtml)
    - [InvokeContract.html](#invokecontracthtml)
    - [GetCryptographicParameters.html](#getcryptographicparametershtml)
    - [GetAccountInfo.html](#getaccountinfohtml)
    - [GetModuleSource.html](#getmodulesourcehtml)
    - [SendCIS2Transfer.html](#sendcis2transferhtml)
    - [SendCIS2UpdateOperator.html](#sendcis2updateoperatorhtml)
<!--toc:end-->

## ConcordiumGRPCClient
The SDK provides a gRPC client, which can interact with the [Concordium
Node](https://github.com/Concordium/concordium-node) using gRPC-web.

For an overview of the endpoints, [click
here](https://developer.concordium.software/concordium-node-sdk-js/modules/Common_GRPC_Client.html).

To create a client, the function `createConcordiumClient` can be used. It
requires the address and port of the concordium node.

```ts
import { createConcordiumClient } from '@concordium/web-sdk';
...
return createConcordiumClient(
    address,
    port,
    { timeout: 15000 }
);
```

The third argument is additional options. In the example
above we sat the timeout for a call to the node to 15
seconds. The options allowed here are those allowed by the
[grpcweb-transport](https://www.npmjs.com/package/@protobuf-ts/grpcweb-transport).

## JSON-RPC client

> :warning: **The JSON-RPC client has been deprecated**: the gRPC client
  should be used instead to communicate directly with a node
> To migrate,the migration guide from the v1 client to the v2 client [can
  be found
  here](https://developer.concordium.software/concordium-node-sdk-js/pages/misc-pages/grpc-migration.html),
  as the JSON-RPC's endpoints shares interface with the equivalent endpoints
  in the v1 gRPC client

The SDK also provides a JSON-RPC client, [check here for the
documentation](https://developer.concordium.software/concordium-node-sdk-js/pages/misc-pages/grpc-v1.html).

## Creating buffers

Some of the functions in the SDK expects buffers as
input. For this purpose the SDK exports a `toBuffer`
function, which is a polyfill of the [buffer.from from the Nodejs
API](https://nodejs.org/api/buffer.html#static-method-bufferfromstring-encoding)
for strings.

```ts
const myBuffer = toBuffer('AB2C2D', 'hex');
```

## Examples

A few simple webpages have been made, to showcase using the web-sdk. They
can be found in the `example` folder. Note that the project should be built
before running the examples, otherwise they won't work.  The examples that
use JSON-RPC expect a JSON-RPC server on running at `http://localhost:9095`.

### SendTransaction.html

An example of how to send a transaction using the SDK to a JSON-RPC server.

### GetInstanceInfo.html

An example of getting the info of a given smart contract instance using a
JSON-RPC server.

### Alias.html

A very minimal example of a webpage showing alias'es of a given address,
using the bundled SDK.

### GetTransactionStatus.html

A simple example that allows calling a JSON-RPC server for a given
transaction's status and displays the status.

### GetNonce.html

A simple example that allows calling a JSON-RPC server for a given account's
next nonce and displays it.

### InvokeContract.html

An simple example of how to invoke a given smart contract instance using a
JSON-RPC server.

### GetCryptographicParameters.html

An example of getting the crypgographic parameters of the chain using a
JSON-RPC server.

### GetAccountInfo.html

An example of getting the info of a given account using a JSON-RPC server.

### GetModuleSource.html

An example of getting the source of a model on the chain using a JSON-RPC
server.

### SendCIS2Transfer.html

An example of sending a CIS2 "transfer" transaction
by utilizing the `CIS2Contract` class. Please
note that this example requires the [Concordium Wallet for
Web](https://chrome.google.com/webstore/detail/concordium-wallet/mnnkpffndmickbiakofclnpoiajlegmg)
to be installed to work.

### SendCIS2UpdateOperator.html

An example of sending a CIS2 "updateOperator"
transaction by utilizing the `CIS2Contract` class. Please
note that this example requires the [Concordium Wallet for
Web](https://chrome.google.com/webstore/detail/concordium-wallet/mnnkpffndmickbiakofclnpoiajlegmg)
to be installed to work.
