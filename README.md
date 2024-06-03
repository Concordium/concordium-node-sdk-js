# Concordium SDK for Javascript

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.0-4baaaa.svg)](https://github.com/Concordium/.github/blob/main/.github/CODE_OF_CONDUCT.md)

Wrappers for interacting with the Concordium node.

**Table of Contents:**

<!--toc:start-->
- [Concordium SDK for Javascript](#concordium-sdk-for-javascript)
  - [Documentation](#documentation)
  - [Packages](#packages)
<!-- markdown-link-check-disable -->
    - [sdk](#sdk-package)
    - [rust-bindings](#rust-bindings-package)
    - [ccd-js-gen package](#ccd-js-gen-package)
    - [wallet-connectors](#wallet-connectors-package)
    - [react-components](#react-components-package)
<!-- markdown-link-check-enable -->
  - [Install/updating dependencies](#installupdating-dependencies)
    - [MacOS arm64](#macos-arm64)
  - [Build](#build)
    - [Building for a release](#building-for-a-release)
    - [Building for development](#building-for-development)
  - [Making a new release](#making-a-new-release)
    - [sdk](#sdk)
    - [rust-bindings](#rust-bindings)
    - [ccd-js-gen](#ccd-js-gen)
    - [wallet-connectors](#wallet-connectors)
    - [react-components](#react-components)
  - [Test](#test)
<!--toc:end-->

## Documentation

Please see the
[documentation](https://developer.concordium.software/concordium-node-sdk-js/index.html)
for more information

## Packages

A collection of useful packages for building typescript/javascript applications within for the Concordium blockchain.

- <a id="sdk-package"></a>[`@concordium/web-sdk`](./packages/sdk):
  Contains the actual SDK, which can used in both a web and NodeJS environment.

- <a id="rust-bindings-package"></a>[`@concordium/rust-bindings`](./packages/rust-bindings):
  Contains bindings for Rust code, which is used by the SDK through WASM. This package is a utility package that
  should not be used directly, only through the usage of the SDK.

- <a id="ccd-js-gen-package"></a>[`@concordium/ccd-js-gen`](./packages/ccd-js-gen):
  A library and CLI for generating smart contract clients for TypeScript and JavaScript

- <a id="wallet-connectors-package"></a>[`@concordium/wallet-connectors`](./packages/wallet-connectors):
  Interfaces for interacting with wallets along with implementations for Browser Wallet and WalletConnect (v2).
  The library has no dependencies to any UI framework.

- <a id="react-components-package"></a>[`@concordium/react-components`](./packages/react-components):
  React components and hooks for implementing features commonly needed by dApps.
  The components only manage React state and pass data to application components - no actual HTML is being rendered.

## Install/updating dependencies

To install/update dependencies for the project, run

```shell
git submodule update --init --recursive
```

and

```shell
yarn
```

### MacOS arm64

It may be necessary to install Xcode when installing dependencies on a mac.

On a mac with an arm64 processor, it might also be required to explicitly set the target
architecture of dependencies to x64, as not all dependencies are available for the new mac
processors. This is done by replacing the `yarn` command with

```shell
npm_config_target_arch=x64 yarn
```

## Build

### Building for a release

To build the project run

```shell
yarn build:all
```

This will build all the subprojects.

### Building for development

To build the project quickly during development run

```shell
yarn build-dev:all
```

This will build all the subprojects.
Note that this skips generating the grpc API and optimizing the wasm modules.

## Making a new release

The following describes the requirements for creating  a new release for
each of the packages contained in this repository.

### SDK

- Bump the version in [package.json](./packages/sdk/package.json).
- Update the [CHANGELOG](./packages/sdk/CHANGELOG.md) describing the
  changes made.
- Create a pull request to merge the changes into the target branch.
- Pull and tag the merge commit for the release.
  - Tag should be `sdk/x.y.z`.
- Push the tag
- Have another code owner accept the deployment

### rust-bindings

- Bump the version in [package.json](./packages/rust-bindings/package.json).
- Update the [CHANGELOG](./packages/rust-bindings/CHANGELOG.md) describing
  the changes made.
- Update the dependency to rust-bindings in the [sdk](./packages/sdk/package.json)
- Update the CHANGELOG in the [sdk](./packages/sdk/CHANGELOG.md)
  - Add a change entry: Bumped @concordium/rust-bindings to x.y.z.
- Create a pull request to merge the changes into the target branch.
- Pull and tag the merge commit for the release.
  - Tag should be `rust-bindings/x.y.z` and `sdk/x.y.z` respectively.
- Push the tags
- Have another code owner accept the deployment

### ccd-js-gen

- Bump the version in [package.json](./packages/ccd-js-gen/package.json).
- Update the [CHANGELOG](./packages/ccd-js-gen/CHANGELOG.md) describing
  the changes made.
- Create a pull request to merge the changes into the target branch.
- Pull and tag the merge commit for the release.
  - Tag should be `ccd-js-gen/x.y.z`.
- Push the tag
- Have another code owner accept the deployment

### wallet-connectors

- Bump the version in [package.json](./packages/wallet-connectors/package.json).
- Update the [CHANGELOG](./packages/wallet-connectors/CHANGELOG.md) describing
  the changes made.
- Create a pull request to merge the changes into the target branch.
- Pull and tag the merge commit for the release.
  - Tag should be `wallet-connectors/x.y.z`.
- Push the tag
- Have another code owner accept the deployment

### react-components

- Bump the version in [package.json](./packages/react-components/package.json).
- Update the [CHANGELOG](./packages/react-components/CHANGELOG.md) describing
  the changes made.
- Create a pull request to merge the changes into the target branch.
- Pull and tag the merge commit for the release.
  - Tag should be `react-components/x.y.z`.
- Push the tag
- Have another code owner accept the deployment

## Test

An automatic test suite is part of this project, and it is run by executing:

```shell
yarn test:all
```

This will run the tests for each package.

Note that the tests for nodejs require a locally running concordium-node on
the testnet. Otherwise the tests will fail.
