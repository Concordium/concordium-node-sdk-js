# Concordium SDK for Javascript

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.0-4baaaa.svg)](https://github.com/Concordium/.github/blob/main/.github/CODE_OF_CONDUCT.md)

Wrappers for interacting with the Concordium node.

# Packages

Contains the different packages for the js SDK's.

## [Nodejs](./packages/nodejs)

Contains the nodejs SDK, particularly the client that wraps the grpc calls to the node, using grpc, is located here. 

## [Web](./packages/web)

Contains the web SDK, which can used in a web environment.

## [Common](./packages/common)

Contains the shared library for the nodejs and web SDK's.
All serialization and most utility functions are located in this package.


## [Rust-bindings](./packages/common)

Contains bindings for Rust code, which is used by the common package. This package is a utility package that should not be used directly, only through the usage of the common package.

# Build

## Building for a release
To build the project run
```
yarn build
```
This will build all the subprojects.
Note that you must have [wasm-pack](https://rustwasm.github.io/wasm-pack/) installed to build the project.

## Making a new release
The following describes the requirements for creating  a new release for each of the packages contained in this repository.
### common
- Bump the version in [package.json](./packages/common/package.json).
- Update the [CHANGELOG](./packages/common/CHANGELOG.md) describing the changes made.
- Update the dependency to common in the [web](./packages/web/package.json) and [nodejs](./packages/nodejs/package.json) packages.
- Update the CHANGELOG in the [web](./packages/web/CHANGELOG.md) and [nodejs](./packages/nodejs/CHANGELOG.md) packages.
  - Add a change entry: Bumped @concordium/common-sdk to x.y.z.
- Commit and tag the release.
  - Tag should be `common/x.y.z`.
- Build the release.
  - From the root of the repository run: `yarn build`. This ensures that dependencies are built correctly.
- Publish the release to NPM.
  - From the common package directory (packages/common) run ```yarn npm publish```

### nodejs
- Bump the version in [package.json](./packages/nodejs/package.json).
- Update the [CHANGELOG](./packages/nodejs/CHANGELOG.md) describing the changes made.
- Commit and tag the release.
  - Tag should be `nodejs/x.y.z`.
- Build the release.
  - From the root of the repository run: `yarn build`. This ensures that dependencies are built correctly.
- Publish the release to NPM.
  - From the nodejs package directory (packages/nodejs) run ```yarn npm publish```

### web
- Bump the version in [package.json](./packages/web/package.json).
- Update the [CHANGELOG](./packages/web/CHANGELOG.md) describing the changes made.
- Commit and tag the release.
  - Tag should be `web/x.y.z`.
- Build the release.
  - From the root of the repository run: `yarn build`. This ensures that dependencies are built correctly.
- Publish the release to NPM.
  - From the web package directory (packages/web) run ```yarn npm publish```

### rust-bindings
- Bump the version in [package.json](./packages/rust-bindings/package.json).
- Update the [CHANGELOG](./packages/rust-bindings/CHANGELOG.md) describing the changes made.
- Update the dependency to rust-bindings in the [common](./packages/common/package.json) package.
- Update the CHANGELOG in the [common](./packages/common/CHANGELOG.md) package
  - Add a change entry: Bumped @concordium/rust-bindings to x.y.z.
- Commit and tag the release.
  - Tag should be `rust-bindings/x.y.z`.
- Build the release.
  - From the root of the repository run: `yarn build`. This ensures that dependencies are built correctly.
- Publish the release to NPM.
  - From the rust-bindings package directory (packages/rust-bindings) run ```yarn npm publish```

# Test
An automatic test suite is part of this project, and it is run by executing:
```
yarn test
```

This will run the tests for each package.
Note that the tests for nodejs require a locally running concordium-node on the testnet. Otherwise the tests will fail.
