# concordium-node-sdk-js

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.0-4baaaa.svg)](https://github.com/Concordium/.github/blob/main/.github/CODE_OF_CONDUCT.md)

Wrappers for interacting with the Concordium node.

# Packages

Contains the different packages for the js SDK's.

## [Common](./packages/common)

Contains the shared library for the nodejs and web SDK's.
All serialization and most utility functions are located in this package.

## [Nodejs](./packages/nodejs)

Contains the nodejs SDK, particularly the client that wraps the grpc calls to the node, using grpc, is located here. 

## [Web](./packages/web)

Contains the web SDK, which can used in a web environment.

## [Rust-bindings](./packages/common)

Contains bindings for rust code, which is used by the common package.
(This should not be used directly, but instead through common)

# Build

## Building for a release
To build the project run
```
yarn build
```
This will build all the subprojects.
Note that you must have [wasm-pack](https://rustwasm.github.io/wasm-pack/) installed to build the project.

## Publishing a release
Currently publishing is done individually for each package. 

# Test
An automatic test suite is part of this project, and it is run by executing:
```
yarn test
```

This will run the tests for each package.
Note that the tests for nodejs require a locally running concordium-node on the testnet. Otherwise the tests will fail.
