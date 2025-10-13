# Changelog

## Unreleased

## 11.0.0

### Fixed

- Fix decoding of `TokenAmount`s with 256 decimals.
- Decoding of `TokenAmount`s with 0 decimals will give `0` decimals instead of `-0` decimals.
- Decoding a `TokenHolderAccount` distinguishes whether the account includes coin info.

### Added

- `fromAccountAddressNoCoinInfo` to `TokenHolderAccount`.
- `coinInfo` is a public field of `TokenHolderAccount`.
- `Upward<T>` as a means of representing possibly unknown variants of a type encounted when querying the GRPC API
  of *future* Concordium node versions. This is a type alias of `T | null`, i.e. unknown variants will be represented
  as `null`.
- `decodeTokenOperation`, which decodes `Cbor.Type` to `TokenOperation | UnknownTokenOperation`.
- `parseTokenUpdatePayload`, which decodes the CBOR encoded operations and returns a corresponding payload with the
  operations decoded into `(TokenOperation | UnknownTokenOperation)[]`
- `parseTokenModuleRejectReason`, which decodes `Cbor.Type` into `TokenModuleRejectReason | UnknownTokenModuleRejectReason`.
- `CborContractAddress` which represents CIS-7 compatible contract addresses.

### Breaking changes

- Renamed `TokenModuleRejectReason` to `EncodedTokenModuleRejectReason`, aligning with the corresponding types for
  `TokenModuleEvent`. `TokenModuleRejectReason` now describes the decoded version of `EncodedTokenModuleRejectReason`.
- `parseTokenModuleEvent` (previously `parseModuleEvent`) now returns `TokenModuleEvent | UnknownTokenModuleEvent`
- Rename `CredentialDeploymentTransaction` to `CredentialDeploymentPayload`, and correspondingly
  - `createCredentialDeploymentTransaction` -> `createCredentialDeploymentPayload`
  - `createCredentialTransaction` -> `createCredentialPayload`
  - `createCredentialTransactionNoSeed` -> `createCredentialPayloadNoSeed`
- `CborAccountAddress` is now used instead of `TokenHolder` for CBOR encoded account addresses in PLT/CIS-7.
- `Token` functions now take `AccountAddress` anywhere `TokenHolder` was previously used.

#### GRPC API query response types

- `BlockItemSummaryInBlock.summary` now has the type `Upward<BlockItemSummary>`.
- `ConfigureBakerSummary`, `ConfigureDelegationSummary`, `TokenCreationSummary`, and `TokenUpdateSummary` events
  have been wrapped in `Upward`.
- `UpdateSummary.payload` now has the type `Upward<UpdateInstructionPayload>`.
- `UpdateEnqueuedEvent.payload` now has the type `Upward<UpdateInstructionPayload>`.
- `PendingUpdate.effect` now has the type `Upward<PendingUpateEffect>`.
- `PassiveCommitteeInfo` now has been wrapped in `Upward`.
- `NodeInfoConsensusStatus` and `NodeCatchupStatus` now have been wrapped in `Upward`.
- `RejectReason` now has been wrapped in `Upward`
- `RewardStatus` now has been wrapped in `Upward`
- `Cooldown.status` now has the type `Upward<CooldownStatus>`. This affects all `AccountInfo` variants.
- `BakerPoolInfo.openStatus` now has the type `Upward<OpenStatusText>`.
  - Affects the `AccountInfoBaker` variant of `AccountInfo`.
  - Affects `BakerPoolStatus`.
- `BakerSetOpenStatusEvent.openStatus` now has the type `Upward<OpenStatusText>`.
- `AccountInfo` has been extended with a new variant `AccountInfoUnknown`.
- `ContractTraceEvent` uses in reponse types from the GRPC API have now been wrapped in `Upward`.
  - Affects `InvokeContractResultSuccess`
  - Affects `UpdateContractSummary`
- `ContractVersion` enum has been removed and replaced with `number` where it was used.
- `VerifyKey` uses has now been wrapped in `Upward`, affecting the types
  - `CredentialPublicKeys`, bleeding into top-level types `CredentialDeploymentInfo`, `InitialAccountCredential` and
    `NormalAccountCredential`

