# concordium-web-sdk

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.0-4baaaa.svg)](https://github.com/Concordium/.github/blob/main/.github/CODE_OF_CONDUCT.md)

Wrappers for interacting with the Concordium node, for the web environment.

[Note that this package contains and exports the functions from the common-sdk, check the readme of that package for an overview of those](../common/README.md).

## Json-Rpc client
The SDK provides a json-rpc client, which can interact with the [Concordium json-rpc server](https://github.com/Concordium/concordium-json-rpc)

### Creating a client
To create a client, one needs a provider, which handles sending and receiving over a specific protocol. Currently the only one available is the HTTP provider.
The http provider needs the url to the json-rpc server. The following example demonstrates how to create a client that connects to a local server on port 9095:
```js
const client = new JsonRpcClient(new HttpProvider("http://localhost:9095"));
```

### API Entrypoint
Currently the client only supports the following entrypoints, with the same interface as the node client:

- [SendTransaction](../nodejs#constructing-transactions)
- [getTransactionStatus](../nodejs#getTransactionStatus)
- [getInstanceInfo](../nodejs#getInstanceInfo)
- [getConsensusStatus](../nodejs#getConsensusStatus)

## Creating buffers
Some of the functions in the SDK expects buffers as input.
For this purpose the SDK exports a `toBuffer` function, which is a polyfill of the [buffer.from from the Nodejs API](https://nodejs.org/api/buffer.html#static-method-bufferfromstring-encoding) for strings.
```js
const myBuffer = toBuffer('AB2C2D', 'hex');
```

## Examples
A few simple webpages have been made, to showcase using the web-sdk. They can be found in the `example` folder.
Note that the project should be built before running the example, otherwise they won't work.
The examples that uses json-rpc, expects a json-rpc server on `http://localhost:9095`.

### SendTransaction.html
An example of how to send a transaction using the SDK to a json-rpc server.

### GetInstanceInfo.html
An example of getting the info of a given smart contract instance using a json-rpc server.

### Alias.html
A very minimal example of a webpage showing alias'es of a given address, using the bundled blob.

### GetTransactionStatus.html
A simple example that allows calling a json-rpc server for a given transaction's status and displays the status.

### GetNonce.html
A simple example that allows calling a json-rpc server for a given account's next nonce and displays it.

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
