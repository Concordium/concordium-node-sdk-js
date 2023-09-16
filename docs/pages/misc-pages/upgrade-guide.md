## Common SDK version 10 (Web 7) (Node 10)

### Web

The `@concordium/web-sdk` now requires bundlers to respect `exports` field of
`package.json` of a module. This is due to relying on entrypoints declared in
the `exports` field of `@concordium/common-sdk`
and correspondingly `@concordium/rust-bindings` to make it possible to select
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

The `@concordium/node-sdk` module is no longer compatible with
node versions <16. This is due to relying on entrypoints declared in
the `exports` field of `@concordium/common-sdk`
and correspondingly `@concordium/rust-bindings` to make it possible to select
only parts of the SDK to include in your application.

For **TypeScript** users, at least typescript version 4.7 is required along
with the setting `compilerOptions.moduleResultion` to `"node16"` or
`"nodenext"` to match the resolution strategy of node version 16 and later.

The following entrypoints are made available for consumers of
`@concordium/node-sdk`:

- `@concordium/node-sdk` exposes the full API of the SDK.
- `@concordium/node-sdk/cis0` entrypoint exposes functionality for working
with contracts adhering to the
[CIS-0](https://proposals.concordium.software/CIS/cis-0.html) standard.
- `@concordium/node-sdk/cis2` entrypoint exposes functionality for working
with contracts adhering to the
[CIS-2](https://proposals.concordium.software/CIS/cis-2.html) standard.
- `@concordium/node-sdk/cis4` entrypoint exposes functionality for working
with contracts adhering to the
[CIS-4](https://proposals.concordium.software/CIS/cis-4.html) standard.
- `@concordium/node-sdk/client` entrypoint exposes the **(deprecated)**
grpc client for interacting with a nodes GPRCv1 interface.
- `@concordium/node-sdk/grpc` entrypoint exposes the grpc client for
interacting with a nodes GRPCv2 interface.
- `@concordium/node-sdk/id` entrypoint exposes functionality for working
with ID proofs.
- `@concordium/node-sdk/schema` entrypoint exposes functionality for working
with smart contract schemas, i.e.(de)serializing types using a smart contract schema.
  - This uses the wasm entrypoint at `@concordium/rust-bindings/dapp`.
- `@concordium/node-sdk/types` entrypoint exposes functionality for working
with concordium domain types.
- `@concordium/node-sdk/wasm` entrypoint exposes a variety of functionality for
working with concordium domain types, which requires WASM.
  - This uses the wasm entrypoint at `@concorodium/rust-bindings/wallet`.
- `@concordium/node-sdk/web3-id` entrypoint exposes functionality for working
with web3-id proofs.

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