#### `ConcordiumGRPCClient`:

- `waitForTransactionFinalization` is affected by the changes to `BlockItemSummaryInBlock`
- `getBlockTransactionEvents` now returns `AsyncIterable<Upward<BlockItemSummary>>`.
- `getBlockSpecialEvents` now returns `AsyncIterable<Upward<BlockSpecialEvent>>`.
- `getPoolInfo` is affected by the changes to `BakerPoolInfo`

## 10.0.2

### Fixed

- Add PLT functionality to UMD releases.

## 10.0.1

### Fixed

- Added missing support for the new transaction summary type `TokenCreation`. This has been added to the
  `BlockItemSummary` union type.

## 10.0.0

- Adds support for integrating with Concordium nodes running version 9.

### Breaking changes

- Add `TokenUpdateSummary` to the possible transaction outcomes declared by `AccountTransactionSummary`
- Added new variant `TokenUpdate` to  `AccountTransactionType` and correspondingly `TransactionKindString`.
- Added `EncodedTokenModuleEvent`, `TokenTransfer`, `TokenMint`, `TokenBurn` types to `TransactionEvent` union.
- Added new variants `TokenModuleEvent`, `TokenTransfer`, `TokenMint`, `TokenBurn` to `TransactionEventTag`.
- Added new variant `CreatePLT` to `UpdateType`.
- Updated `AccountInfo` to hold information about the PLTs held by an account.
- Removed `toProto` and `fromProto` from the exposed API for all custom types in the SDK. This should have no impact, as
  the parameter/return values are internal-only.
- Added `TokenUpdatePayload` to `AccountTransactionPayload` union type.
- Added reject reasons related to PLT transactions to `RejectReason` union type.
- `CcdAmount.fromDecimal` no longer supports creation from a string with comma used as the decimal separator, e.g.
  "10,123".

### Added

- A new package export scoped to hold types and functionality for interacting with PLTs, available at
  `@concordium/web-sdk/plt`.
- New types representing entities within the domain of protocol level tokens (PLTs)
  - `Cbor`: Represents CBOR encoded details for PLT module state, events, and operations
  - `CborMemo`: Represents CBOR encoded memos for PLT transactions
  - `TokenId`: A unique text identifier of a PLT
  - `TokenAmount`: A representation of a PLT amount
  - `TokenModuleReference`: The module reference of a PLT instance
  - `TokenMetadataUrl`: An object containing the url for token metadata
  - `TokenHolder`: A representation of the different token holder entities. Currently, only accounts are supported.
  - `TokenAccountState`, `TokenState`, `TokenInfo`, and `TokenAccountInfo`, all representing PLT related data returned by the
    GRPC API of a Concordium node. 
- `Token`, which is a client for interacting with PLTs
- `parseModuleEvent`, which attempts to parse an `EncodedTokenModuleEvent` into a `TokenModuleEvent`.
- CBOR conversion functionality to `AccountAddress`.
- An extension for `cbor2`, which registers CBOR encoders for all relevant Concordium types. This is accessible at the
  `@concordium/web-sdk/extensions/cbor2` entrypoint.
- `cborEncode` and `cborDecode` functions for deterministic encoding/decoding of objects composed of Concordium domain
  types.
- `registerCborDecoders` and `registerCborEncoders` for registering Concordium domain type encoders/decoders globally
  for `cbor2`
  - **NOTE**: By registering decoders globally without using the returned cleanup function, the registration overrides
  any previously registered decoder for the corresponding CBOR tag.
- `TokenUpdateHandler`, which is also accessible by passing the corresponding `TransactionType` to `getAccountTransactionHandler`.
- Function `parseSimpleWallet` which parses a `SimpleWalletFormat` (also a subset of `GenesisFormat`), which can be used
  with `buildAccountSigner`
- A new optional field `createPlt` to `AuthorizationsV1` which exposes the access structure for PLT creation.

## 10.0.0-alpha.? (Unreleased)

### Fixed

- Fix conversion in `TokenAmount.fromDecimals` function when used with large `tokenAmount` values with small `decimal` values.

