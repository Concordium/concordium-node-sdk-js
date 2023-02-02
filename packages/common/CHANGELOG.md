# Changelog

## Unreleased

- Added the following GRPCv2 functions:
    - `getAccountList()`
    - `getModuleList()`
    - `getAncestors()`
    - `getInstanceState()`
    - `instanceStateLookup()`
    - `getIdentityProviders()`
    - `getAnonymityRevokers()`
    - `getBlocksAtHeight()`
    - `getBlockInfo()`
    - `getBakerList()`
    - `getPoolDelegators()`
    - `getPoolDelegatorsRewardPeriod()`
    - `getPassiveDelegators()`
    - `getPassiveDelegatorsRewardPeriod()`
    - `getBranches()`
    - `getElectionInfo()`

## 6.4.0

- Added `getFinalizedBlocks()` & `getBlocks()` GRPCv2 functions.
- Added public helper function `waitForTransactionFinalization()` to client

## 6.3.0

### Added

- Added a GRPCv2 client starting with the following functions:
    - `getAccountInfo()`
    - `getNextAccountSequenceNumber()`
    - `getCryptographicParameters()`
    - `getBlockItemStatus()`
    - `getConsensusInfo()`
    - `getModuleSource()`
    - `getInstanceInfo()`
    - `invokeInstance()`
    - `getAccountTransactionSignHash()`
    - `sendAccountTransaction()`
    - `sendCredentialDeploymentTransaction()`

- Serialization:
    - `serializeAccountTransactionPayload()`
    - `serializeCredentialDeploymentPayload()`

## 6.2.0 2023-01-04

### Added

- `serializeTypeValue` that allows smart contract types to be serialized using the specific schema, instead of only by providing the entire module's schema.
- `getInitContractParameterSchema` Given a buffer containing the schema for a module, extract the schema for a given contract's init function's parameters.
- `getReceiveContractParameterSchema` Given a buffer containing the schema for a module, extract the schema for a given contract's receive methods' parameters.

## 6.1.0 2022-11-30

### Added

- `IdStatementBuilder` class to help build id statements.
- `verifyIdStatement` function to verify that a statement is well-formed and complies with rules for id statements.
- `getIdProof` function to prove a statement holds for the given identity/account.
- Enums for sex and idDocType values.

## 6.0.0 2022-11-15

### Breaking changes

- Change AccountTransactionType names/string values to align with those in Concordium base.
- Change some field names in UpdateConcractPayload, InitContractPayload and DeployModule to align with those in Concordium base.
- Rename GtuAmount class to CcdAmount. And change the microGtuAmount field to microCcdAmount.
- Add custom toJSON methods for the classes CcdAmount, AccountAddress, ModuleReference, CredentialRegistrationId, DataBlob and TransactionExpiry, in order to match the serialisation of their equivalents in Concordium base.

### Added

- The ability to deserialize error values of receive and init functions using `deserializeReceiveError()` and `deserializeInitError()` respectfully.
- Refactored the `upserializeUpdateContractParameters()` and `serializeInitContractParameters()` to call into rust functions.

## 5.2.0 2022-11-8

### Added

- The ability to deserialize the return values of receive functions using `deserializeReceiveReturnValue()`.

## 5.1.0 2022-9-29

### Added

- Additional arguments to the JSON-RPC HttpProvider, to enable is to receive and forward cookies.

### Fixed

- getAccountInfo no longer relies on instanceof to determine the type of input.

## 5.0.0 2022-9-29

### Added

- `getCredentialId` to the HdWallet.

### Breaking changes

- Updated the signature of helper functions for accounts to sign messages. (and changed the prepend)

## 4.0.0 2022-8-26

### Breaking changes

- ConcordiumHdWallet methods now take the identity provider index as arguments.
- Bumped @concordium/rust-bindings to 0.4.0.

### Fixed

 - Added missing `accountAddress` field to `AccountInfo` types.

## 3.0.0 2022-8-26

### Added

- Support for new V2 schemas which can specify error types.

### Breaking changes

- SchemaVersion, Module, and schema types are now 0-indexed instead of 1-indexed. This means that the schemas used for V0 contracts are now version 0, and so is the associated types. And the first schema version for V1 contracts are now version 1.

## 2.4.0 2022-8-15

### Added

- `createIdentityRequest`, to create identity requests.
- `createCredentialV1`, to create credentials using a seedPhrase.
- `createIdentityRecoveryRequest`, to create identity recovery requests.
- Added `sendCredentialDeployment` to send credentials created from `createCredentialV1` to the chain.
- `getSignedCredentialDeploymentTransactionHash` to get the transaction hash of credentials created from `createCredentialV1`.
- Added `ConfigureBaker` to `AccountTransactionType` enum.
- Added `ConcordiumHdWallet` with functions to get keys and randomness from a seed phrase.

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
