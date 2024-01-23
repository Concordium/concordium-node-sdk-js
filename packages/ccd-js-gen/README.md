<!-- markdownlint-disable MD024 -->
# Smart Contract Client Generator <!-- omit in toc -->

Generate TypeScript/JavaScript code for interating with smart contracts and modules on the Concordium blockchain.

- Functions for instantiating new smart contract instances from a module.
- Functions for dry-running and calling entrypoints of the smart contract.
- Functions for constructing parameters.
- Parsing logged events, return values and error messages.
- Structured types for parameter, logged events, return values and error messages.

The code is generated from deployable smart contract modules, meaning it can be done with any smart contract available
locally and any smart contract deployed on chain.

## Example usage of a generated client

An example of using a generated client for a token smart contract implementing the
[CIS-2 standard](https://proposals.concordium.software/CIS/cis-2.html).
In the example, a contract client is constructed and a transaction calling the
[`transfer` entrypoint](https://proposals.concordium.software/CIS/cis-2.html#transfer)
of the smart contract. The parameter includes a transfer of 10 tokens from `sender` address to `receiver` address.

```typescript
import * as SDK from "@concordium/web-sdk";
import * as MyContract from "./generated/my-contract.js"; // Code generated from a smart contract module.

const grpcClient = // Setup gRPC client code here ...
const contractAddress = // Address of the smart contract instance.
const signer = // Keys for signing an account transaction.
const sender = // The AccountAddress sending the tokens and signing the transaction.
const receiver = // The AccountAddress receiving the tokens.

// Create a client for 'my-contract' smart contract.
const contractClient = await MyContract.create(
    grpcClient,
    contractAddress
);

// Construct the parameter for the 'transfer' entrypoint. The structure of the parameter depends on the contract.
const parameter: MyContract.TransferParameter = [{
    tokenId: "",
    amount: 10,
    from: { type: 'Account', content: sender },
    to: { type: 'Account', content: receiver },
    data: "",
}];

// Send transaction for invoking the 'transfer' entrypoint of the smart contract.
const transactionHash = await MyContract.sendTransfer(contractClient, {
    senderAddress: sender,
    energy: SDK.Energy.create(12000) // The amount of energy needed will depend on the contract.
}, parameter, signer);
```

<!--toc:start-->
- [Example usage of a generated client](#example-usage-of-a-generated-client)
- [Install the package](#install-the-package)
- [Using the CLI](#using-the-cli)
  - [Example](#example)
- [Using the library](#using-the-library)
  - [Generate from smart contract module file](#generate-from-smart-contract-module-file)
  - [Generate from smart contract module on chain](#generate-from-smart-contract-module-on-chain)
- [Using the generated client](#using-the-generated-client)
  - [Generated module client](#generated-module-client)
    - [The client type](#the-client-type)
    - [function `create`](#function-create)
    - [function `createUnchecked`](#function-createunchecked)
    - [const `moduleReference`](#const-modulereference)
    - [function `getModuleSource`](#function-getmodulesource)
    - [type `<ContractName>Parameter`](#type-contractnameparameter)
    - [function `instantiate<ContractName>`](#function-instantiatecontractname)
    - [function `create<ContractName>ParameterWebWallet`](#function-createcontractnameparameterwebwallet)
  - [Generated contract client](#generated-contract-client)
    - [The contract client type](#the-contract-client-type)
    - [function `create`](#function-create-1)
    - [function `createUnchecked`](#function-createunchecked-1)
    - [const `moduleReference`](#const-modulereference-1)
    - [type `Event`](#type-event)
    - [function `parseEvent`](#function-parseevent)
    - [type `<EntrypointName>Parameter`](#type-entrypointnameparameter)
    - [function `send<EntrypointName>`](#function-sendentrypointname)
    - [function `dryRun<EntrypointName>`](#function-dryrunentrypointname)
    - [type `ReturnValue<EntrypointName>`](#type-returnvalueentrypointname)
    - [function `parseReturnValue<EntrypointName>`](#function-parsereturnvalueentrypointname)
    - [type `ErrorMessage<EntrypointName>`](#type-errormessageentrypointname)
    - [function `parseErrorMessage<EntrypointName>`](#function-parseerrormessageentrypointname)
    - [function `create<EntrypointName>ParameterWebWallet`](#function-createentrypointnameparameterwebwallet)
<!--toc:end-->

## Install the package

Install the package, saving it to `devDependencies`:

**npm**

```bash
npm install --save-dev @concordium/ccd-js-gen
```

**yarn**

```bash
yarn add --dev @concordium/ccd-js-gen
```

**pnpm**

```bash
pnpm install --save-dev @concordium/ccd-js-gen
```

> The package can also be used directly using `npx`, without first adding it as a dependency,
however it is recommended to add it in `package.json` to keep track the exact version used when
generating the code, as different version might produce different code.

## Using the CLI

This package provides the `ccd-js-gen` command, which can be used from the commandline.

**Options**:

- `-m, --module <path>` Path to the smart contract module.
- `-o, --out-dir <path>` Directory to use for the generated code.

### Example

To generate smart contract clients into a directory `generated` from the smart contract
module `./my-contract.wasm.v1`:

```bash
ccd-js-gen --module ./my-contract.wasm.v1 --out-dir ./generated
```

> For a dapp project, it is recommended to have this as part of a script in `package.json`.

## Using the library

This package can be used programmatically as well.

```typescript
import * as ccdJsGen from "@concordium/ccd-js-gen"
```

### Generate from smart contract module file

To generate smart contract clients for a smart contract module file,
either downloaded from the blockchain or build from the smart contract source code:

```typescript
import * as ccdJsGen from "@concordium/ccd-js-gen"

const moduleFilePath = "./my-contract.wasm.v1"; // Path to smart contract module.
const outDirPath = "./generated"; // The directory to use for the generated files.

// Read the module and generate the smart contract clients.
console.log('Generating smart contract module clients.')
await ccdJsGen.generateContractClientsFromFile(moduleFilePath, outDirPath);
console.log('Code generation was successful.')
```

### Generate from smart contract module on chain

To generate smart contract clients for a smart contract module on chain,
you need access to the gRPC of a Concordium node.
Use `@concordium/web-sdk` to download the smart contract module and use it to generate the clients.

```typescript
import * as ccdJsGen from "@concordium/ccd-js-gen"
import * as SDK from "@concordium/web-sdk"

const outDirPath = "./generated"; // The directory to use for the generated files.
const outputModuleName = "wCCD-module"; // The name to give the output smart contract module.

const grpcClient = ...; // A Concordium gRPC client from @concordium/web-sdk.
const moduleRef = SDK.ModuleReference.fromHexString('<hex of module referecene>');

// Fetch the smart contract module source from chain.
const moduleSource = await grpcClient.getModuleSource(moduleRef);

// Generate the smart contract clients from module source.
console.info('Generating smart contract module clients.');
await ccdJsGen.generateContractClients(moduleSource, outputModuleName, outDirPath);
console.info('Code generation was successful.');
```

## Using the generated client

The generator produces a file with functions for interacting with the smart contract module and files
for each smart contract in the smart contract module used.

For example: generating clients for a smart contract module `my-module` containing
the smart contracts `my-contract-a` and `my-contract-b`.
into the directory `./generated` produces the following structure:

```bash
generated/
├─ my-module.js        // Functions for interacting with the 'my-module' smart contract module on chain.
├─ my-module_my-contract-a.js    // Functions for interacting with the 'my-contract-a' smart contract.
└─ my-module_my-contract-b.js    // Functions for interacting with the 'my-contract-b' smart contract.
```

> There might also be type declarations (`<file>.d.ts`) for TypeScript, depending on the provided options.

### Generated module client

A file is produced with a client for interacting with the smart contract module.
This provides functions for instantiating smart contract instances.

An example of importing a smart contract module generated from a `my-module.wasm.v1` file:

```typescript
import * as MyModule from "./generated/my-module.js";
```

#### The client type

The type representing the client for the smart contract module is accessable using `MyModule.Type`.

#### function `create`

Construct a module client for interacting with a smart contract module on chain.
This function ensures the smart contract module is deployed on chain and throws an error otherwise.

**Parameter:** The function takes a gRPC client from '@concordium/web-sdk'.

```typescript
const grpcClient = ...; // Concordium gRPC client from '@concordium/web-sdk'.
const myModule: MyModule.Type = await MyModule.create(grpcClient);
```

#### function `createUnchecked`

Construct a module client for interacting with a smart contract module on chain.
This function _skips_ the check of the smart contract module being deployed on chain and leaves it
up to the caller to ensure this.

**Parameter:** The function takes a gRPC client from '@concordium/web-sdk'.

```typescript
const grpcClient = ...; // Concordium gRPC client from '@concordium/web-sdk'.
const myModule: MyModule.Type = MyModule.createUnchecked(grpcClient);
```

> To run the checks manually use `await MyModule.checkOnChain(myModule);`.

#### const `moduleReference`

Variable with the reference of the smart contract module.

```typescript
const ref = MyModule.moduleReference;
```

#### function `getModuleSource`

Get the module source of the deployed smart contract module from chain.

```typescript
const myModule: MyModule.Type = ...; // Generated module client
const moduleSource = await MyModule.getModuleSource(myModule);
```

#### type `<ContractName>Parameter`

Type representing the parameter for when instantiating a smart contract.
The type is named `<ContractName>Parameter` where `<ContractName>` is the smart contract name in Pascal case.

_This is only generated when the schema contains init-function parameter type._

#### function `instantiate<ContractName>`

For each smart contract in module a function for instantiating new instance is produced.
These are named `instantiate<ContractName>` where `<ContractName>` is the smart contract name in Pascal case.

An example for a smart contract module containing a smart contract named `my-contract`,
the function becomes `instantiateMyContract`.

**Parameters**

The function parameters are:

- `moduleClient` The client of the on-chain smart contract module.
- `transactionMetadata` Metadata related to constructing the transaction, such as energy and CCD amount to include.
  - `senderAddress` The address invoking this call.
  - `energy` The energy reserved for executing this transaction.
  - `amount` The amount of CCD included in the transaction. Defaults to 0.
  - `expiry` Expiry date of the transaction. Defaults to 5 minutes from when constructing the transaction.
- `parameter` Parameter to provide the smart contract module for the instantiation.

  _With schema type:_
  If the schema contains type information for the parameter,
  a type for the parameter is generated and used for this function.
  The type is named `<ContractName>Parameter` where `<ContractName>` is the smart contract name in Pascal case.

  _Without schema type:_
  If no schema information is present, the function uses the generic `Parameter` from `@concordium/web-sdk`.

- `signer` The keys to use for signing the transaction.

**Returns**: Promise with the hash of the transaction.

```typescript
// Generated module client.
const myModule: MyModule.Type = await MyModule.create(grpcClient);
// The keys to use for signing the transaction.
const signer = ...;
// Transaction meta information.
const transactionMeta = {
  // The account address signing the transaction.
  senderAddress: SDK.AccountAddress.fromBase58("357EYHqrmMiJBmUZTVG5FuaMq4soAhgtgz6XNEAJaXHW3NHaUf"),
  // The amount of energy needed will depend on the contract.
  energy: SDK.Energy.create(12000),
};
// Parameter to pass the smart contract init-function. The structure depends on the contract.
const parameter = ...;
const transactionHash = await MyModule.instantiateMyContract(myModule, transactionMeta, parameter, signer);
```

#### function `create<ContractName>ParameterWebWallet`

For each smart contract in module a function for _constructing_ the WebWallet formattet parameter for initializing a new instance is produced. This is to be used with the [`@concordium/wallet-connector`](https://www.npmjs.com/package/@concordium/wallet-connectors) package.
These are named `create<ContractName>ParameterWebWallet` where `<ContractName>` is the smart contract name in Pascal case.

An example for a smart contract module containing a smart contract named `my-contract`,
the function becomes `createMyContractParameterWebWallet`.

_This is only generated when the schema contains contract initialization parameter type._

**Parameter**

The function parameter is:

- `parameter` Parameter to provide the smart contract module for the instantiation.

**Returns**: Parameter for initializing a contract instance in the format used by [`@concordium/wallet-connector`](https://www.npmjs.com/package/@concordium/wallet-connectors).

```typescript
// Wallet connection from `@concordium/wallet-connector`.
const webWalletConnection: WalletConnection = ...;
// Parameter to pass the smart contract init-function. The structure depends on the contract.
const parameter: MyModule.MyContractParameter = ...;
// Convert the parameter into the format expected by the wallet.
const walletParameter = MyModule.createMyContractParameterWebWallet(parameter);
// Use wallet connection to sign and send the transaction.
const sender = ...;
const transactionHash = await webWalletConnection.signAndSendTransaction(
    sender,
    AccountTransactionType.InitContract,
    walletParameter
);
```

### Generated contract client

For each of the smart contracts in the module a file is produced named after the smart contract.
Each file contains functions for interacting with an instance of this smart contract.

An example of importing a smart contract contract client generated from a module containing a
smart contract named `my-contract`:

```typescript
import * as MyContract from "./generated/my-module_my-contract.js";
```

#### The contract client type

The type representing the client for the smart contract instance is accessable using `MyContract.Type`.

#### function `create`

Construct a client for interacting with a smart contract instance on chain.
This function ensures the smart contract instance exists on chain, and that it is using a
smart contract module with a matching reference.

**Parameters:**

- `grpcClient` The function takes a gRPC client from `@concordium/web-sdk`.
- `contractAddress` The contract address of the smart contract instance.

```typescript
const grpcClient = ...; // Concordium gRPC client from '@concordium/web-sdk'.
const contractAddress = SDK.ContractAddress.create(...); // The address of the contract instance.
const myContract: MyContract.Type = await MyContract.create(grpcClient, contractAddress);
```

#### function `createUnchecked`

Construct a client for interacting with a smart contract instance on chain.
This function _skips_ the check ensuring the smart contract instance exists on chain,
and that it is using a smart contract module with a matching reference, leaving it up to the caller to ensure this.

**Parameters:**

- `grpcClient` The function takes a gRPC client from `@concordium/web-sdk`.
- `contractAddress` The contract address of the smart contract instance.

```typescript
const grpcClient = ...; // Concordium gRPC client from '@concordium/web-sdk'.
const contractAddress = SDK.ContractAddress.create(...); // The address of the contract instance.
const myContract: MyContract.Type = MyContract.createUnchecked(grpcClient, contractAddress);
```

> To run the checks manually use `await MyContract.checkOnChain(myContract);`.

#### const `moduleReference`

Variable with the reference of the smart contract module used by this contract.

```typescript
const ref = MyContract.moduleReference;
```

#### type `Event`

Type representing the structured event logged by this smart contract.

_This is only generated when the schema contains contract event type._

#### function `parseEvent`

Parse a raw contract event logged by this contract into a structured representation.

_This is only generated when the schema contains contract event type._

**Parameter:** `event` The contract event to parse.

**Returns:** The structured event of the `Event` type (see type above).

```typescript
const rawContractEvent = ...; // The unparsed contract event from some transaction.
const event: MyContract.Event = MyContract.parseEvent(rawContractEvent);
```

#### type `<EntrypointName>Parameter`

Type representing the parameter of for an entrypoint.
The type is named `<EntrypointName>Parameter` where `<EntrypointName>` is the name of the entrypoint in Pascal case.

_This is only generated when the schema contains contract entrypoint parameter type._

#### function `send<EntrypointName>`

For each entrypoint of the smart contract a function for sending a transaction calling this entrypoint is produced.
These are named `send<EntrypointName>` where `<EntrypointName>` is the name of the entrypoint in Pascal case.

An example for a smart contract with an entrypoint named `launch-rocket`, the function becomes `sendLaunchRocket`.

**Parameters**

The function parameters are:

- `contractClient` The client of the smart contract instance.
- `transactionMetadata` Metadata related to constructing the transaction, such as energy and CCD amount to include.
  - `senderAddress` The address invoking this call.
  - `energy` The energy reserved for executing this transaction.
  - `amount` The amount of CCD included in the transaction. Defaults to 0.
  - `expiry` Expiry date of the transaction. Defaults to 5 minutes from when constructing the transaction.
- `parameter` Parameter to provide to the smart contract entrypoint.

  _With schema type:_
  If the schema contains type information for the parameter,
  a type for the parameter is generated and used for this function (see type above).

  _Without schema type:_
  If no schema information is present, the function uses the generic `Parameter` from `@concordium/web-sdk`.

- `signer` The keys of to use for signing the transaction.

**Returns**: Promise with the hash of the transaction.

```typescript
// Generated contract client.
const myContract: MyContract.Type = await MyContract.create(grpcClient, contractAddress);
// The keys to use for signing the transaction.
const signer = ...;
// Transaction meta information.
const transactionMeta = {
  // The account address signing the transaction.
  senderAddress: SDK.AccountAddress.fromBase58("357EYHqrmMiJBmUZTVG5FuaMq4soAhgtgz6XNEAJaXHW3NHaUf"),
  // The amount of energy needed will depend on the contract.
  energy: SDK.Energy.create(12000),
};
// Parameter to pass the smart contract entrypoint. The structure depends on the contract.
const parameter = ...;
// Send the transaction calling the `launch-rockets` entrypoint.
const transactionHash = await MyContract.sendLaunchRocket(myContract, transactionMeta, parameter, signer);
```

#### function `dryRun<EntrypointName>`

For each entrypoint of the smart contract a function for dry-running a transaction calling this entrypoint is produced.
These are named `dryRun<EntrypointName>` where `<EntrypointName>` is the name of the entrypoint in Pascal case.

An example for a smart contract with an entrypoint named `launch-rocket`, the function becomes `dryRunLaunchRocket`.

**Parameters**

The function parameters are:

- `contractClient` The client of the smart contract instance.
- `parameter` Parameter to provide to the smart contract entrypoint.

  _With schema type:_
  If the schema contains type information for the parameter,
  a type for the parameter is generated and used for this function (see type above).

  _Without schema type:_
  If no schema information is present, the function uses the generic `Parameter` from `@concordium/web-sdk`.

- `invokeMetadata` Optional transaction metadata object with the following optional properties:
  - `invoker` The address invoking this call, can be either an `AccountAddress` or `ContractAddress`.
  Defaults to an `AccountAddress` (Base58check encoding of 32 bytes with value zero).
  - `amount` The amount of CCD included in the transaction. Defaults to 0.
  - `energy` The energy reserved for executing this transaction. Defaults to max energy possible.
- `blockHash` (optional) Provide to specify the block hash, for which the state will be used for dry-running.
  When not provided, the last finalized block is used.

**Returns**: Promise with the invoke result.

```typescript
const myContract: MyContract.Type = ...; // Generated contract client.
const parameter = ...; // Parameter to pass the smart contract entrypoint.
// Transaction metadata for invoking.
const metadata = {
  // Amount of CCD to include in the transaction.
  amount: SDK.CcdAmount.fromCcd(10),
  // Invoker of the transaction
  invoker: SDK.AccountAddress.fromBase58("357EYHqrmMiJBmUZTVG5FuaMq4soAhgtgz6XNEAJaXHW3NHaUf")
};
const invokeResult = await MyContract.dryRunLaunchRocket(myContract, parameter, metadata);
```

#### type `ReturnValue<EntrypointName>`

Type representing the return value from a successful dry-run/invocation of an entrypoint.
The type is named `ReturnValue<EntrypointName>` where `<EntrypointName>` is the name of
the relevant entrypoint in Pascal case.

_This is only generated when the schema contains entrypoint return value type._

#### function `parseReturnValue<EntrypointName>`

For each entrypoint of the smart contract a function for parsing the return value in a
successful invocation/dry-running.
These are named `parseReturnValue<EntrypointName>` where `<EntrypointName>` is the name
of the entrypoint in Pascal case.

_This is only generated when the schema contains entrypoint return value type._

An example for a smart contract with an entrypoint named `launch-rocket`, the function
becomes `parseReturnValueLaunchRocket`.

**Parameter:** `invokeResult` The result from dry-running a transactions calling the entrypoint.

**Returns:** Undefined if the invocation was not successful otherwise the parsed return
value of the type `ReturnValue<EntrypointName>`.

```typescript
// Dry run the entrypoint
const invokeResult = await MyContract.dryRunLaunchRocket(myContract, invoker, parameter);

// Parse the return value
const returnValue: MyContract.ReturnValueLaunchRocket | undefined = parseReturnValueLaunchRocket(invokeResult);
```

#### type `ErrorMessage<EntrypointName>`

Type representing the error message from a rejected dry-run/invocation of an entrypoint.
The type is named `ErrorMessage<EntrypointName>` where `<EntrypointName>` is the name of
the relevant entrypoint in Pascal case.

_This is only generated when the schema contains entrypoint error message type._

#### function `parseErrorMessage<EntrypointName>`

For each entrypoint of the smart contract a function for parsing the error message in a
rejected invocation/dry-running.
These are named `parseErrorMessage<EntrypointName>` where `<EntrypointName>` is the name
of the entrypoint in Pascal case.

_This is only generated when the schema contains entrypoint error message type._

An example for a smart contract with an entrypoint named `launch-rocket`, the function
becomes `parseErrorMessageLaunchRocket`.

**Parameter:** `invokeResult` The result from dry-running a transactions calling some entrypoint.

**Returns:** Undefined if the invocation was not rejected, otherwise the parsed error
message of the type `ReturnValue<EntrypointName>`.

```typescript
// Dry run the entrypoint
const invokeResult = await MyContract.dryRunLaunchRocket(myContract, invoker, parameter);

// Parse the error message
const message: MyContract.ErrorMessageLaunchRocket | undefined = MyContract.parseErrorMessageLaunchRocket(invokeResult);
```

#### function `create<EntrypointName>ParameterWebWallet`

For each entrypoint of the smart contract a function for _constructing_ the WebWallet formattet parameter is produced. This is to be used with the [`@concordium/wallet-connector`](https://www.npmjs.com/package/@concordium/wallet-connectors) package.
These are named `create<EntrypointName>ParameterWebWallet` where `<EntrypointName>` is the entrypoint name in Pascal case.

_This is only generated when the schema contains contract entrypoint parameter type._

An example for a smart contract with an entrypoint named `launch-rocket`, the function
becomes `createLaunchRocketParameterWebWallet`.

**Parameter**

The function parameter is:

- `parameter` Parameter to provide to the smart contract entrypoint.

**Returns**: Parameter for updating a contract instance in the format used by [`@concordium/wallet-connector`](https://www.npmjs.com/package/@concordium/wallet-connectors).

```typescript
// Wallet connection from `@concordium/wallet-connector`.
const webWalletConnection: WalletConnection = ...;
// Parameter to pass the smart contract init-function. The structure depends on the contract.
const parameter: MyContract.LaunchRocketParameter = ...;
// Convert the parameter into the format expected by the wallet.
const walletParameter = MyContract.createLaunchRocketParameterWebWallet(parameter);
// Use wallet connection to sign and send the transaction.
const sender = ...;
const transactionHash = await webWalletConnection.signAndSendTransaction(
    sender,
    AccountTransactionType.Update,
    walletParameter
);
```
