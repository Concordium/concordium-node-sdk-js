# Concordium Rust bindings

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.0-4baaaa.svg)](https://github.com/Concordium/.github/blob/main/.github/CODE_OF_CONDUCT.md)

Bindings for the Rust functions that are used by the SDK.

## Building for a release
To build the package run
```
yarn build
```

This compiles the Rust code into wasm with Javascript wrappers.

## Publishing a release
Before publishing a new release it is essential that it has been built first. So make sure that 
you have just built the up-to-date code you want to publish. To publish the release run
```
yarn npm publish
```
and step through the steps precented to you.
