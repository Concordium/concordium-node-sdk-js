# Changelog

## 0.5.0 2022-8-26

### Breaking Changes

- Bumped @concordium/common-sdk to 3.0.0. (Which includes breaking changes to schema versioning)

## 0.4.0 2022-8-8

### Changed

- Bumped @concordium/common-sdk to 2.4.0.

## 0.3.0 2022-7-21

### Added

- Add support for getAccountInfo, InvokeContract, getCryptographicParameters and getModuleSource with JSON-RPC
- Support deserializing new schema types: ULeb128, ILeb128, ByteArray and ByteList.
- Support deserializing schemas with versioning information.

### Changed

- The function for deserializing a module schema `deserialModuleFromBuffer` now have the schema version as an optional argument. The function will try to extract the version from the buffer. When a version is provided it falls back to this, otherwise it throws an error.

## 0.2.1 2022-6-27

### Fixed

- @noble/ed25519 and cross-fetch moved from devDependencies to dependencies. (In common-sdk)

## 0.2.0 2022-6-24

### Added

- Support deserializing version 2 schemas.
- Support serializing parameters for contracts using version 2 schemas.
- Support for deploying versioned smart contract modules, which is the format used in cargo-concordium v2+. (This is done by not supplying the version field in the payload)

### Breaking changes

- `serializeInitContractParameters` and `serializeUpdateContractParameters` each have an additional parameter, which denotes the version of the schema provided. For existing users that are using V0 contracts, that parameter should be `SchemaVersion.V1`.
- Deserialization of schemas have been changed: types and functions have been renamed and `getModuleFromBuffer` have an additional parameter.

## 0.1.2

- Add type file missing from the package

## 0.1.1

-   Fixed issue with wasm from rust bindings

## 0.1.0

-   Initial release
