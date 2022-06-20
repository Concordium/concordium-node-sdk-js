# concordium-web-sdk

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.0-4baaaa.svg)](https://github.com/Concordium/.github/blob/main/.github/CODE_OF_CONDUCT.md)

Wrappers for interacting with the Concordium node, for the web environment.

[Note that this package contains and exports the functions from the common-sdk, check the readme of that package for an overview of those](../common/README.md).

**Table of Contents**
- [JSON-RPC client](#json-rpc-client)
    - [Creating a client](#creating-a-client)
    - [API Entrypoints](#api-entrypoints)
- [Creating buffers](#creating-buffers)
- [Examples](#examples)
    - [SendTransaction.html](#sendtransactionhtml)
    - [GetInstanceInfo.html](#getinstanceinfohtml)
    - [Alias.html](#aliashtml)
    - [GetTransactionStatus.html](#gettransactionstatushtml)
    - [GetNonce.html](#getnoncehtml)
- [Build](#build)
    - [Building for a release](#building-for-a-release)
    - [Publishing a release](#publishing-a-release)

# JSON-RPC client
The SDK provides a JSON-RPC client, which can interact with the [Concordium JSON-RPC server](https://github.com/Concordium/concordium-json-rpc)

## Creating a client
To create a client, one needs a provider, which handles sending and receiving over a specific protocol. Currently the only one available is the HTTP provider.
The HTTP provider needs the URL to the JSON-RPC server. The following example demonstrates how to create a client that connects to a local server on port 9095:
```js
const client = new JsonRpcClient(new HttpProvider("http://localhost:9095"));
```

## API Entrypoints
Currently the client only supports the following entrypoints, with the same interface as the node client:

- [sendTransaction](../nodejs#send-account-transaction)
- [getTransactionStatus](../nodejs#gettransactionstatus)
- [getInstanceInfo](../nodejs#getInstanceInfo)
- [getConsensusStatus](../nodejs#getconsensusstatus)
- [getAccountInfo](../nodejs#getAccountInfo)
- [getCryptographicParameters](../nodejs#getcryptographicparameters)
- [invokeContract](../nodejs#invokecontract)
- [getModuleSource](../nodejs#getModuleSource)

# Creating buffers
Some of the functions in the SDK expects buffers as input.
For this purpose the SDK exports a `toBuffer` function, which is a polyfill of the [buffer.from from the Nodejs API](https://nodejs.org/api/buffer.html#static-method-bufferfromstring-encoding) for strings.
```js
const myBuffer = toBuffer('AB2C2D', 'hex');
```

# Examples
A few simple webpages have been made, to showcase using the web-sdk. They can be found in the `example` folder.
Note that the project should be built before running the examples, otherwise they won't work.
The examples that use JSON-RPC expect a JSON-RPC server on running at `http://localhost:9095`.

## SendTransaction.html
An example of how to send a transaction using the SDK to a JSON-RPC server.

## GetInstanceInfo.html
An example of getting the info of a given smart contract instance using a JSON-RPC server.

## Alias.html
A very minimal example of a webpage showing alias'es of a given address, using the bundled SDK.

## GetTransactionStatus.html
A simple example that allows calling a JSON-RPC server for a given transaction's status and displays the status.

## GetNonce.html
A simple example that allows calling a JSON-RPC server for a given account's next nonce and displays it.

## InvokeContract.html
An simple example of how to invoke a given smart contract instance using a JSON-RPC server.

## GetCryptographicParameters.html
An example of getting the crypgographic parameters of the chain using a JSON-RPC server.

## GetAccountInfo.html
An example of getting the info of a given account using a JSON-RPC server.

## GetModuleSource.html
An example of getting the source of a model on the chain using a JSON-RPC server.


# Build

## Building for a release
To build the package run
```
yarn build
```

This transpiles the project to Javascript, wherefter webpack is used to create a single pure Javascript file which is put in the `lib` directory.

Note that the dependent packages must already have been built. To easily do this, build from the package root instead.

## Publishing a release
Before publishing a new release it is essential that it has been built first. So make sure that 
you have just built the up-to-date code you want to publish. To publish the release run
```
yarn npm publish
```
and step through the steps presented to you.
