# Changelog

## Unreleased

### Breaking changes

- The package is published as an ES module, instead of UMD. Migration steps can be seen in [the upgrade guide](../../docs/pages/misc-pages/upgrade-guide.md)
- The package has been split into several entrypoints that can be used to limit the scope of what is included from the SDK.
  - `@concordium/web-sdk` exposes the full API of the SDK.
  - `@concordium/web-sdk/cis0` entrypoint exposes functionality for working with contracts adhering to the [CIS-0](https://proposals.concordium.software/CIS/cis-0.html) standard.
  - `@concordium/web-sdk/cis2` entrypoint exposes functionality for working with contracts adhering to the [CIS-2](https://proposals.concordium.software/CIS/cis-2.html) standard.
  - `@concordium/web-sdk/cis4` entrypoint exposes functionality for working with contracts adhering to the [CIS-4](https://proposals.concordium.software/CIS/cis-4.html) standard.
  - `@concordium/web-sdk/grpc` entrypoint exposes the grpc client for interacting with a nodes GRPCv2 interface.
  - `@concordium/web-sdk/id` entrypoint exposes functionality for working with ID proofs.
  - `@concordium/web-sdk/json-rpc` entrypoint exposes the **(deprecated)** json-rpc client for interacting with a nodes GPRCv1 interface.
  - `@concordium/web-sdk/schema` entrypoint exposes functionality for working with smart contract schemas, i.e.(de)serializing types using a smart contract schema.
    - This uses the wasm entrypoint at `@concordium/rust-bindings/dapp`.
  - `@concordium/web-sdk/types` entrypoint exposes functionality for working with concordium domain types.
  - `@concordium/web-sdk/wasm` entrypoint exposes a variety of functionality for working with concordium domain types, which requires WASM.
    - This uses the wasm entrypoint at `@concorodium/rust-bindings/wallet`.
  - `@concordium/web-sdk/web3-id` entrypoint exposes functionality for working with web3-id proofs.
  - This change makes the library **incompatible** with node versions <16 and requires bundlers to respect the `exports` field of `package.json`.
  - For TypeScript projects the minimum required version of typescript is:
    - NodeJS: 4.7, `"moduleResolution": "node16" // or "nodenext"`
    - Bundled applications (webpack, esbuild, rollup, etc...): 5.0, `"moduleResolution": "bundler"`


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

### Added

- All JSON serialization in `serialization.ts` is now handled by `json-bigint` meaning that all functions now correctly handles bigint inputs
- `Timestamp` is now a module with functions related to time.
  - To refer to `Timestamp` as a type use `Timestamp.Type`.
- `Duration` is now a module with functions related to durations of time.
- `EntrypointName` is now a module with functions related to entrypoint names of a smart contract.
- `ReceiveName` is now a module with functions related to receive-function names of a smart contract.

## 6.4.0

- Bumped @concordium/common-sdk to 9.4.0.

## 6.3.0

- Bumped @concordium/common-sdk to 9.3.0.

## 6.2.1

- Bumped @concordium/common-sdk to 9.2.1.

## 6.2.0

- Bumped @concordium/common-sdk to 9.2.0.

## 6.1.1

### Changed

- Bumped @concordium/common-sdk to 9.1.1. (includes fixes for `verifyWeb3IdCredentialSignature` and `canProveAtomicStatement`)

## 6.1.0

### Changed

- Bumped @concordium/rust-bindings to 1.2.0 and @concordium/common-sdk to 9.1.0. (adds methods for creating verifiable presentation (proving statements about Web3Id Credentials))

## 6.0.0

### Breaking changes

- Bumped @concordium/rust-bindings to 1.1.0 and @concordium/common-sdk to 9.0.0. (adds `displayTypeSchemaTemplate/getTransactionKindString` and renames `AccountTransactionType.TransferWithScheduleWithMemo`)

## 5.0.0

### Breaking changes

- Bumped @concordium/rust-bindings to 1.0.0. (Throws proper `Error`s when execution fails for any WASM entrypoint, with improved error messages)
- Bumped @concordium/common-sdk to 8.0.0:
  - Properly formed errors thrown by functions wrapping WASM execution (from @concordium/rust-bindings) with more helpful error messages.
  - Types adapted to changes in protocol version 6.
  - and [more](../common/CHANGELOG.md)

## 4.0.1 2023-05-25

### Changed

- Bumped @concordium/common-sdk to 7.0.1. (Fixes `deployModule` cost)

## 4.0.0 2023-05-15

### Breaking Changes

- Bumped @concordium/rust-bindings to 0.12.0. (Adds key derivation for verifiable credentials)
- Bumped @concordium/common-sdk to 7.0.0:
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

- Fixed issue with wasm from rust bindings

## 0.1.0

- Initial release