## 10.0.0-alpha.15

### Fixed

- Fix conversion in `TokenAmount.fromDecimals` function when used with large `decimal` values.

### Changed

- Remove authorization validation for PLT `Token` client.
- All `Token` operations' validations are done in a separate respective functions.
- Removed `UnauthorizedGovernanceOperationError` from `Token` PLT client.

### Added

- Add helper function `validateMint`, `validateBurn`, `validateAllowListUpdate`, `validateDenyListUpdate`
  for validating PLT token client operations.
- Add `updateToken` method that returns the latest finilized block state of a token.

## 10.0.0-alpha.14

### Changed

- Enable `denyList`/`allowList` validation on plt token transfers.
- Client side validation in the PLT `Token` client is now disabled by default and has to be enabled explicitly if wanted

### Added

- Add optional `initialSupply` field to `TokenInitializationParameters` type.
- Add `protocolLevelTokens` field to `NextUpdateSequenceNumbers` type.
- Add helper function `createPLTPayload` for creating `CreatePLTPayload`s for the corresponding chain update.

## 10.0.0-alpha.13

### Changed

- Disable `denyList`/`allowList` validation on plt token transfers.

## 10.0.0-alpha.12

### Breaking changes

- Changed the representation of `TokenEvent` to a more flattened version in line with the representation in concordium-base.
- Replaced `TokenUpdateEvent` with the flattened `TokenEvent` mentioned above.
- Revised the constraints associated with `TokenId`.

### Added

- `pause` and `unpause` functions added to the `Token` module, which can be used to pause/unpause execution of token operations respectively.
- `moduleState` added to `Token` instances, which is the parsed token module state of a PLT instance.

### Changed

- Energy cost of PLT mint/burn changed from 100 to 50
- Changed the functions exposed for submitting token updates on `Token` to take optional `TokenUpdateMetadata` instead of 
  getting the corresponding data from chain.

## 10.0.0-alpha.11

### Fixed

- An issue where the token module state of a PLT could not be correctly decoded from it's CBOR representation.

## 10.0.0-alpha.10

### Fixed

- Fixed a bug where PLT transfer validation would fail when the reciever had no balance if the token had a deny list.

## 10.0.0-alpha.9

### Breaking changes

- Consolidate `TokenHolderPayload` and `TokenGovernancePayload` into `TokenUpdatePayload`, and correspondingly on the
  enums `AccountTransactionType` and `TransactionKindString`.
- Consolidate `TokenHolderUpdateHandler` and `TokenGovernanceUpdateHandler` into `TokenUpdateHandler`.
- Consolidate `TokenHolderSummary` and `TokenGovernanceSummary` into `TokenUpdateSummary`, and correspondingly on the `TransactionEvent` enum.
- Consolidate `TokenHolderTransactionFailedRejectReason` and `TokenGovernanceTransactionFailedRejectReason`
  into `TokenUpdateTransactionFailedRejectReason`, and correspondingly on the `RejectReasonTag` enum.
- Functionality exposed on `V1.Token` and `V1.Governance` is now available on `Token`, which is a client for interacting with PLTs.
  Any functionality previously exposed on the `V1` namespace, has been moved to the root of `@concordium/web-sdk/plt`.
- Removed `UnauthorizedTokenGovernance` type and the corresponding `RejectReasonTag.UnauthorizedTokenGovernance`. This will now happen
  as a `EncodedTokenModuleEvent` instead.
- Changed the representation of accounts on any PLT related type from `AccountAddress` to `TokenHolder`.

### Added

- `TokenHolder`: A representation of the different token holder entities. Currently, only accounts are supported.

## 10.0.0-alpha.8

### Breaking changes

- Add `TokenHolderSummary` and `TokenGovernanceSummary` to the possible transaction outcomes declared by
- `AccountTransactionSummary`, and correspondingly `TokenHolderEvent` and `TokenGovernanceEvent` to `TransactionEvent`.
- Added new variants `TokenHolder` and `TokenGovernance` to `TransactionEventTag`, `AccountTransactionType` and correspondingly `TransactionKindString`.
- Added new variant `CreatePLT` to `UpdateType`.
- Updated `AccountInfo` to hold information about the PLTs held by an account.
- Removed `toProto` and `fromProto` from the exposed API for all custom types in the SDK. This should have no impact, as
  the parameter/return values are internal-only.
