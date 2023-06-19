# Concordium SDK for Javascript

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.0-4baaaa.svg)](https://github.com/Concordium/.github/blob/main/.github/CODE_OF_CONDUCT.md)

Wrappers for interacting with the Concordium node.

**Table of Contents:**

<!--toc:start-->
- [Concordium SDK for Javascript](#concordium-sdk-for-javascript)
  - [Documentation](#documentation)
  - [Packages](#packages)
    - [Nodejs package](#nodejs-package)
    - [Web package](#web-package)
    - [Common package](#common-package)
    - [Rust-bindings package](#rust-bindings-package)
  - [Install/updating dependencies](#installupdating-dependencies)
    - [MacOS arm64](#macos-arm64)
  - [Build](#build)
    - [Building for a release](#building-for-a-release)
    - [Building for development](#building-for-development)
  - [Making a new release](#making-a-new-release)
    - [common](#common)
    - [nodejs](#nodejs)
    - [web](#web)
    - [rust-bindings](#rust-bindings)
  - [Test](#test)
<!--toc:end-->

## Documentation

Please see the
[documentation](https://rasmus-kirk.github.io/concordium-node-sdk-js/index.html)
for more information

## Packages

Contains the different packages for the JS-SDKs.

### Nodejs package

The [Nodejs package](./packages/nodejs) contains the Nodejs SDK, particularly the client that wraps the GRPC calls
to the node, is located here.

### Web package

The [Web package](./packages/web) contains the Web SDK, which can used in a web environment.

### Common package

The [common package](./packages/common) contains the shared library for the Nodejs and Web SDK's. The GRPC-client, all serialization
and most utility functions are located in this package.

### Rust-bindings package

The [common package](./packages/common) contains bindings for Rust code, which is used by the common package. This
package is a utility package that should not be used directly, only through
the usage of the common package.

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

When installing/updating dependencies on a mac with an arm64 processor, it
might be required to explicitly set the target architecture of dependencies
to x64, as not all dependencies are available for the new mac processors. This
is done by replacing the `yarn` command with

```shell
npm_config_target_arch=x64 yarn
```

## Build

### Building for a release

To build the project run

```shell
yarn build
```

This will build all the subprojects.

Note that you must have [wasm-pack](https://rustwasm.github.io/wasm-pack/)
installed to build the project.

### Building for development

To build the project quickly during development run

```shell
yarn build:dev
```

This will build all the subprojects.
Note that this skips generating the grpc API and optimizing the wasm modules.

## Making a new release

The following describes the requirements for creating  a new release for
each of the packages contained in this repository.

### common

- Bump the version in [package.json](./packages/common/package.json).
- Update the [CHANGELOG](./packages/common/CHANGELOG.md) describing the
  changes made.
- Update the dependency to common in the [web](./packages/web/package.json)
  and [nodejs](./packages/nodejs/package.json) packages.
- Update the CHANGELOG in the [web](./packages/web/CHANGELOG.md) and
  [nodejs](./packages/nodejs/CHANGELOG.md) packages.
  - Add a change entry: Bumped @concordium/common-sdk to x.y.z.
- Commit and tag the release.
  - Tag should be `common/x.y.z`.
- Run the deploy workflow.
  - Under github actions, run the "deploy" workflow and download the
    `build-release` artifact. Unpack this file and use it for the release.
- Publish the release to NPM.
  - From the common package directory (packages/common) run `yarn npm publish`

### nodejs

- Bump the version in [package.json](./packages/nodejs/package.json).
- Update the [CHANGELOG](./packages/nodejs/CHANGELOG.md) describing the
  changes made.
- Commit and tag the release.
  - Tag should be `nodejs/x.y.z`.
- Build the release.
  - Under github actions, run the "deploy" workflow and download the
    `build-release` artifact. Unpack this file and use it for the release.
- Publish the release to NPM.
  - From the nodejs package directory (packages/nodejs) run `yarn npm publish`

### web

- Bump the version in [package.json](./packages/web/package.json).
- Update the [CHANGELOG](./packages/web/CHANGELOG.md) describing the
  changes made.
- Commit and tag the release.
  - Tag should be `web/x.y.z`.
- Build the release.
  - Under github actions, run the "deploy" workflow and download the
    `build-release` artifact. Unpack this file and use it for the release.
- Publish the release to NPM.
  - From the web package directory (packages/web) run `yarn npm publish`

### rust-bindings

- Bump the version in [package.json](./packages/rust-bindings/package.json).
- Update the [CHANGELOG](./packages/rust-bindings/CHANGELOG.md) describing
  the changes made.
- Update the dependency to rust-bindings in the
  [common](./packages/common/package.json) and
  [web](./packages/web/package.json) packages.
- Update the CHANGELOG in the [common](./packages/common/CHANGELOG.md) and
  [web](./packages/web/CHANGELOG.md) packages.
  - Add a change entry: Bumped @concordium/rust-bindings to x.y.z.
- Commit and tag the release.
  - Tag should be `rust-bindings/x.y.z`.
- Build the release.
  - Under github actions, run the "deploy" workflow and download the
    `build-release` artifact. Unpack this file and use it for the release.
- Publish the release to NPM.
  - From the rust-bindings package directory (packages/rust-bindings) run
    `yarn npm publish`

## Test

An automatic test suite is part of this project, and it is run by executing:

```shell
yarn test
```

This will run the tests for each package.

Note that the tests for nodejs require a locally running concordium-node on
the testnet. Otherwise the tests will fail.
