# Changelog

## 2.4.0

### Added

- `createIdentityRequest`, to create identity requests.
- `createCredentialV1`, to create credentials using a seedPhrase.
- Added `sendCredentialDeployment` to send credentials created from `createCredentialV1` to the chain.
- `getSignedCredentialDeploymentTransactionHash` to get the transaction hash of credentials created from `createCredentialV1`.
-  Added `ConfigureBaker` to `AccountTransactionType` enum.

## 2.3.2 2022-7-26

### Fixed

- `deserializeTransaction` no longer throws an error on expired transactions.

## 2.3.1 2022-7-26

### Fixed

- `deserializeTransaction` is now exported from index.

## 2.3.0 2022-7-25

### Added

- `deserializeTransaction` function to deserialize transaction created by `serializeAccountTransactionForSubmission` and `serializeCredentialDeploymentTransactionForSubmission`. (Currently SimpleTransfer, SimpleTransferWithMemo and RegisterData are the only supported account transactions kinds)

## 2.2.0 2022-7-21

### Added

- Add support for getAccountInfo, InvokeContract, getCryptographicParameters and getModuleSource with JSON-RPC

## 2.1.1 2022-7-8

### Fixed

- Fixed contract schema serialization for ByteList

## 2.1.0 2022-7-5

### Added

- Support deserializing new schema types: ULeb128, ILeb128, ByteArray and ByteList.
- Support deserializing schemas with versioning information.

### Changes

- The function for deserializing a module schema `deserialModuleFromBuffer` now have the schema version as an optional argument. The function will try to extract the version from the buffer. When a version is provided it falls back to this, otherwise it throws an error.

## 2.0.1 2022-6-27

### Fixed

- @noble/ed25519 and cross-fetch moved from devDependencies to dependencies.

## 2.0.0 2022-6-24

### Added

- Support deserializing version 2 schemas.
- Support serializing parameters for contracts using version 2 schemas.
- Support for deploying versioned smart contract modules, which is the format used in cargo-concordium v2+. (This is done by not supplying the version field in the payload)

### Breaking changes

- `serializeInitContractParameters` and `serializeUpdateContractParameters` each have an additional parameter, which denotes the version of the schema provided. For existing users that are using V0 contracts, that parameter should be `SchemaVersion.V1`.
- Deserialization of schemas have been changed: types and functions have been renamed and `deserialModuleFromBuffer` have an additional parameter.

## 1.0.1 2022-6-2

### Fixed

-   Fixed JSON-RPC client crash on empty response when calling getInstanceInfo.
    (And update the format of the arguments  for the server)
-   Fixed issue by bumping rust bindings version

## 1.0.0 2022-5-25

-   Initial release