- Added `TokenHolderPayload` and `TokenGovernancePayload` to `AccountTransactionPayload` union type.
- Added reject reasons related to PLT transactions to `RejectReason` union type.
- `CcdAmount.fromDecimal` no longer supports creation from a string with comma used as the decimal separator, e.g.
  "10,123".

### Added

- A new package export scoped to hold types and functionality for interacting with PLTs, available at
  `@concordium/web-sdk/plt`.
- New types representing entities within the domain of protocol level tokens (PLTs)
  - `Cbor`: Represents CBOR encoded details for PLT module state, events, and operations
  - `CborMemo`: Represents CBOR encoded memos for PLT transactions
  - `TokenId`: A unique text identifier of a PLT
  - `TokenAmount`: A representation of a PLT amount
  - `TokenModuleReference`: The module reference of a PLT instance
  - `TokenMetadataUrl`: An object containing the url for token metadata
  - `TokenHolder`: A representation of the different token holder entities. Currently, only accounts are supported.
  - `TokenAccountState`, `TokenState`, `TokenInfo`, and `TokenAccountInfo`, all representing PLT related data returned by the
    GRPC API of a Concordium node. 
- `Token`, which is a client for interacting with PLTs
- `parseModuleEvent`, which attempts to parse an `EncodedTokenModuleEvent` into a `TokenModuleEvent`.
- CBOR conversion functionality to `AccountAddress`.
- An extension for `cbor2`, which registers CBOR encoders for all relevant Concordium types. This is accessible at the
  `@concordium/web-sdk/extensions/cbor2` entrypoint.
- `cborEncode` and `cborDecode` functions for deterministic encoding/decoding of objects composed of Concordium domain
  types.
- `registerCborDecoders` and `registerCborEncoders` for registering Concordium domain type encoders/decoders globally
  for `cbor2`
  - **NOTE**: By registering decoders globally without using the returned cleanup function, the registration overrides
  any previously registered decoder for the corresponding CBOR tag.
- `TokenUpdateHandler`, which is also accessible by passing the corresponding `TransactionType` to `getAccountTransactionHandler`.
- Function `parseSimpleWallet` which parses a `SimpleWalletFormat` (also a subset of `GenesisFormat`), which can be used
  with `buildAccountSigner`
- A new optional field `createPlt` to `AuthorizationsV1` which exposes the access structure for PLT creation.

## 9.2.0

### Fixed

- Fixed an issue an internal dependency not being handled correctly in the UMD build.

### Added

- Method (`getContractUpdateEnergyCost`) for estimating energy usage of contract update.

## 9.1.1

### Changes

- Update transitive dependency `base-x` for the compiled library distribution

## 9.1.0

### Added

- The "wasm" entrypoint `@concordium/web-sdk/wasm` from now supports react-native. This means that the partial support for react-native is now extended to full support.

## 9.0.0

### Breaking changes

- Protocol version 8:
  - Add `isSuspended` field to `AccountBakerDetails` and `BakerPoolStatusDetails`.
  - Add `BakerSuspendedEvent` and `BakerResumedEvent` to `BakerEvent` union type.
  - Add `BlockSpecialEventValidatorSuspended` and `BlockSpecialEventValidatorPrimedForSuspension` to `BlockSpecialEvent` union type.
  - Add `PendingValidatorScoreUpdate` to `UpdateInstructionPayload` union type.
  - Add `ChainParametersV3` to `ChainParameters` union type.
  - Add `isPrimedForSuspension` and `missedRounds` fields to `CurrentPaydayBakerPoolStatus`.
  - Add suspended field to the `ConfigureBakerPayload`.
  - Add `validatorScoreParameters` to `NextUpdateSequenceNumbers`.

## 8.1.1

### Fixed

