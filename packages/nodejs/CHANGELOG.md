# Changelog

## 2.0.0

### Added

- Using `@concordium/common-sdk` as a dependency, and most features have been removed from this package. (But are re-exported instead)
- Support deserializing version 2 schemas.
- Support serializing parameters for contracts using version 2 schemas.
- Support for deploying versioned smart contract modules, which is the format used in cargo-concordium v2+. (This is done by not supplying the version field in the payload)

### Breaking changes

- `serializeInitContractParameters` and `serializeUpdateContractParameters` each have an additional parameter, which denotes the version of the schema provided. For existing users that are using V0 contracts, that parameter should be `SchemaVersion.V1`.
- Deserialization of schemas have been changed: types and functions have been renamed and `getModuleFromBuffer` have an additional parameter, and now returns a versioned module schema.

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
