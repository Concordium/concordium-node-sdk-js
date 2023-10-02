# Changelog

## Unreleased

### Breaking changes

- The package is published as an ES module, instead of commonJS. Migration steps can be seen in [the upgrade guide](../../docs/pages/misc-pages/upgrade-guide.md)
- The package has been split into several entrypoints that can be used to limit the scope of what is included from the SDK.
  - `@concordium/node-sdk` exposes the full API of the SDK.
  - `@concordium/node-sdk/cis0` entrypoint exposes functionality for working with contracts adhering to the [CIS-0](https://proposals.concordium.software/CIS/cis-0.html) standard.
  - `@concordium/node-sdk/cis2` entrypoint exposes functionality for working with contracts adhering to the [CIS-2](https://proposals.concordium.software/CIS/cis-2.html) standard.
  - `@concordium/node-sdk/cis4` entrypoint exposes functionality for working with contracts adhering to the [CIS-4](https://proposals.concordium.software/CIS/cis-4.html) standard.
  - `@concordium/node-sdk/client` entrypoint exposes the **(deprecated)** grpc client for interacting with a nodes GPRCv1 interface.
  - `@concordium/node-sdk/grpc` entrypoint exposes the grpc client for interacting with a nodes GRPCv2 interface.
  - `@concordium/node-sdk/id` entrypoint exposes functionality for working with ID proofs.
  - `@concordium/node-sdk/schema` entrypoint exposes functionality for working with smart contract schemas, i.e.(de)serializing types using a smart contract schema.
    - This uses the wasm entrypoint at `@concordium/rust-bindings/dapp`.
  - `@concordium/node-sdk/types` entrypoint exposes functionality for working with concordium domain types.
  - `@concordium/node-sdk/wasm` entrypoint exposes a variety of functionality for working with concordium domain types, which requires WASM.
    - This uses the wasm entrypoint at `@concorodium/rust-bindings/wallet`.
  - `@concordium/node-sdk/web3-id` entrypoint exposes functionality for working with web3-id proofs.
  - This change makes the library **incompatible** with node versions <16 and requires bundlers to respect the `exports` field of `package.json`.
  - For TypeScript projects the minimum required version of typescript is:
    - NodeJS: 4.7, `"moduleResolution": "node16" // or "nodenext"`
    - Bundled applications (webpack, esbuild, rollup, etc...): 5.0, `"moduleResolution": "bundler"`

- Removed `ConcordiumNodeClient` and types and functionality associated solely with this class.

The API now uses dedicated types instead of language primitives:
- Use `AccountAddress` instead of a string with base58 encoding. Use `AccountAddress.fromBase58('<base58>')` to construct it.
- Use `BlockHash` instead of a string with hex encoding. Use `BlockHash.fromHexString('<hex>')` to construct it.
- Use `TranactionHash` instead of a string with hex encoding. Use `TransactionHash.fromHexString('<hex>')` to construct it.
- Use `Energy` instead of a bigint. Use `Energy.create(<integer>)` to construct it.
- Use `ReceiveName` instead of a string. Use `ReceiveName.fromString('<contract>.<function>')` to construct it.
- Use `InitName` instead of a string. Use `Init.fromString('init_<contract>')` to construct it.
- Use `ContractName` instead of a string. Use `ContractName.fromString('<contract>')` to construct it.
- Use `EntrypointName` instead of a string. Use `EntrypointName.fromString('<function>')` to construct it.
- Use `Parameter` instead of a string with hex encoding. Use `Parameter.fromHexString('<hex>')`.
- Use `SequenceNumber` (formerly called nonce) instead of a bigint. Use `SequenceNumber.create(<integer>)` to construct it.
- Use `Timestamp` instead of a bigint. Can be constructed using `Timestamp.fromMillis(<integer>)`.
- Use `Duration` instead of a bigint. Can be constructed using `Duration.fromMillis(<integer>)`.
- Use `ContractEvent` instead of a string with hex encoding. Can be constructed using `ContractEvent.fromHexString('<hex>')`.

Several types have been replaced with a module containing the type itself together with functions for constructing and converting the type:

- `AccountAddress` is now a module with functions related to account addresses:
  - To refer to `AccountAddress` as a type use `AccountAddress.Type`.
  - Constructing `new AccountAddress("<address>")` is now `AccountAddress.fromBase58("<address>")`.
  - `isAlias` and `getAlias` are now accessable from `AccountAddress.isAlias` and `AccountAddress.getAlias`.
- `ContractAddresss` is now a module with functions related to contract addresses:
  - To refer to `ContractAddress` as a type use `ContractAddress.Type`.
  - To construct the type use `ContractAddress.create(index, subindex)`.
- `CredentialRegistrationId` is now a module with functions related to credential registration IDs:
  - To refer to `CredentialRegistrationId` as a type use `CredentialRegistrationId.Type`.
  - Constructing `new CredentialRegistrationId("<hex-string>")` is now `CredentialRegistrationId.fromHexString("<hex-string>")`.

- Renamed `AccountSequenceNumber` module to `SequenceNumber`.
- Fix type for `TranferredEvent` from `ContractTraceEvent` to only be from contract addresses to account addresses.

### Added

- All JSON serialization in `serialization.ts` is now handled by `json-bigint` meaning that all functions now correctly handles bigint inputs
- `Timestamp` is now a module with functions related to time.
  - To refer to `Timestamp` as a type use `Timestamp.Type`.
- `Duration` is now a module with functions related to durations of time.
- `EntrypointName` is now a module with functions related to entrypoint names of a smart contract.
- `ReceiveName` is now a module with functions related to receive-function names of a smart contract.

## 9.4.0

- Bumped @concordium/common-sdk to 9.4.0.

## 9.3.0

- Bumped @concordium/common-sdk to 9.3.0.

## 9.2.0

- Bumped @concordium/common-sdk to 9.2.0.

## 9.1.1

### Changed

- Bumped @concordium/common-sdk to 9.1.1. (includes fixes for `verifyWeb3IdCredentialSignature` and `canProveAtomicStatement`)

## 9.1.0

### Changed

- Bumped @concordium/common-sdk to 9.1.0. (adds methods for creating verifiable presentation (proving statements about Web3Id Credentials))

## 9.0.0

### Breaking changes

- Bumped @concordium/common-sdk to 9.0.0. (adds `displayTypeSchemaTemplate/getTransactionKindString` and renames `AccountTransactionType.TransferWithScheduleWithMemo`)

## 8.0.0

### Breaking changes

- Bumped @concordium/common-sdk to 8.0.0:
  - Properly formed errors thrown by functions wrapping WASM execution (from @concordium/rust-bindings) with more helpful error messages.
  - Types adapted to changes in protocol version 6.
  - and [more](../common/CHANGELOG.md)

## 7.0.0 2023-05-15

### Breaking Changes

- Bumped @concordium/common-sdk to 7.0.0:
  - Updated `blockInfo` so that the `bakerId` field is optional, since it will be undefined for genesis blocks.
  - `waitForTransactionFinalization` now returns a `BlockItemSummaryInBlock`
  - Added missing version return type in `getModuleSchema`. It now returns an object containing the schema source and version.

## 6.4.0 2023-5-03

### Changed

- Bumped @concordium/common-sdk to 6.5.0. (Adds `CIS2Contract`)

## 6.3.0 2023-3-22

### Changed

- Bumped @concordium/common-sdk to 6.4.0. (Adds `deserializeTypeValue`)

## 6.2.0 2023-2-27

### Added

- Added a `createConcordiumClient` function to create the gRPC v2 client.

### Changed

- Bumped @concordium/common-sdk to 6.3.0. (Adds the gRPC v2 client)

### Fixed

- The value of amount fields in the GRPCv1 client's invokeContract's events has been changed to bigint (instead of string) as the type specifies.

### Deprecated

- The old gRPC client has been deprecated in favor of the new gRPC v2 client.

## 6.1.0 2022-11-30

### Changed

- Bumped @concordium/common-sdk to 6.1.0. (adds support for id statements and proofs)

## 6.0.0 2022-11-15

### Breaking Changes

- Bumped @concordium/common-sdk to 6.0.0. (Which changes transaction type names and field names to be aligned with other implementations)

## 5.0.0 2022-11-8

Breaking Changes

- Bumped @concordium/common-sdk to 5.2.0. (Which changes the function signature of ConcordiumHdWallet and sign helpers functions)

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