- `getEnergyCost` returning energy amounts that were off by one due to not including the transaction type in the
  transaction payload serialization.

## 8.1.0

### Added

- Add `legalCountry` as an allowed attribute for set/not-set membership proofs.
- Add attributes `lei`, `legalName`, `legalCountry`, `businessNumber`, and `registrationAuth` to `IDENTITY_SUBJECT_SCHEMA`.

## 8.0.1

### Breaking changes

- `getEmbeddedModuleSchema` now uses the module version to determine in which custom wasm sections to look for the schema.
- `ConcordiumGRPCClient.getEmbeddedSchema` now delegates to `getEmbeddedModuleSchema` instead of `wasmToSchema`
  (which was removed as it was just a less capable version of `getEmbeddedModuleSchema`).
  This means that it returns the complete `RawModuleSchema` instead of only the schema bytes.
  It also means that it returns `null` instead of an error when no embedded schema was found.
- Update `AccountInfo` and `BakerPoolStatus` according to the changes introduced in the GRPC types introduced with node version 7

## 7.5.1

### Fixed

- Update `@concordium/rust-bindings` to `3.2.1` which fixes an issue causing runtime error `unreachable` for the internal WebAssembly module.
- Update JSON serialization of `AccountTransactionPayload` through `AccountTransactionPayloadHandler` to correctly serialize `CcdAmount` as `string`

## 7.5.0

### Added

- Bumped @concordium/rust-bindings to 3.2.0: Support company related attributes: `lei`, `legalName`, `legalCountry`, `businessNumber` and `registrationAuth`, allow for company account creation using the SDK.

## 7.4.0

### Added

- `toString`, `toJSON`, and `fromJSON` to most concordium domain types.
- Deprecated types and functions related to typed JSON serialization and deserialization.
- Various types related to CIS-2, CIS-3, and CIS-4 events and errors in the `CIS2`, `CIS3`, and `CIS4` namespaces.
- `deserializeCIS2Event`, `deserializeCIS3Event`, and `deserializeCIS4Event` for deserializing a CIS event from a `ContractEvent`.
- `deserializeCIS2Events` and `deserializeCIS2EventsFromSummary` for deserializing all CIS-2 events from `InvokeContractSuccessResult`s and `BlockItemSummary`s, respectively, as well as similar functions for CIS-3 and CIS-4 events.
- `parseCIS2RejectionError` for parsing a CIS-2 rejection error from a `InvokeContractFailureResult`.
- `CIS3Contract` class for interacting with contracts adhering to the CIS-3 standard.
- `Parameter.parseWithSchemaTypeBase64` and `Parameter.parseWithSchemaType` to
  help parsing smart contract parameters into typed structures.
- Documentation on when`TransactionExpiry.toJSON` throws an error.
- `Timestamp.futureMinutes` for creating a `Timestamp` a number of minutes in the future.
- `verifyPresentation` function to `@concordium/web-sdk/wasm`, which can be used to verify the credential proofs in the presentation object.
- `getPublicData` function to `@concordium/web-sdk/web3-id`, which is a helper function for accessing the public data of a `VerifiablePresentation` from chain.
- `verifyCredentialMetadata` function to `@concordium/web-sdk/web3-id`, which is a helper function for fetching and verifying metadata associated with a credential proof.

### Fixed

- Serialization of nonces with `serializeCIS4RevocationDataHolder` to serialize as little endian.

## 7.3.2

### Added

- Export all types from `accountTransaction.ts`.

## 7.3.1

### Fixed

- Return type of `getAccountTransactionHandler`.

## 7.3.0

### Added

- `fromJSON` and `toJSON` methods to the `AccountTransactionHandler` interface,
  and implementations for all transaction handlers.

## 7.2.0

### Added

- `ContractAddress.toString` function that converts the address to a string in
  the `<index, subindex>` format.
- Method (`createIdRequestWithKeysV1`) for creating an identity request by supplying the secret key material instead of the seed.
- Method (`createIdentityRecoveryRequestWithKeys`) for creating an identity recovery request by supplying the secret key material instead of the seed.

### Fixed

- Error messages in `GenericContract` now display the data, e.g., the contract
  address, rather than `[object Object]`.
