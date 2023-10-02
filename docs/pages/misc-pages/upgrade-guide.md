## SDK version 10

Several types have been replaced with a module containing the type itself together with functions for constructing and
converting the type:

- `AccountAddress` is now a module with functions related to account addresses:
  - To refer to `AccountAddress` as a type use `AccountAddress.Type`.
  - Constructing `new AccountAddress("<address>")` is now `AccountAddress.fromBase58("<address>")`.
  - `isAlias` and `getAlias` are now accessable from `AccountAddress.isAlias` and `AccountAddress.getAlias`.
- `ContractAddresss` is now a module with functions related to contract addresses:
  - To refer to `ContractAddress` as a type use `ContractAddress.Type`.
  - To construct the type use `ContractAddress.create(index, subindex)`.
- `CredentialRegistrationId` is now a module with functions related to credential registration IDs:
  - To refer to `CredentialRegistrationId` as a type use `CredentialRegistrationId.Type`.
  - Constructing `new CredentialRegistrationId("<hex-string>")` is now
    `CredentialRegistrationId.fromHexString("<hex-string>")`.
- `Duration` is now a module with functions related to durations of time.
  - To refer to `Duration` as a type use `Duration.Type`.
- `Timestamp` is now a module with functions related to timestamps.
  - To refer to `Timestamp` as a type use `Timestamp.Type`.

The API now uses dedicated types instead of language primitives:

- Uses `AccountAddress` instead of a string with base58 encoding.
  Can be constructed using `AccountAddress.fromBase58('<base58>')`.
- Uses `BlockHash` instead of a string with hex encoding.
  Can be constructed using `BlockHash.fromHexString('<hex>')`.
- Uses `TranactionHash` instead of a string with hex encoding.
  Can be constructed using `TransactionHash.fromHexString('<hex>')`.
- Uses `Energy` instead of a bigint.
  Can be constructed using `Energy.create(<integer>)`.
- Uses `ReceiveName` instead of a string.
  Can be constructed using `ReceiveName.fromString('<contract>.<function>')`.
- Uses `InitName` instead of a string.
  Can be constructed using `Init.fromString('init_<contract>')`.
- Uses `ContractName` instead of a string.
  Can be constructed using `ContractName.fromString('<contract>')`.
- Uses `EntrypointName` instead of a string.
  Can be constructed using `EntrypointName.fromString('<function>')`.
- Uses `Parameter` instead of a string with hex encoding.
  Can be constructed using `Parameter.fromHexString('<hex>')`.
- Uses `SequenceNumber` (formerly called nonce) instead of a bigint.
  Can be constructed using  `SequenceNumber.create(<integer>)`.
- Uses `Timestamp` instead of a bigint.
  Can be constructed using `Timestamp.fromMillis(<integer>)`.
- Uses `Duration` instead of a bigint.
  Can be constructed using `Duration.fromMillis(<integer>)`.

The `@concordium/web-sdk` now requires bundlers to respect `exports` field of
`package.json` of a module. This is due to relying on entrypoints declared in
the `exports` field of `@concordium/rust-bindings` to make it possible to select
only parts of the SDK to include in your application.
Furthermore, the SDK is now published as an ES module, making it possible to
eliminate dead code.

For **TypeScript** users, at least typescript version 5 is required along with
the setting `compilerOptions.moduleResultion` to `"bundler"` to match the
resolution strategy of modern bundlers.

The following entrypoints are made available for consumers of
`@concordium/web-sdk`:

- `@concordium/web-sdk` exposes the full API of the SDK.
This can safely be used by projects built with ES modules.
- `@concordium/web-sdk/cis0` entrypoint exposes functionality for working with
contracts adhering to the
[CIS-0](https://proposals.concordium.software/CIS/cis-0.html) standard.
- `@concordium/web-sdk/cis2` entrypoint exposes functionality for working with
contracts adhering to the
[CIS-2](https://proposals.concordium.software/CIS/cis-2.html) standard.
- `@concordium/web-sdk/cis4` entrypoint exposes functionality for working with
contracts adhering to the
[CIS-4](https://proposals.concordium.software/CIS/cis-4.html) standard.
- `@concordium/web-sdk/grpc` entrypoint exposes the grpc client for interacting
with a nodes GRPCv2 interface.
- `@concordium/web-sdk/id` entrypoint exposes functionality for working with
ID proofs.
- `@concordium/web-sdk/json-rpc` entrypoint exposes the **(deprecated)**
json-rpc client for interacting with a nodes GPRCv1 interface.
- `@concordium/web-sdk/schema` entrypoint exposes functionality for working
with smart contract schemas, i.e.(de)serializing types using a smart
contract schema.
  - This uses the wasm entrypoint at `@concordium/rust-bindings/dapp`.
- `@concordium/web-sdk/types` entrypoint exposes functionality for working
with concordium domain types.
- `@concordium/web-sdk/wasm` entrypoint exposes a variety of functionality for
working with concordium domain types, which requires WASM.
  - This uses the wasm entrypoint at `@concorodium/rust-bindings/wallet`.
- `@concordium/web-sdk/web3-id` entrypoint exposes functionality for working
with web3-id proofs.

### NodeJS

The `@concordium/web-sdk` module is not compatible with
node versions <16 and is published only as an ES module.
This, in turn, requires users to also run applications as ES modules.

The easiest way to run your node application as an ES module, is by setting
the `type` field of `package.json` to be set to `"module"`:

```json
{
    ...
    "type": "module",
    ...
}
```

Alternatively, files names with the extension `mjs` (or `mts` for TypeScript)
are always handled as ES modules.

For **TypeScript** users, at least typescript version 4.7 is required along
with the setting `compilerOptions.moduleResultion` to `"node16"` or
`"nodenext"` to match the resolution strategy of node version 16 and later.

## Common SDK version 5 to 6 (Web 2->3) (Node 5->6)

Some classes and types have been renamed or changed, and should be update if used.

### AccountTransactionType

Some types in the AccountTransactionType enum have been changed to align
with other languages.

- InitializeSmartContractInstance -> InitContract
- UpdateSmartContractInstance -> Update
- SimpleTransfer -> Transfer
- EncryptedTransfer -> EncryptedAmountTransfer
- SimpleTransferWithMemo -> TransferWithMemo
- EncryptedTransferWithMemo -> EncryptedAmountTransferWithMemo

### GtuAmount

The `GtuAmount` class has been renamed to `CcdAmount` to reflect the current
name of token.  If an object was used in place of a class instance, the field
`microGtuAmount` should be renamed to `microCcdAmount`.

### DeployModule

The field `content` has been renamed to `source` to align with other languages.

### UpdateConcractPayload

Field names have been renamed to align with other languages.  `contractAddress`
field has been renamed to `address`.  `parameter` field has been renamed to
`message`.

### InitContractPayload

Field names have been renamed to align with other languages.  `contractName`
field has been renamed to `initName`.  `parameter` field has been renamed to
`params`.
