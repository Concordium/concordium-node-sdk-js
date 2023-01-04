# Common

This package is the shared library for the nodejs and web SDK's. 

**Table of Contents**

- [Constructing transactions](#constructing-transactions)
    - [Create a simple transfer](#create-a-simple-transfer)
    - [Create a simple transfer with a memo](#create-a-simple-transfer-with-a-memo)
    - [Create a Register data transaction](#create-a-register-data-transaction)
    - [Create a configure delegation transaction](#create-a-configure-delegation-transaction)
    - [Create a credential for an existing account](#create-a-credential-for-an-existing-account)
    - [Create an update credentials transaction](#create-an-update-credentials-transaction)
    - [Deploy module](#deploy-module)
    - [Init Contract (parameterless smart contract)](#init-contract-parameterless-smart-contract)
    - [Update Contract (parameterless smart contract)](#update-contract-parameterless-smart-contract)
    - [Smart contract with parameters](#smart-contract-with-parameters)
- [Utility functions](#utility-functions)
    - [Generate account alias](#generate-account-alias)
    - [Check for account alias](#check-for-account-alias)
    - [Deserialize contract state](#deserialize-contract-state)
    - [Deserialize a receive function's return value](#deserialize-a-receive-functions-return-value)
    - [Deserialize a function's error](#deserialize-a-functions-error)
    - [Deserialize a transaction](#deserialize-a-transaction)
    - [Sign an account transaction](#sign-an-account-transaction)
    - [Sign a message](#sign-a-message)
- [Identity proofs](#identity-proofs)
    - [Build Statement](#build-statement)
        - [Minimum Age](#minimum-age)
        - [Eu membership](#eu-membership)
        - [Reveal statement](#reveal-statement)
        - [Range statement](#range-statement)
        - [Membership statement](#membership-statement)
        - [Non membership statement](#non-membership-statement)
    - [Verify Statement (verifyIdstatement)](#verify-statement-verifyidstatement)
    - [Prove Statement (getIdProof)](#prove-statement-getidproof)
- [JSON-RPC client](#json-rpc-client)

# Constructing transactions

## Create a simple transfer
The following example demonstrates how a simple transfer can be created.
```js
const header: AccountTransactionHeader = {
    expiry: new TransactionExpiry(new Date(Date.now() + 3600000)),
    nonce: 1n,              // the next nonce for this account, can be found using getNextAccountNonce
    sender: new AccountAddress("4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M"),
};
const simpleTransfer: SimpleTransferPayload = {
    amount: new CcdAmount(100n),
    toAddress: new AccountAddress("4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf"),
};
const simpleTransferAccountTransaction: AccountTransaction = {
    header: header,
    payload: simpleTransfer,
    type: AccountTransactionType.Transfer,
};
```

## Create a simple transfer with a memo
The following example demonstrates how a simple transfer with a memo can be created.
```js
const header: AccountTransactionHeader = {
    expiry: new TransactionExpiry(new Date(Date.now() + 3600000)),
    nonce: 1n,              // the next nonce for this account, can be found using getNextAccountNonce
    sender: new AccountAddress("4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M"),
};
const simpleTransferWithMemo: SimpleTransferWithMemoPayload = {
    amount: new CcdAmount(100n),
    toAddress: new AccountAddress("4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf"),
    memo: new DataBlob(Buffer.from('6B68656C6C6F20776F726C64', 'hex')),
};
const simpleTransferWithMemoAccountTransaction: AccountTransaction = {
    header: header,
    payload: simpleTransferWithMemo,
    type: AccountTransactionType.TransferWithMemo,
};
```
## Create a Register data transaction
The following example demonstrates how a register data transaction can be created.
```js
const header: AccountTransactionHeader = {
    expiry: new TransactionExpiry(new Date(Date.now() + 3600000)),
    nonce: 1n,              // the next nonce for this account, can be found using getNextAccountNonce
    sender: new AccountAddress("4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M"),
};
const registerData: RegisterDataPayload = {
    data: new DataBlob(Buffer.from('6B68656C6C6F20776F726C64', 'hex')) // Add the bytes you wish to register as a DataBlob
};
const registerDataAccountTransaction: AccountTransaction = {
    header: header,
    payload: registerData,
    type: AccountTransactionType.RegisterData,
};
```

## Create a configure delegation transaction
The following example demonstrates how a configure delegation transaction can be created.
Note that although all the fields are optional, they are all required, when becoming a delegator.
```js
const header: AccountTransactionHeader = {
    expiry: new TransactionExpiry(new Date(Date.now() + 3600000)),
    nonce: 1n,              // the next nonce for this account, can be found using getNextAccountNonce
    sender: new AccountAddress("4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M"),
};
const configureDelegationPayload: ConfigureDelegationPayload = {
        stake: new CcdAmount(1000000000n),
        delegationTarget: {
            delegateType: DelegationTargetType.Baker,
            bakerId: 100n
        },
        restakeEarnings: true,
};
const configureDelegationAccountTransaction: AccountTransaction = {
    header: header,
    payload: configureDelegationPayload,
    type: AccountTransactionType.ConfigureDelegation,
};
```

## Create a credential for an existing account
The following example demonstrates how to create a credential for an existing account. This
credential can then be deployed onto the account by the account owner with an update
credentials transaction. See [Create an update credentials transaction](#Create-an-update-credentials-transaction) for how to
create this transaction payload using the output from the example below.
See [Construct IdentityInput](#Construct-identityInput-for-creating-credentials) for how to construct an IdentityInput.
```js
const lastFinalizedBlockHash = (await client.getConsensusStatus()).lastFinalizedBlock;
const cryptographicParameters = await client.getCryptographicParameters(lastFinalizedBlockHash);
if (!cryptographicParameters) {
    throw new Error('Cryptographic parameters were not found on a block that has been finalized.');
}

// The parts of the identity required to create a new credential, parsed from 
// e.g. a wallet export.
const identityInput: IdentityInput = ...

// Require just one key on the credential to sign. This can be any number 
// up to the number of public keys added to the credential.
const threshold: number = 1;

// The index of the credential that will be created. This index is per identity
// and has to be in sequence, and not already used. Note that index 0 is used
// by the initial credential that was created with the identity.
const credentialIndex: number = 1;

// In this example the credential will have one signing key, but there
// could be multiple. The signatures on the credential must be supplied
// in the same order as the keys are here.
const publicKeys: VerifyKey[] = [
    {
        schemeId: "Ed25519",
        verifyKey: "c8cd7623c5a9316d8e2fccb51e1deee615bdb5d324fb4a6d33801848fb5e459e"
    }
];

// The attributes to reveal about the account holder on chain. In the case of an
// empty array no attributes are revealed.
const revealedAttributes: AttributeKey[] = [];

// The next step creates an unsigned credential for an existing account.
// Note that unsignedCredentialForExistingAccount also contains the randomness used, 
// which should be saved to later be able to reveal attributes, or prove properties about them.
const existingAccountAddress = new AccountAddress("3sAHwfehRNEnXk28W7A3XB3GzyBiuQkXLNRmDwDGPUe8JsoAcU");
const unsignedCredentialForExistingAccount = createUnsignedCredentialForExistingAccount(
    identityInput,
    cryptographicParameters.value,
    threshold,
    publicKeys,
    credentialIndex,
    revealedAttributes,
    existingAccountAddress
);

// Sign the credential information.
const credentialDigestToSign = getCredentialForExistingAccountSignDigest(unsignedCredentialForExistingAccount.unsignedCdi, existingAccountAddress);
const credentialSigningKey = 'acab9ec5dfecfe5a6e13283f7ca79a6f6f5c685f036cd044557969e4dbe9d781';
const credentialSignature = Buffer.from(await ed.sign(credentialDigestToSign, credentialSigningKey)).toString('hex');

// Combine the credential and the signatures so that the object is ready
// to be submitted as part of an update credentials transaction. This is the
// object that must be provided to the account owner, who can then use it to
// deploy it to their account.
const signedCredentialForExistingAccount: CredentialDeploymentInfo = buildSignedCredentialForExistingAccount(unsignedCredentialForExistingAccount.unsignedCdi, [credentialSignature]);
```

## Create an update credentials transaction
The following demonstrates how to construct an update credentials transaction, which is
used to deploy additional credentials to an account, remove existing credentials on the account 
or to update the credential threshold on the account. Note that the initial credential with
index 0 cannot be removed.
```js
// The signed credential that is to be deployed on the account. Received from the
// credential holder.
const signedCredentialForExistingAccount: CredentialDeploymentInfo = ...

// The credentials that are deployed have to be indexed. Index 0 is used up
// by the initial credential on an account. The indices that have already been
// used can be found in the AccountInfo.
const accountAddress = new AccountAddress("3sAHwfehRNEnXk28W7A3XB3GzyBiuQkXLNRmDwDGPUe8JsoAcU");
const accountInfo = await client.getAccountInfo(accountAddress, lastFinalizedBlockHash);
const nextAvailableIndex = Math.max(...Object.keys(accountInfo.accountCredentials).map((key) => Number(key))) + 1;

// The current number of credentials on the account is required, as it is used to calculate
// the correct energy cost.
const currentNumberOfCredentials = BigInt(Object.keys(accountInfo.accountCredentials).length);

const newCredential: IndexedCredentialDeploymentInfo = {
    cdi: signedCredentialForExistingAccount,
    index: nextAvailableIndex
};

// List the credential id (credId) of any credentials that should be removed from the account.
// The existing credentials (and their credId) can be found in the AccountInfo.
const credentialsToRemove = ["b0f11a9dcdd0758c8eec717956455deed73a0db59995da2cb20d73ee974eb39aec2c79970c640126827a8fbb84217424"];

// Update the credential threshold to 2, so that transactions require signatures from both
// of the credentials. If left at e.g. 1, then both credentials can create transactions
// by themselves.
const threshold = 2;

const updateCredentialsPayload: UpdateCredentialsPayload = {
    newCredentials: [newCredential],
    removeCredentialIds: credentialsToRemove,
    threshold: threshold,
    currentNumberOfCredentials: currentNumberOfCredentials,
};
```

## Deploy module
The following example demonstrates how to construct a "deployModule" transaction, which is used to deploy a smart contract module.

```js
//Get the wasm file as a buffer.
const wasmModule = Buffer.from(fs.readFileSync('path/to/module.wasm'));

const deployModule: DeployModulePayload = {
    source: wasmModule
};

const header: AccountTransactionHeader = {
    expiry: new TransactionExpiry(new Date(Date.now() + 3600000)),
    nonce: nextAccountNonce.nonce,
    sender: new AccountAddress(senderAccountAddress),
};

const deployModuleTransaction: AccountTransaction = {
    header: header,
    payload: deployModule,
    type: AccountTransactionType.DeployModule,
};
```

Note that if built using cargo-concordium `1.0.0`, the version should be added to the payload. In `2.0.0` and newer, the version is prepended into the module itself. To deploy a V0 module, which has been built with cargo-concordium version below 2,
you should add the version field to the payload:
```js
const deployModule: DeployModulePayload = {
        source: wasmModule,
        version: 0,
};
```

Finally, to actually deploy the module to the chain, send the constructed `deployModuleTransaction` to the chain using `sendAccountTransaction`. (See [Send Account Transaction](#Send-Account-Transaction) for how to do this)

## Init Contract (parameterless smart contract)
The following example demonstrates how to initialize a smart contract from a module, which has already been deployed. 
The name of the contract "INDBank".
In this example, the contract does not take any parameters, so we can leave parameters as an empty buffer.
```js
const contractName = 'INDBank'; 
const params = Buffer.from([]);
//The amount of energy that can be used for contract execution.
const maxContractExecutionEnergy = 300000n;
```
Create init contract transaction
```js
const initModule: InitContractPayload = {
    amount: new CcdAmount(0n), // Amount to send to the contract. If the smart contract is not payable, set the amount to 0.
    moduleRef: new ModuleReference('a225a5aeb0a5cf9bbc59209e15df030e8cc2c17b8dba08c4bf59f80edaedd8b1'), // Module reference
    initName: contractName,
    params: params,
    maxContractExecutionEnergy: maxContractExecutionEnergy
};
const initContractTransaction: AccountTransaction = {
    header: header,
    payload: initModule,
    type: AccountTransactionType.InitContract,
};
```

Finally, to actually initialize the contract on the chain, send the constructed `initContractTransaction` to the chain using `sendAccountTransaction`. (See [Send Account Transaction](#Send-Account-Transaction) for how to do this)

## Update Contract (parameterless smart contract)
The following example demonstrates how to update a smart contract. 

To update a smart contract we create a 'updateContractTransaction'.
To do this we need to specify the name of the receive function, which should contain the contract name as a prefix (So if the contract has the name "INDBank" and the receive function has the name "insertAmount" then the receiveName should be "INDBank.insertAmount").

We also need to supply the contract address of the contract instance. This consists of an index and a subindex.

In this example, the contract does not take any parameters, so we can leave the parameters/message as an empty buffer.
```js
const receiveName = 'INDBank.insertAmount';
const message = Buffer.from([]);
const contractAddress = { index: BigInt(83), subindex: BigInt(0) } as ContractAddress;
//The amount of energy that can be used for contract execution.
const maxContractExecutionEnergy = 30000n;
```
Create update contract transaction
```js
const updateModule: UpdateContractPayload =
{
    amount: new CcdAmount(1000n),
    address: contractAddress,
    receiveName: receiveName,
    message: message,
    maxContractExecutionEnergy: maxContractExecutionEnergy
};
const updateContractTransaction: AccountTransaction = {
    header: header,
    payload: updateModule,
    type: AccountTransactionType.Update,
};
```

Finally, to actually update the contract on the chain, send the constructed `updateContractTransaction` to the chain using `sendAccountTransaction`. (See [Send Account Transaction](#Send-Account-Transaction) for how to do this)

## Smart contract with parameters
In the previous sections we have seen how to initialize and update contracts without parameters. In this section we will describe how to initialize and update contracts with parameters.
The user should provide the input in the JSON format specified in [our documentation](https://developer.concordium.software/en/mainnet/smart-contracts/references/schema-json.html).

Let us consider the following example where the contract's initialization parameter is the following structure:
```rust
#[derive(SchemaType, Serialize)]
struct MyStruct {
    age: u16,
    name: String,
    city: String,
}
```
An example of a valid input would be:
```js
const userInput = {
        age: 51,
        name: 'Concordium',
        city: 'Zug',
    };
```
An other example could be if the parameter is the following "SomeEnum":
```rust
#[derive(SchemaType, Serialize)]
enum AnotherEnum {
    D,
}
#[derive(SchemaType, Serialize)]
enum SomeEnum {
    B(AnotherEnum),
}
```
Then the following would be a valid input:
```js
const userInput = {
    B: [
      {
        D: []
      }
    ]
  };
```
Then the user needs to provide the schema for the module. Here we load the schema from a file:
```js
const rawModuleSchema = Buffer.from(fs.readFileSync(
    'SCHEMA-FILE-PATH'
));
```
Then the parameters can be serialized into bytes:
```js
const inputParams = serializeInitContractParameters(
    "my-contract-name",
    userInput,
    rawModuleSchema,
    schemaVersion
);
```
For V0 contracts the schemaVersion should be `SchemaVersion.V0`. For V1 contracts it should currently be `SchemaVersion.V1`, unless the contract have been built using cargo-concordium >=2.0.0, which are internally versioned, and then the version does not need to be provided.

Then the payload and transaction can be constructed, in the same way as the parameterless example:
```js
const initModule: InitContractPayload = {
        amount: new CcdAmount(0n),
        moduleRef: new ModuleReference(
            '6cabee5b2d9d5013216eef3e5745288dcade77a4b1cd0d7a8951262476d564a0'
        ),
        contractName: contractName,
        params: inputParams,
        maxContractExecutionEnergy: baseEnergy,
    };
const initContractTransaction: AccountTransaction = {
    header: header,
    payload: initModule,
    type: AccountTransactionType.InitContract,
};
```

Finally, to actually initialize the contract on the chain, send the constructed `initContractTransaction` to the chain using `sendAccountTransaction`. (See [Send Account Transaction](#Send-Account-Transaction) for how to do this)

To update a contract with parameters, consider the example where the input is an i64 value, like -2000000.
```js
const userInput = -2000000;
const contractName = "my-contract-name";
const receiveFunctionName = "my-receive-function-name";
const receiveName = contractName + '.' + receiveFunctionName;
```

Then the user need to provide the schema. Here we load the schema from a file:
```js
const rawModuleSchema = Buffer.from(fs.readFileSync(
    'SCHEMA-FILE-PATH'
));
```
Then the parameters can be serialized into bytes:
```js
const inputParams = serializeUpdateContractParameters(
        contractName,
        receiveFunctionName,
        userInput,
        rawModuleSchema,
        schemaVersion
);
```
For V0 contracts the schema version should be `SchemaVersion.V0`. For V1 contracts it should currently be `SchemaVersion.V1`, unless the contract have been built using cargo-concordium >=2.0.0, which are internally versioned, and then the version does not need to be provided.

Then we will construct the update payload with parameters obtained 
```js
const updateModule: UpdateContractPayload = {
        amount: new CcdAmount(1000n),
        address: contractAddress,
        receiveName: receiveName,
        message: inputParams,
        maxContractExecutionEnergy: baseEnergy,
} as UpdateContractPayload;
const updateContractTransaction: AccountTransaction = {
        header: header,
        payload: updateModule,
        type: AccountTransactionType.Update,
};
```
Finally, to actually update the contract on the chain, send the constructed `updateContractTransaction` to the chain using `sendAccountTransaction`. (See [Send Account Transaction](#Send-Account-Transaction) for how to do this)

## Serialize parameters with only the specific type's schema
In the previous section the schema used was assumed to be the schema for an entire module. In some cases one might want to use a schema containing only the specific type of the parameter.

For this, the function `serializeTypeValue` can used.
```
const inputParams = serializeTypeValue(userInput, rawTypeSchema);
```

For reference, the type schema for parameters can be extracted using the functions `getInitContractParameterSchema` and `getUpdateContractParameterSchema`.

```
const rawTypeSchema = getUpdateContractParameterSchema(
        rawModuleSchema,
        contractName,
        receiveFunctionName,
        userInput,
        schemaVersion
)
```

# Utility functions

## Generate account alias
The following shows how to generate an account alias. The alias is an alternative address, which is connected to the same account.
The getAlias function takes a counter (0 <= counter < 2^24) to determine which alias to return.
```
const accountAddress = new AccountAddress("3sAHwfehRNEnXk28W7A3XB3GzyBiuQkXLNRmDwDGPUe8JsoAcU");
const aliasCount = 1;

const alias: AccountAddress = getAlias(accountAddress, aliasCount);
```

## Check for account alias
The following shows how to check if two addresses are aliases.
```
const accountAddress = new AccountAddress("3sAHwfehRNEnXk28W7A3XB3GzyBiuQkXLNRmDwDGPUe8JsoAcU");
const anotherAccountAddress = new AccountAddress("3sAHwfehRNEnXk28W7A3XB3GzyBiuQkXLNRmDwDGJhiz8WxC5b");

if (isAlias(accountAddress, anotherAccountAddress)) {
    ... // the addresses are aliases
} else {
    ... // the addresses are not aliases
}
```

## Deserialize contract state
The following example demonstrates how to deserialize a contract's state:

```js
const contractName = "my-contract-name"
const schema = Buffer.from(schemaSource); // Load schema from file
const rawContractState = Buffer.from(stateSource); // Could be getinstanceInfo(...).model
const state = deserializeContractState(contractName, schema, rawContractState);
```

## Deserialize a receive function's return value
The following example demonstrates how to deserialize a receive function's return value:

```js
const rawReturnValue = Buffer.from(returnValueSource);
const schema = Buffer.from(schemaSource); // Load schema from file
const contractName = "my-contract-name";
const functionName = "receive-function";
const schemaVersion = SchemaVersion.V1;
const returnValue = deserializeReceiveReturnValue(rawReturnValue, schema, contractName, functionName, schemaVersion);
```

Note that for V0 contracts the schemaVersion should be `SchemaVersion.V0`. For V1 contracts it should currently be `SchemaVersion.V1`, unless the contract have been built using cargo-concordium >=2.0.0, which are internally versioned, and then the version does not need to be provided.

## Deserialize a function's error
The following example demonstrates how to deserialize a receive function's error:

```js
const rawError = Buffer.from(errorSource);
const schema = Buffer.from(schemaSource); // Load schema from file
const contractName = "my-contract-name";
const functionName = "receive-function";
const error = deserializeReceiveError(rawError, schema, contractName, functionName);
```

Likewise for an init function's error:

```js
const rawError = Buffer.from(errorSource);
const schema = Buffer.from(schemaSource); // Load schema from file
const contractName = "my-contract-name";
const error = deserializeInitError(rawError, schema, contractName);
```

## Deserialize a transaction
The following example demonstrates how to deserialize a transaction:

```js
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

Note that currently the only supported account transaction kinds are `Transfer`, `TransferWithMemo` and `RegisterData`. If attempting to deserialize other transaction kinds, the function will throw an error;

## Sign an account transaction
The following example demonstrates how to use the `signTransaction` helper function to sign a account transaction:

```js
let accountTransaction: AccountTransaction;
// Create the transaction
// ...

const signer: AccountSigner = ...;
const transactionSignature: AccountTransactionSignature = signTransaction(accountTransaction, signer);
...
sendTransaction(accountTransaction, transactionSignature);
```

For a simple account, with a single credential and one keypair in the credential, one can use the `buildBasicAccountSigner` to get the signer. Otherwise one needs to implement the AccountSigner interface themselves, for now.
The `buildBasicAccountSigner` function take the account's private key as a hex string.

The following is an example of how to sign an account transaction without using the `signTransaction` helper function:
```js
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
To have an account sign an arbritrary message, one can use the `signMessage` function: 

```js
const account = new AccountAddress("4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M");
const message = "testMessage";
const signer: AccountSigner = ...;
const signature = signMessage(account, message, signer);
```

What is actually signed is the sha256 hash of the account address, eight zero bytes and the actual message. This ensures that the message cannot be an account transaction. To easily verify the signature, one can use the `verifyMessageSignature` function:

```js
const message = "testMessage";
const signature = ...; // signature from signMessage
const accountInfo = ...; // the getAccountInfo node entrypoint can be used for this
if (!verifyMessageSignature(message, signature, accountInfo)) {
   // the signature is incorrect
}
```

# Identity proofs
## Build Statement
The SDK contains a helper to create statements about identities, which can then be proven.

To do so, use the IdStatementBuilder, to build a statement:
```js
const statementBuilder = new IdStatementBuilder();
...
const statement = statementBuilder.getStatement();
```

The statement can then be proved using the `getIdProof`, or be provided to a wallet for them it to provide a proof for the statement.
There are currently 4 types of the statements, and if multiple are added, the resulting statement is the conjunction between them.

| Attribute name     | Format                                                                      |
|--------------------|-----------------------------------------------------------------------------|
| firstName          | string                                                                      |
| lastName           | string                                                                      |
| sex                | ISO/IEC 5218                                                                |
| dob                | ISO8601 YYYYMMDD                                                            |
| countryOfResidence | ISO3166-1 alpha-2                                                           |
| nationality        | ISO3166-1 alpha-2                                                           |
| idDocType          | na=0, passport=1, national id card=2, driving license=3, immigration card=4 |
| idDocNo            | string                                                                      |
| idDocIssuer        | ISO3166-1 alpha-2 or ISO3166-2 if applicable                                |
| idDocIssuedAt      | ISO8601 YYYYMMDD                                                            |
| idDocExpiresAt     | ISO8601 YYYYMMDD                                                            |
| nationalIdNo       | string                                                                      |
| taxIdNo            | string                                                                      |

The first parameter of the statement builder is a boolean, which defaults to true, that specifies whether the statement should be checked while being built.
It checks that:
- The used attribute tag is a known one
- There is not multiple statements on the same attribute
- Lower, upper and sets members have the format expected of the attribute

### Minimum Age
There is a helper function for specifying the prover must have some minimum age.

Example: add the statement that the prover must be born at least 18 years old:

```js
statementBuilder.addMinimumAge(18);
```

### Eu membership
There are helpers for specifying the country of residency or nationality to be one of the EU member states.

```js
statementBuilder.addEUNationality();
statementBuilder.addEUResidency();
```

### Reveal statement
State that a given attribute should be revealed as part of the proof.

```js
statementBuilder.revealAttribute(AttributesKeys.nationality);
```

### Range statement
State that a given attribute should be between 2 given values.

Example: add the statement that the prover must be born between January 1, 1941 and Februar 2, 2005.
```js
statementBuilder.addRange(AttributesKeys.dob, 19410101, 20050202);
```

Note that this type of statement is only allowed for the following attributes:
 - dob (date of birth)
 - idDocIssuedAt 
 - idDocExpiresAt

### Membership statement

Example: add the statement that the prover's country of residency is France or Spain:
```js
statementBuilder.addMembership(AttributesKeys.CountryOfResidency, ['FR', 'ES']);
```

Note that this type of statement is only allowed for the following attributes:
 - Nationality
 - CountryOfResidency
 - IdDocIssuer
 - IdDocType

### Non membership statement

Example: add the statement that the prover's country of residency not Germany nor Portugal:
```js
statementBuilder.addNonMembership(AttributesKeys.CountryOfResidency, ['DE', 'PT']);
```

Note that this type of statement is only allowed for the following attributes:
 - Nationality
 - CountryOfResidency
 - IdDocIssuer
 - IdDocType

## Verify Statement (verifyIdstatement)
The SDK provides a helper function to verify a statement, that it is well-formed and complies with the current rules.
The function is `verifyIdstatement` and it will throw an error if the statement does not verify.

Example:
```js
const statement = ...
let isValid = true;
try {
    verifyIdstatement(statement);
} catch (e) {
    // States why the statement is not valid:
    console.log(e.message);
    isValid = false;
}
```

## Prove Statement (getIdProof)
The SDK provides a helper function to prove an id statement.
The function is `getIdProof`:

Example:
```js
const statement = ...
const challenge = ...
const proof = getIdProof({
    idObject,
    globalContext,
    seedAsHex,
    net: 'Mainnet',
    identityProviderIndex,
    identityIndex,
    credNumber,
    statement,
    challenge,
})
```

# JSON-RPC client
The SDK also provides a JSON-RPC client, but it is primarily used for web, [so it has been documented in the web-sdk package instead](../web#JSON-RPC-client).
The nodejs SDK also provides a [gRPC client, which can interact directly with a node](../nodejs#ConcordiumNodeClient).
