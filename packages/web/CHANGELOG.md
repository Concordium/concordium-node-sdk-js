# Changelog

## 4.0.0 2023-05-15

### Breaking Changes

- Bumped @concordium/common-sdk to 7.0.0:
- Bumped @concordium/rust-bindings to 0.12.0. (Adds key derivation for verifiable credentials)
  - Updated `blockInfo` so that the `bakerId` field is optional, since it will be undefined for genesis blocks.
  - `waitForTransactionFinalization` now returns a `BlockItemSummaryInBlock`
  - Added missing version return type in `getModuleSchema`. It now returns an object containing the schema source and version.

## 3.5.0 2023-5-03

### Changed

- Bumped @concordium/common-sdk to 6.5.0. (Adds `CIS2Contract`)

## 3.4.2 2023-4-21

### Changed

- Bumped @concordium/common-sdk to 6.4.2. (`generateBakerKeys` include private baker keys in output)

## 3.4.1 2023-3-31

### Changed

- Bumped @concordium/common-sdk to 6.4.1. (Fixes `waitForTransactionFinalization`)

## 3.4.0 2023-3-22

### Changed

- Bumped @concordium/common-sdk to 6.4.0. (Adds `deserializeTypeValue`)

## 3.3.1 2023-2-27

### Fixed

- Updated rules in package.json to include missing files.

## 3.3.0 2023-2-27

### Added

- Added a `createConcordiumClient` function to create the gRPC v2 client.

### Changed

- Bumped @concordium/common-sdk to 6.3.0. (Adds the gRPC v2 client)

### Deprecated

- The JSON-RPC client (from common-sdk) has been deprecated in favor of the new gRPC v2 client.

## 3.2.0 2022-1-4

### Changed

- Bumped @concordium/common-sdk to 6.2.0. (adds support serializing smart contract types with only the specific type's schema)

## 3.1.0 2022-11-30

### Changed

- Bumped @concordium/common-sdk to 6.1.0. (adds support for id statements and proofs)

## 3.0.0 2022-11-15

### Changed

- Bumped @concordium/common-sdk to 6.0.0. (Which changes transaction type names and field names to be aligned with other implementations)

## 2.1.0 2022-10-27

### Changed

- Bumped @concordium/common-sdk to 5.1.0. (Which adds cookie support to HttpProvider)

## 2.0.0 2022-9-29

### Breaking Changes

- Bumped @concordium/common-sdk to 5.0.0. (Which changes the function signature of signMessage and verifySignMessage)

## 1.0.0 2022-9-2

### Breaking Changes

- Bumped @concordium/common-sdk to 4.0.0. (Which changes the function signature of ConcordiumHdWallet)

## 0.5.0 2022-8-26

### Breaking Changes

- Bumped @concordium/common-sdk to 3.0.0. (Which includes breaking changes to schema versioning)

## 0.4.0 2022-8-15

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
