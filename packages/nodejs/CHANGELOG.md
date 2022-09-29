# Changelog

## 5.0.0

### Breaking Changes

- Bumped @concordium/common-sdk to 5.0.0. (Which changes the function signature of ConcordiumHdWallet and sign helpers functions)

## 4.0.0 2022-8-26

### Breaking Changes

- Bumped @concordium/common-sdk to 3.0.0. (Which includes breaking changes to schema versioning)

## 3.0.2 2022-7-26

### Fixed

- `deserializeTransaction` no longer throws an error on expired transactions.

## 3.0.1 2022-7-26

### Fixed

- `deserializeTransaction` is now exported from index.

## 3.0.0 - 2022-7-25

### Added

- `deserializeTransaction` function to deserialize transaction created by `serializeAccountTransactionForSubmission` and `serializeCredentialDeploymentTransactionForSubmission`. (Currently SimpleTransfer, SimpleTransferWithMemo and RegisterData are the only supported account transactions kinds)

### Breaking changes

- getInstanceInfo, getModuleSource and invokeContract's parameters have changed order. Now the blockHash is the 2nd parameter instead of the 1st.

## 2.1.1 2022-7-8

### Fixed

- Fixed contract schema serialization for ByteList.

## 2.1.0 2022-7-5

### Added

- Support deserializing new schema types: ULeb128, ILeb128, ByteArray and ByteList.
- Support deserializing schemas with versioning information.

### Changed

- The function for deserializing a module schema `deserialModuleFromBuffer` now have the schema version as an optional argument. The function will try to extract the version from the buffer. When a version is provided it falls back to this, otherwise it throws an error.

## 2.0.2 2022-6-27

### Fixed

- `getModuleBuffer` returns correct type of `Buffer`.

## 2.0.1 2022-6-27

### Added

- `getModuleBuffer`, which is `getModuleFromBuffer` renamed (which was removed in 2.0.0).

### Fixed

- Error in build, which caused imports to fail.
- Added missing dependency google-protobuf.
- @noble/ed25519 and cross-fetch moved from devDependencies to dependencies. (In common-sdk)

## 2.0.0 2022-6-24

### Added

- Using `@concordium/common-sdk` as a dependency, and most features have been removed from this package. (But are re-exported instead)
- Support deserializing version 2 schemas.
- Support serializing parameters for contracts using version 2 schemas.
- Support for deploying versioned smart contract modules, which is the format used in cargo-concordium v2+. (This is done by not supplying the version field in the payload)

### Breaking changes

- `serializeInitContractParameters` and `serializeUpdateContractParameters` each have an additional parameter, which denotes the version of the schema provided. For existing users that are using V0 contracts, that parameter should be `SchemaVersion.V1`.
- Deserialization of schemas have been changed: types and functions have been renamed and `deserialModuleFromBuffer` have an additional parameter, and now returns a versioned module schema.

## 1.1.0 2022-06-14

### Added

- Support for the Invoke contract node entrypoint.

### Fixed

- Lossy parsing of uint64's from the node, if their value was above MAX_SAFE_INTEGER.

## 1.0.0 2022-05-11

### Added

- Support for getting baker list from node.
- Support for getting status of a Baker Pool/Passive delegation (required node to have protocol version 4 or later).
- Support for getting reward status of chain at specific block.
- Helper functions for determining the version of `BlockSummary` and nested types. 
- Helper functions for determining the version of `AccountInfo` variants. 
- Support for the new "configure delegation" transaction type.

### Changed

- Updated `BlockSummary` type to include new version, effective from protocol version 4.
- Updated `AccountInfo` type to include new fields related to delegation introduced with protocol version 4.

## 0.7.3 2022-05-05

### Added

- Export of serializeCredentialDeploymentTransactionForSubmission.

### Fixed

- Added missing dependency "google-protobuf"

## 0.7.2 2022-05-05


### Added

- Export of serializeAccountTransactionForSubmission.

## 0.7.1 2022-03-09

### Added

- Support for initiating and updating contracts with parameters.

## 0.6.0 2022-02-02

### Added

- Function to deserialize contract state.
- Support for register data transaction.

## 0.5.1 2021-11-19

### Added

- Functions to generate account aliases, and check if addresses are aliases.

## 0.4.0 2021-11-17

### Added

- Support for getting account info for a credential registration id.
- Support for the update credentials account transaction.
- Support for deploy module, initiate contract and update contract (without parameters).

## 0.3.0 2021-10-28

### Added

- Support for the credential deployment transaction.
- Helpers to decrypt mobile wallet exports, in particular to extract identity information from the export.
