
**Table of Contents:**
<!--toc:start-->
- [Generate account alias](#generate-account-alias)
- [Deserialize contract state](#deserialize-contract-state)
- [Deserialize a receive function's return value](#deserialize-a-receive-functions-return-value)
- [Deserialize a function's error](#deserialize-a-functions-error)
- [Deserialize a transaction](#deserialize-a-transaction)
- [Creating an `AccountSigner`](#creating-an-accountsigner)
- [Sign an account transaction](#sign-an-account-transaction)
- [Sign a message](#sign-a-message)
- [Deserialize smart contract types with only the specific type's schema](#deserialize-smart-contract-types-with-only-the-specific-types-schema)
- [Check smart contract for support for standards](#check-smart-contract-for-support-for-standards)
<!--toc:end-->

## Generate account alias

The following shows how to generate an account alias. The alias is an
alternative address, which is connected to the same account.  The getAlias
function takes a counter (0 <= counter < 2^24) to determine which alias
to return.

{@codeblock ~~:common/aliases.ts#documentation-snippet}

## Deserialize contract state

The following example demonstrates how to deserialize a contract's state:

```ts
    const contractName = "my-contract-name"
    const schema = Buffer.from(schemaSource); // Load schema from file
    const rawContractState = Buffer.from(stateSource); // Could be getinstanceInfo(...).model
    const state = deserializeContractState(contractName, schema, rawContractState);
```

## Deserialize a receive function's return value

The following example demonstrates how to deserialize a receive function's
return value:

```ts
    const rawReturnValue = Buffer.from(returnValueSource);
    const schema = Buffer.from(schemaSource); // Load schema from file
    const contractName = "my-contract-name";
    const functionName = "receive-function";
    const schemaVersion = SchemaVersion.V1;
    const returnValue = deserializeReceiveReturnValue(
        rawReturnValue,
        schema,
        contractName,
        functionName,
        schemaVersion
    );
```

Note that for V0 contracts the schemaVersion should be `SchemaVersion.V0`. For
V1 contracts it should currently be `SchemaVersion.V1`, unless the contract
have been built using cargo-concordium >=2.0.0, which are internally versioned,
and then the version does not need to be provided.

## Deserialize a function's error

The following example demonstrates how to deserialize a receive function's error:

```ts
    const rawError = Buffer.from(errorSource);
    const schema = Buffer.from(schemaSource); // Load schema from file
    const contractName = "my-contract-name";
    const functionName = "receive-function";
    const error = deserializeReceiveError(rawError, schema, contractName, functionName);
```

Likewise for an init function's error:

```ts
    const rawError = Buffer.from(errorSource);
    const schema = Buffer.from(schemaSource); // Load schema from file
    const contractName = "my-contract-name";
    const error = deserializeInitError(rawError, schema, contractName);
```

## Deserialize a transaction

<!-- TODO: Add typechecked examples for this section -->
The following example demonstrates how to deserialize a transaction:

```ts
const serializedTransaction: Buffer = ...
const deserialized = deserializeTransaction(serializedTransaction);
if (deserialized.kind === BlockItemKind.AccountTransactionKind) {
        // transaction is an account transaction
    const accountTransaction: AccountTransaction = deserialized.transaction.accountTransaction;
    const signatures: AccountTransactionSignature = deserialized.transaction.signatures;
    ...
    if (accountTransaction.type === AccountTransactionType.Transfer) {
        // transaction is a simple transfer
    }
} else if (deserialized.kind === BlockItemKind.CredentialDeploymentKind) {
    // transaction is a credentialDeployment
    const credentialDeployment = deserialized.transaction.credential;
}
```

Note that currently the only supported account transaction kinds are
`Transfer`, `TransferWithMemo` and `RegisterData`. If attempting to deserialize
other transaction kinds, the function will throw an error;

## Creating an `AccountSigner`

It is possible to build an `AccountSigner` in a variety of ways by utilizing
the function `buildAccountSigner`.

If you have a wallet file export from a Concordium wallet it can be used:

{@codeblock ~~:common/buildAccountSigner.ts#documentation-snippet}

For a simple account, with a single credential and one keypair in the
credential, one can also supply a single private key, like so:

```ts
    const privateKey = '...'; // Private key of an account as hex string
    const signer: AccountSigner = buildAccountSigner(privateKey);
```

For a more complex account with one or more credentials, each with one or more
keypairs, `buildAccountSigner` is also compatible with the format created by
the chain genesis tool, Concordium wallet exports, along with a map of type
`SimpleAccountKeys`.

```ts
    const keys: SimpleAccountKeys = {
        0: {
            0: '...', // Private key of an account as hex string
            1: '...',
            ...
        },
        ...
    };
    const signer: AccountSigner = buildAccountSigner(keys);
```

## Sign an account transaction

The following example demonstrates how to use the `signTransaction` helper
function to sign a account transaction:

{@codeblock ~~:common/simpleTransfer.ts#documentation-snippet-sign-transaction}

The following is an example of how to sign an account transaction without
using the `signTransaction` helper function:

<!-- TODO: Add typechecked examples for this codeblock -->
```ts
    import * as ed from "@noble/ed25519";

    let accountTransaction: AccountTransaction;
    // Create the transaction
    // ...

    // Sign the transaction, the following is just an example, and any method for signing
    // with the key can be employed.
    const signingKey = "ce432f6bba0d47caec1f45739331dc354b6d749fdb8ab7c2b7f6cb24db39ca0c";
    const hashToSign = getAccountTransactionSignDigest(accountTransaction);
    const signature = Buffer.from(await ed.sign(hashToSign, signingKey)).toString("hex");

    // The signatures used to sign the transaction must be provided in a structured way,
    // so that each signature can be mapped to the credential that signed the transaction.
    // In this example we assume the key used was from the credential with index 0, and it
    // was the key with index 0.
    const signatures: AccountTransactionSignature = {
        0: {
            0: signature
        }
    };
```

## Sign a message

<!-- TODO: Add typechecked examples for this section -->
To have an account sign an arbritrary message, one can use the `signMessage`
function:

```ts
    const account = new AccountAddress("4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M");
    const message = "testMessage";
    const signer: AccountSigner = ...;
    const signature = signMessage(account, message, signer);
```

What is actually signed is the sha256 hash of the account address, eight
zero bytes and the actual message. This ensures that the message cannot
be an account transaction. To easily verify the signature, one can use the
`verifyMessageSignature` function:

```ts
    const message = "testMessage";
    const signature = ...; // signature from signMessage
    const accountInfo = ...; // the getAccountInfo node entrypoint can be used for this
    if (!verifyMessageSignature(message, signature, accountInfo)) {
       // the signature is incorrect
    }
```

The message can either be a utf8 encoded string or a Uint8Array directly
containing the message bytes.

## Deserialize smart contract types with only the specific type's schema

The SDK exposes a general function to deserialize smart contract values
from binary format to their JSON representation. In the previous sections
the schema used was assumed to be the schema for an entire module, this
function can be used with the schema containing only the specific type of
the parameter, return value, event or error.

```ts
    const deserializedValue = deserializeTypeValue(serializedValue, rawTypeSchema);
```

Note that the specific schema can be obtained using
[cargo-concordium](https://developer.concordium.software/en/mainnet/smart-contracts/guides/setup-tools.html#cargo-concordium)'s
`schema-json` command, and specifically for parameters, this SDK exposes
functions for that, check the "serialize parameters with only the specific
types schema" section on the {@page transactions.md transactions page}
for those.

## Check smart contract for support for standards

To check if a smart contract supports a certain standard (according to [CIS-0
standard detection](https://proposals.concordium.software/CIS/cis-0.html)),
the utility function `cis0Supports` can be used. It should be noted, that
the support of the contract is purely based on the claims of the contract
and does not give any guarantees for whether the contract adheres to the
standard it claims to implement. The function returns `undefined` if the
contract does not support CIS-0.

This requires a [`ConcordiumGRPCClient`](../classes/grpc.ConcordiumGRPCClient.html).

```ts
    const client = ...; // `ConcordiumGRPCClient`
    const address = {index: 1234n, subindex: 0n}; // Contract to check for support.
    const standardId = 'CIS-2';
    // const standardIds = ['CIS-1', 'CIS-2']; // Example of a list of standards to check for.

    const supportResult = await cis0Supports(client, address, 'CIS-2');
```
