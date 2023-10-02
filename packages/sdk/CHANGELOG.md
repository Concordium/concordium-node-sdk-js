# Changelog

## Unreleased

### Breaking changes

- The package is published as an ES module, instead of commonJS. Migration steps can be seen in [the upgrade guide](../../docs/pages/misc-pages/upgrade-guide.md)
- The package has been split into several entrypoints that can be used to limit the scope of what is included from the SDK.
  - `@concordium/common-sdk` exposes the full API of the SDK.
  - `@concordium/common-sdk/cis0` entrypoint exposes functionality for working with contracts adhering to the [CIS-0](https://proposals.concordium.software/CIS/cis-0.html) standard.
  - `@concordium/common-sdk/cis2` entrypoint exposes functionality for working with contracts adhering to the [CIS-2](https://proposals.concordium.software/CIS/cis-2.html) standard.
  - `@concordium/common-sdk/cis4` entrypoint exposes functionality for working with contracts adhering to the [CIS-4](https://proposals.concordium.software/CIS/cis-4.html) standard.
  - `@concordium/common-sdk/grpc` entrypoint exposes the grpc client for interacting with a nodes GRPCv2 interface.
  - `@concordium/common-sdk/id` entrypoint exposes functionality for working with ID proofs.
  - `@concordium/common-sdk/schema` entrypoint exposes functionality for working with smart contract schemas, i.e.(de)serializing types using a smart contract schema.
    - This uses the wasm entrypoint at `@concordium/rust-bindings/dapp`.
  - `@concordium/common-sdk/types` entrypoint exposes functionality for working with concordium domain types.
  - `@concordium/common-sdk/wasm` entrypoint exposes a variety of functionality for working with concordium domain types, which requires WASM.
    - This uses the wasm entrypoint at `@concorodium/rust-bindings/wallet`.
  - `@concordium/common-sdk/web3-id` entrypoint exposes functionality for working with web3-id proofs.
  - This change makes the library **incompatible** with node versions <16 and requires bundlers to respect the `exports` field of `package.json`.
  - For TypeScript projects the minimum required version of typescript is:
    - NodeJS: 4.7, `"moduleResolution": "node16" // or "nodenext"`
    - Bundled applications (webpack, esbuild, rollup, etc...): 5.0, `"moduleResolution": "bundler"`
- The following functions now parse using `json-bigint` meaning that they return bigints instead of numbers _for all numbers no matter size_
  - `deserializeContractState`
  - `deserializeReceiveReturnValue`
  - `deserializeReceiveError`
  - `deserializeInitError`
  - `deserializeTypeValue`

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
- Removed `JsonRpcClient` and types and functionality associated solely with this class.

- Renamed `AccountSequenceNumber` module to `SequenceNumber`.

### Added

- All JSON serialization in `serialization.ts` is now handled by `json-bigint` meaning that all functions now correctly handles bigint inputs
- `Timestamp` is now a module with functions related to time.
  - To refer to `Timestamp` as a type use `Timestamp.Type`.
- `Duration` is now a module with functions related to durations of time.
- `EntrypointName` is now a module with functions related to entrypoint names of a smart contract.
- `ReceiveName` is now a module with functions related to receive-function names of a smart contract.
- `ReturnValue` is now a module with functions related to return values from invoking a smart contract.

### Changes

- Added version discriminators to types versioned by the protocol version of Concordium nodes:
  - `MintDistribution`
  - `GasRewards`
  - `RewardParameters`
  - `ChainParameters`
  - `Authorizations`
  - `RewardStatus`
  - `BlockInfo`
  - `ConsensusStatus`
  - `AccountBakerDetails`
  - `ElectionInfo`
- Added type discriminator to different forms of `AccountInfo`.

## 9.4.0

### Added

- `sendUpdateInstruction` to the gRPC Client.
- `healthCheck` to the gRPC Client.
- Function `calculateModuleReference` for getting the module reference.
- Function `parseModuleInterface` for getting the interface from the source of a smart contract module.
- Function `getEmbeddedModuleSchema` for getting the module schema embedded into a smart contract module source.
- Smart contract related types `ContractName`, `EntrypointName` and helper functions `isInitName`, `isReceiveName`, `getContractNameFromInit` and `getNamesFromReceive`.
- Add `ModuleClient` module and type for interaction with a smart contract module deployed on chain.
- Add `Energy` module with helpers for transaction energy.
- Add `BlockHash` module with helpers for block hashes.
- Add `TransactionHash` module with helpers for transaction hashes.
- Add `InitName` module with helpers for smart contract init-function names.
- Add `ContractName` module with helpers for smart contract names.
- Add `Parameter` module with helpers for smart contract parameters.
- Add `AccountSequenceNumber` module with helpers for account sequence numbers (formerly referred to as nonce).
- Add methods `getInstanceInfo` and `checkOnChain` on the generic contract client `Contract`.

### Fixed

- Added missing fields to `getBlockChainParameters` response. (rootKeys, level1Keys, level2Keys)
- Use of bigint exponentiation causing issues in web.

## 9.3.0

### Added

- `sendRawAccountTransaction` to the gRPC Client.

### Changed

- Stopped using `replaceDateWithTimeStampAttribute` and `reviveDateFromTimeStampAttribute` for serializing and parsing verifiable presentation.
- AttributeType no longer contains `Date`, but now instead has `TimestampAttribute`. The statement builders have their types extended to keep allowing for both `Date` and `TimestampAttribute`.

## 9.2.1

### Fixed

- Missing buffer import causing issues in web.

## 9.2.0

### Breaking changes

- `sendCredentialDeploymentTransaction` method of `ConcordiumGRPCClient` signature changed to take an already serialized payload.

### Added

- `CIS4Contract` class for seemlessly interacting with contracts adhering to the CIS4 standard.
- Validation of type values when verifying statements.
- Exposed `replaceDateWithTimeStampAttribute` and `reviveDateFromTimeStampAttribute`.

### Fixed

- Aligned credential schema types with the tested types in the browser wallet.
- `addMinimumAge` now creates the precise age statement instead of one day off.

## 9.1.1

### Fixes

- `verifyWeb3IdCredentialSignature` now supports dates/timestamp attributes.
- `canProveAtomicStatement` now supports timestamp attributes, handles undefined attribute value correctly and handles strings correctly for range statements.

## 9.1.0

### Added

Added a functions that handle conversions between CCD and micro CCD. The CCD amounts are handled as `Big`'s:

- `toMicroCcd` returns the amount of micro CCD as a `Big`.
- `toCcd`: returns the amount of CCD as a `Big`.
- `fromCcd`: constructs a `CcdAmount` from an amount of CCD passed as a `Big`
- `ccdToMicroCcd`: Converts CCD to micro CCD, both as `Big`'s
- `microCcdToCcd`: Converts micro CCD to CCD, both as `Big`'s
- The `CcdAmount` class constructor now also accepts a `BigSource` letting users create them from `Big`'s and strings

All function parameters now also accepts strings, these strings can use comma as a decimal seperator.

- `Web3StatementBuilder` function.
- `getVerifiablePresentation` function.
- Various helper methods for web3Id statements and verifiable presentations.

### Fixes

- The max smart contract parameter length was changed to 65535 bytes in protocol version 5 and onwards.
  Functions which checks the parameter length will now reflect that.

## 9.0.0

### Breaking changes

- Renamed `AccountTransactionType.TransferWithScheduleWithMemo` to `AccountTransactionType.TransferWithScheduleAndMemo`.

### Changed

- Bumped @concordium/rust-bindings to 1.1.0 (adds `display_type_schema_template` function)

### Added

- `getTransactionKindString` function.
- `displayTypeSchemaTemplate` function.

## 8.0.0

### Breaking changes

- Bumped @concordium/rust-bindings to 1.0.0. (Throws proper `Error`s when execution fails for any WASM entrypoint, with improved error messages)
- Updated `types.ts` to conform to updated GRPC API, which includes adding more variants to existing types (all new variants take effect from protocol version 6):
  - `ChainParametersV2` added to `ChainParameters`
  - `BlockInfo` changed to `BlockInfoV0 | BlockInfoV1`
  - `ConsensusStatus` changed to `ConsensusStatusV0 | ConsensusStatusV1`
  - `ElectionInfo` changed to `ElectionInfoV0 | ElectionInfoV1`

### Fixed

- Cost calculation for `deployModule` transaction.
- Fixed a bug where protocol version was different (i.e. 1 less than what it should be) when using the gRPCv2 API (compared to what is returned by the gRPCv1 API).

### Changes

- Function `uleb128Decode` now parses correctly and throws an error if the given input contains more than a single ULEB128 encoded number.

### Added

- A `parseWallet` function to parse wallet export files
- Helper functions to determine version of versioned types mentioned in "Breaking Changes" have been added.
- Support for new chain update types.
- Function `uleb128DecodeWithIndex` that can also parse more than a single ULEB128 bigint
- Added `tokenAddressFromBase58` and `tokenAddressToBase58` to CIS2

### Changed

- The following functions now all have an additional parameter controlling whether errors are in a verbose format or not:
  - `deserializeContractState`
  - `deserializeReceiveReturnValue`
  - `deserializeReceiveError`
  - `deserializeInitError`
  - `deserializeTypeValue`
  - `serializeInitContractParameters`
  - `serializeUpdateContractParameters`
  - `serializeTypeValue`

## 7.0.1 2023-05-25

### Fixed

- Cost calculation for `deployModule` transaction.

## 7.0.0 2023-05-15

### Breaking changes

- Updated `blockInfo` so that the `bakerId` field is optional, since it will be undefined for genesis blocks.
- `waitForTransactionFinalization` now returns a `BlockItemSummaryInBlock`
- Added missing version return type in `getModuleSchema`. It now returns an object containing the schema source and version.

### Added

- Helpers for calculating energy cost for a transaction and microCCD cost from energy cost:
  - `getEnergyCost`
  - `getExchangeRate`
  - `convertEnergyToMicroCcd`
- Utility functions for extracting information from `BlockItemSummary`:
  - `isInitContractSummary`
  - `isUpdateContractSummary`
  - `isTransferLikeSummary`
  - `isRejectTransaction`
  - `isSuccessTransaction`
  - `getTransactionRejectReason`
  - `getReceiverAccount`
  - `affectedContracts`
  - `affectedAccounts`
- Utility functions for extracting information from `BlockSpecialEvent`:
  - `specialEventAffectedAccounts`
- Helper methods on `GRPCClient` for chain traversal:
  - `getFinalizedBlocksFrom`
  - `findEarliestFinalized`
  - `findInstanceCreation`
  - `findFirstFinalizedBlockNoLaterThan`
- Extended HdWallet with support for verifiable credential key deriviation.

### Changed

- Bumped @concordium/rust-bindings to 0.12.0. (Adds key derivation for verifiable credentials)

## 6.5.0 2023-5-03

### Added

- Utility functions `uleb128Decode` and `uleb128Encode` functions for decoding and encoding as unsigned leb128 respectively.
- `CIS2Contract` class for interacting with smart contracts adhering to the CIS-2 standard.
- `cis0Supports` function for checking standard support in smart contracts.
- Made the `streamToList` function public.
- Made the `unwrap` function public.
- Added `wasmToSchema` utility function.
- Added `getEmbeddedSchema` to client.
- Exposed `RpcError` type and created helper `isRpcError`.
- Build function `buildAccountSigner` for creating `AccountSigner` objects from genesis format, wallet export format, and a simple representation of credentials with keys.

### Changed

- Fixed bug where `AccountCreationSummary` type did not have fields: `index`, `energyCost`, `hash`

## 6.4.2 2023-04-21

### Changed

- `generateBakerKeys` now also returns the private baker keys.

## 6.4.1 2023-03-31

### Changed

- Replace use of `setImmediate` with `setTimeout` since the former is not
    supported in browsers.

## 6.4.0 2023-03-22

### Added

- General function for deserializing smart contract values `deserializeTypeValue`.

### Changed

- Bumped @concordium/rust-bindings to 0.11.0. (Includes a fix to serialization of negative numbers for smart contract values)
- `signMessage` and `verifyMessageSignature` can now handle the message being a buffer/Uint8Array instead of only a utf8 string.

### Fixed

- `serializeTypeValue` now reports an error when called with invalid data, such as a receive function with missing schema, or a schema that cannot be parsed.

## 6.3.0 2023-02-27

### Added

- Added a client for version 2 of the Concordium gRPC API to communicate with a Concordium node.

  - including helper function `waitForTransactionFinalization` that returns a promise that resolves when the transaction finalizes.

- Serialization:

  - `serializeAccountTransactionPayload`
  - `serializeCredentialDeploymentPayload`

- Credential deployment helpers:

  - `createCredentialTransaction`
  - `createCredentialTransactionNoSeed`
  - `signCredentialTransaction`

- Function to generate baker keys: `generateBakerKeys`.

### Fixed

- `getInitContractParameterSchema`, `getUpdateContractParameterSchema`,
    `serializeInitContractParameters` and `serializeUpdateContractParameters` now
    report an error when called with invalid data, such as a receive function with
    missing schema, or a schema that cannot be parsed.

### Deprecated

- The JSON-RPC client has been deprecated in favor of the new gRPC v2 client.
- Various types and helper functions used by the JSON-RPC client (and the v1 gRPC client) have also been deprecated.

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

- Fixed JSON-RPC client crash on empty response when calling getInstanceInfo.
    (And update the format of the arguments for the server)
- Fixed issue by bumping rust bindings version

## 1.0.0 2022-5-25

- Initial release