- Incorrect check in isRewardStatusV1.

## 7.1.0

### Added

- `jsonUnwrapStringify` function, which can be used to unwrap concordium domain types to their inner values before serializing, to ease compatibility with dependants deserializing stringified JSON.


## 7.0.3

### Fixed

- An issue with the serialization of init contract account transactions.

## 7.0.2

### Fixed

- Missing files (react native build) in published version.

## 7.0.1

### Added

- Support for using the SDK in a react native environment. Requires polyfilling functionality used within the SDK.
  Please refer to the guide found at [the react native compatibility guide](https://docs.concordium.com/concordium-node-sdk-js/latest/pages/misc-pages/react-native.html)

### Fixed

- Export type `BlockItem` in the public API again, this was removed accidentally in v7.0.0.

## 7.0.0

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
- Use `ContractEvent` instead of a string with hex encoding. Can be constructed using `ContractEvent.fromHexString('<hex>')`.
- Use `CcdAmount` instead of a bigint. Can be constructed using `CcdAmount.fromMicroCcd(<integer>)`.
- Use `TransactionExpiry` instead of a Date object. Can be constructed using `TransactionExpiry.fromDate(<date>)`.
- Use `ModuleReference` instead of a string with hex encoding. Can be constructed using `ModuleReference.fromHexString('<hex-string>')`.

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
- `CcdAmount` is now a module with functions related to amounts of CCDs:
  - To refer to `CcdAmount` as a type use `CcdAmount.Type`.
  - Constructing `new CcdAmount(<integer>)` is now `CcdAmount.fromMicroCcd(<integer>)`.
  - The methods `toMicroCcd` and `toCcd` are now functions refered to as `CcdAmount.toMicroCcd` and `CcdAmount.toCcd` respectively.
- `TransactionExpiry` is now a module with functions related to amounts of expiry time of transactions:
  - To refer to `TransactionExpiry` as a type use `TransactionExpiry.Type`.
  - Constructing `new TransactionExpiry(<expiry>, <allowExpired>)` is now `TransactionExpiry.fromDate(<expiry>)`, and the check of being a time in the future is removed and done when sending the transaction instead.
- `ModuleReference` is now a module with functions related to references to smart contract modules:
  - To refer to `ModuleReference` as a type use `ModuleReference.Type`.
  - Constructing `new ModuleReference("<hex-string>")` is now `ModuleReference.fromHexString("<hex-string>")`.
  - The static method `ModuleReference.fromBytes` is now `ModuleReference.fromBuffer`.
- Removed `JsonRpcClient` and types and functionality associated solely with this class.
- Renamed `AccountSequenceNumber` module to `SequenceNumber`.
- Fix type for `TranferredEvent` from `ContractTraceEvent` to only be from contract addresses to account addresses.
- Added `effectiveTime` field to `PendingUpdate`.

### Added

- All JSON serialization in `serialization.ts` is now handled by `json-bigint` meaning that all functions now correctly handles bigint inputs
- `Timestamp` is now a module with functions related to time.
  - To refer to `Timestamp` as a type use `Timestamp.Type`.
- `Duration` is now a module with functions related to durations of time.
- `EntrypointName` is now a module with functions related to entrypoint names of a smart contract.
- `ReceiveName` is now a module with functions related to receive-function names of a smart contract.
- `ReturnValue` is now a module with functions related to return values from invoking a smart contract.
- Functions `jsonStringify` and `jsonParse`, which acts as a regular `JSON.stringify` and `JSON.parse` correspondingly,
  with the addition of stringifying concordium domain types in a wrapper object that can be parsed into the respective types.
- Introduce function `versionedModuleSourceToBuffer` for serializing a versioned module to a buffer, which can be stored in a file.

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

## 6.5.1

### Fixed

- An issue where `BakerRewardPeriodInfo` incorrectly mapped `delegatedCapital` field

## 6.5.0

### Added

New consensus endpoints:

- `getBakerEarliestWinTime`
- `getBlockCertificates`
- `getBakersRewardPeriod`
- `getWinningBakersEpoch`
- `getFirstBlockEpoch`
- `commissionRates` is now added to the `getPoolInfo` under `bakerPoolStatus.PoolInfo`

## 6.4.0

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

## 6.3.0

### Added

- `sendRawAccountTransaction` to the gRPC Client.

### Changed

- Stopped using `replaceDateWithTimeStampAttribute` and `reviveDateFromTimeStampAttribute` for serializing and parsing verifiable presentation.
- AttributeType no longer contains `Date`, but now instead has `TimestampAttribute`. The statement builders have their types extended to keep allowing for both `Date` and `TimestampAttribute`.

## 6.2.1

### Fixed

- Missing buffer import causing issues in web.

## 6.2.0

### Breaking changes

- `sendCredentialDeploymentTransaction` method of `ConcordiumGRPCClient` signature changed to take an already serialized payload.

### Added

- `CIS4Contract` class for seemlessly interacting with contracts adhering to the CIS4 standard.
- Validation of type values when verifying statements.
- Exposed `replaceDateWithTimeStampAttribute` and `reviveDateFromTimeStampAttribute`.

### Fixed

- Aligned credential schema types with the tested types in the browser wallet.
- `addMinimumAge` now creates the precise age statement instead of one day off.

## 6.1.1

### Fixes

- `verifyWeb3IdCredentialSignature` now supports dates/timestamp attributes.
- `canProveAtomicStatement` now supports timestamp attributes, handles undefined attribute value correctly and handles strings correctly for range statements.

## 6.1.0

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

## 6.0.0

### Breaking changes

- Renamed `AccountTransactionType.TransferWithScheduleWithMemo` to `AccountTransactionType.TransferWithScheduleAndMemo`.

### Changed

- Bumped @concordium/rust-bindings to 1.1.0 (adds `display_type_schema_template` function)

### Added

- `getTransactionKindString` function.
- `displayTypeSchemaTemplate` function.

## 5.0.0

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

## 4.0.1 2023-05-25

### Fixed

- Cost calculation for `deployModule` transaction.

## 4.0.0 2023-05-15

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

## 3.5.0 2023-5-03

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

## 3.4.2 2023-04-21

### Changed

- `generateBakerKeys` now also returns the private baker keys.

## 3.4.1 2023-03-31

### Changed

- Replace use of `setImmediate` with `setTimeout` since the former is not
    supported in browsers.

## 3.4.0 2023-03-22

### Added

- General function for deserializing smart contract values `deserializeTypeValue`.

### Changed

- Bumped @concordium/rust-bindings to 0.11.0. (Includes a fix to serialization of negative numbers for smart contract values)
- `signMessage` and `verifyMessageSignature` can now handle the message being a buffer/Uint8Array instead of only a utf8 string.

### Fixed

- `serializeTypeValue` now reports an error when called with invalid data, such as a receive function with missing schema, or a schema that cannot be parsed.

## 3.3.0 2023-02-27

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

## 3.2.0 2023-01-04

### Added

- `serializeTypeValue` that allows smart contract types to be serialized using the specific schema, instead of only by providing the entire module's schema.
- `getInitContractParameterSchema` Given a buffer containing the schema for a module, extract the schema for a given contract's init function's parameters.
- `getReceiveContractParameterSchema` Given a buffer containing the schema for a module, extract the schema for a given contract's receive methods' parameters.

## 3.1.0 2022-11-30

### Added

- `IdStatementBuilder` class to help build id statements.
- `verifyIdStatement` function to verify that a statement is well-formed and complies with rules for id statements.
- `getIdProof` function to prove a statement holds for the given identity/account.
- Enums for sex and idDocType values.

## 3.0.0 2022-11-15

### Breaking changes

- Change AccountTransactionType names/string values to align with those in Concordium base.
- Change some field names in UpdateConcractPayload, InitContractPayload and DeployModule to align with those in Concordium base.
- Rename GtuAmount class to CcdAmount. And change the microGtuAmount field to microCcdAmount.
- Add custom toJSON methods for the classes CcdAmount, AccountAddress, ModuleReference, CredentialRegistrationId, DataBlob and TransactionExpiry, in order to match the serialisation of their equivalents in Concordium base.

### Added

- The ability to deserialize error values of receive and init functions using `deserializeReceiveError()` and `deserializeInitError()` respectfully.
- Refactored the `upserializeUpdateContractParameters()` and `serializeInitContractParameters()` to call into rust functions.

## 2.2.0 2022-11-8

### Added

- The ability to deserialize the return values of receive functions using `deserializeReceiveReturnValue()`.

## 2.1.0 2022-9-29

### Added

- Additional arguments to the JSON-RPC HttpProvider, to enable is to receive and forward cookies.

### Fixed

- getAccountInfo no longer relies on instanceof to determine the type of input.

## 2.0.0 2022-9-29

### Added

- `getCredentialId` to the HdWallet.

### Breaking changes

- Updated the signature of helper functions for accounts to sign messages. (and changed the prepend)

## 1.0.0 2022-8-26

### Breaking changes

- ConcordiumHdWallet methods now take the identity provider index as arguments.
- Bumped @concordium/rust-bindings to 0.4.0.

### Fixed

- Added missing `accountAddress` field to `AccountInfo` types.

## 0.5.0 2022-8-26

### Added

- Support for new V2 schemas which can specify error types.

### Breaking changes

- SchemaVersion, Module, and schema types are now 0-indexed instead of 1-indexed. This means that the schemas used for V0 contracts are now version 0, and so is the associated types. And the first schema version for V1 contracts are now version 1.

## 0.4.0 2022-8-15

### Added

- `deserializeTransaction` function to deserialize transaction created by `serializeAccountTransactionForSubmission` and `serializeCredentialDeploymentTransactionForSubmission`. (Currently SimpleTransfer, SimpleTransferWithMemo and RegisterData are the only supported account transactions kinds)
- `createIdentityRequest`, to create identity requests.
- `createCredentialV1`, to create credentials using a seedPhrase.
- `createIdentityRecoveryRequest`, to create identity recovery requests.
- Added `sendCredentialDeployment` to send credentials created from `createCredentialV1` to the chain.
- `getSignedCredentialDeploymentTransactionHash` to get the transaction hash of credentials created from `createCredentialV1`.
- Added `ConfigureBaker` to `AccountTransactionType` enum.
- Added `ConcordiumHdWallet` with functions to get keys and randomness from a seed phrase.

### Fixed

- `deserializeTransaction` no longer throws an error on expired transactions.
- `deserializeTransaction` is now exported from index.

## 0.3.0 2022-7-21

### Added

- Support deserializing new schema types: ULeb128, ILeb128, ByteArray and ByteList.
- Support deserializing schemas with versioning information.
- Add support for getAccountInfo, InvokeContract, getCryptographicParameters and getModuleSource with JSON-RPC

### Fixed

- Fixed contract schema serialization for ByteList

### Changes

- The function for deserializing a module schema `deserialModuleFromBuffer` now have the schema version as an optional argument. The function will try to extract the version from the buffer. When a version is provided it falls back to this, otherwise it throws an error.

## 0.2.1 2022-6-27

### Fixed

- @noble/ed25519 and cross-fetch moved from devDependencies to dependencies.

## 0.2.0 2022-6-24

### Added

- Support deserializing version 2 schemas.
- Support serializing parameters for contracts using version 2 schemas.
- Support for deploying versioned smart contract modules, which is the format used in cargo-concordium v2+. (This is done by not supplying the version field in the payload)

### Breaking changes

- `serializeInitContractParameters` and `serializeUpdateContractParameters` each have an additional parameter, which denotes the version of the schema provided. For existing users that are using V0 contracts, that parameter should be `SchemaVersion.V1`.
- Deserialization of schemas have been changed: types and functions have been renamed and `deserialModuleFromBuffer` have an additional parameter.

## 0.1.1 2022-6-2

### Fixed

- Fixed JSON-RPC client crash on empty response when calling getInstanceInfo.
    (And update the format of the arguments for the server)
- Fixed issue by bumping rust bindings version

## 0.1.0 2022-5-25

- Initial release
