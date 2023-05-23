
This document describes how to create different transactions for both the
Nodejs and Web SDK's.

**Table of Contents:**

<!--toc:start-->
- [Constructing transactions](#constructing-transactions)
  - [Create a simple transfer with or without memo](#create-a-simple-transfer-with-or-without-memo)
  - [Create a Register data transaction](#create-a-register-data-transaction)
  - [Create a configure delegation transaction](#create-a-configure-delegation-transaction)
  - [Create a configure baker transaction](#create-a-configure-baker-transaction)
  - [Create a credential for an existing account](#create-a-credential-for-an-existing-account)
  - [Create an update credentials transaction](#create-an-update-credentials-transaction)
  - [Deploy module](#deploy-module)
  - [Init Contract (parameterless smart contract)](#init-contract-parameterless-smart-contract)
  - [Update Contract (parameterless smart contract)](#update-contract-parameterless-smart-contract)
  - [Smart contract with parameters](#smart-contract-with-parameters)
  - [Serialize parameters with only the specific type's schema](#serialize-parameters-with-only-the-specific-types-schema)
<!--toc:end-->

## Constructing transactions

### Create a simple transfer with or without memo

The following example demonstrates how a simple transfer can be created.

{@codeblock ~~:common/simpleTransfer.ts#documentation-snippet}

### Create a Register data transaction

The following example demonstrates how a register data transaction can
be created.

```ts
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

### Create a configure delegation transaction

The following example demonstrates how a configure delegation transaction
can be created. Note that although all the fields are optional, they are
all required, when becoming a delegator.

{@codeblock ~~:common/delegationAdd.ts#documentation-snippet}

### Create a configure baker transaction

The following example demonstrates how a configure baker transaction can
be created.  Note that although all the fields are optional, they are all
required, when registering as a baker.

{@codeblock ~~:common/bakerAdd.ts#documentation-snippet}

The open for delegation field determines the baker pools status and can have
three different values:

- `OpenForAll`:
    New delegators can join the pool.
- `ClosedForAll`:
    New delegators won't be able to join the pool, but the current delegators
    won't be moved to passive delegation.
- `ClosedForNew`:
    New delegators won't be able to join the pool, and the current delegators
    will be moved to passive delegation.

The three commission rates should specified in parts per hundred thousand,
i.e. 100% is 100000 and 1% 1000. Additionally they value should be within
the allowed range.  The allowed ranges are part of the chain parameters.

### Create a credential for an existing account

The following example demonstrates how to create a credential for an existing
account. This credential can then be deployed onto the account by the account
owner with an update credentials transaction. See [Create an update credentials
transaction](#create-an-update-credentials-transaction) for how to create this
transaction payload using the output from the example below:

<!-- TODO: Recreate documentation for `Construct IdentityInput` -->

```ts
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

### Create an update credentials transaction

The following demonstrates how to construct an update credentials transaction,
which is used to deploy additional credentials to an account, remove existing
credentials on the account or to update the credential threshold on the
account. Note that the initial credential with index 0 cannot be removed.

```ts
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

### Deploy module

The following example demonstrates how to construct a "deployModule"
transaction, which is used to deploy a smart contract module.

{@codeblock ~~:common/deployModule.ts#documentation-snippet}

### Init Contract (parameterless smart contract)

The following example demonstrates how to initialize a smart contract from
a module, which has already been deployed. The name of the contract "INDBank".

In this example, the contract does not take any parameters, so we can leave
parameters as an empty buffer.

```ts
const contractName = 'INDBank';
const params = Buffer.from([]);
//The amount of energy that can be used for contract execution.
const maxContractExecutionEnergy = 300000n;
```

Create init contract transaction

```ts
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

Finally, to actually initialize the contract on the chain,
send the constructed `initContractTransaction` to the chain using
`sendAccountTransaction`. (See [Create a simple transfer with or without
memo](#create-a-simple-transfer-with-or-without-memo) for how to do this)

### Update Contract (parameterless smart contract)

The following example demonstrates how to update a smart contract.

To update a smart contract we create a 'updateContractTransaction'.  To do
this we need to specify the name of the receive function, which should contain
the contract name as a prefix (So if the contract has the name "INDBank"
and the receive function has the name "insertAmount" then the receiveName
should be "INDBank.insertAmount").

We also need to supply the contract address of the contract instance. This
consists of an index and a subindex.

In this example, the contract does not take any parameters, so we can leave
the parameters/message as an empty buffer.

```ts
const receiveName = 'INDBank.insertAmount';
const message = Buffer.from([]);
const contractAddress = { index: BigInt(83), subindex: BigInt(0) } as ContractAddress;
//The amount of energy that can be used for contract execution.
const maxContractExecutionEnergy = 30000n;
```

Create update contract transaction

```ts
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

Finally, to actually update the contract on the chain, send the constructed
`updateContractTransaction` to the chain using `sendAccountTransaction`. (See
[Create a simple transfer with or without
memo](#create-a-simple-transfer-with-or-without-memo) for how to do this)

### Smart contract with parameters

In the previous sections we have seen how to initialize and update
contracts without parameters. In this section we will describe
how to initialize and update contracts with parameters. The user
should provide the input in the JSON format specified in [our
documentation](https://developer.concordium.software/en/mainnet/smart-contracts/references/schema-json.html).

Let us consider the following example where the contract's initialization
parameter is the following structure:

```rust
    #[derive(SchemaType, Serialize)]
    struct MyStruct {
        age: u16,
        name: String,
        city: String,
    }
```

An example of a valid input would be:

```ts
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

```ts
    const userInput = {
        B: [
          {
            D: []
          }
        ]
      };
```

Then the user needs to provide the schema for the module. Here we load the
schema from a file:

```ts
    const rawModuleSchema = Buffer.from(fs.readFileSync(
        'SCHEMA-FILE-PATH'
    ));
```

Then the parameters can be serialized into bytes:

```ts
    const inputParams = serializeInitContractParameters(
        "my-contract-name",
        userInput,
        rawModuleSchema,
        schemaVersion
    );
```

For V0 contracts the schemaVersion should be `SchemaVersion.V0`. For V1
contracts it should currently be `SchemaVersion.V1`, unless the contract have
been built using cargo-concordium >=2.0.0, which are internally versioned,
and then the version does not need to be provided.

Then the payload and transaction can be constructed, in the same way as the
parameterless example:

```ts
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

Finally, to actually initialize the contract on the chain, send the constructed
`initContractTransaction` to the chain using `sendAccountTransaction`. (See
[Create a simple transfer with or without
memo](#create-a-simple-transfer-with-or-without-memo) for how to do this)

To update a contract with parameters, consider the example where the input
is an i64 value, like -2000000.

```ts
    const userInput = -2000000;
    const contractName = "my-contract-name";
    const receiveFunctionName = "my-receive-function-name";
    const receiveName = contractName + '.' + receiveFunctionName;
```

Then the user need to provide the schema. Here we load the schema from a file:

```ts
    const rawModuleSchema = Buffer.from(fs.readFileSync(
        'SCHEMA-FILE-PATH'
    ));
```

Then the parameters can be serialized into bytes:

```ts
    const inputParams = serializeUpdateContractParameters(
            contractName,
            receiveFunctionName,
            userInput,
            rawModuleSchema,
            schemaVersion
    );
```

For V0 contracts the schema version should be `SchemaVersion.V0`. For V1
contracts it should currently be `SchemaVersion.V1`, unless the contract have
been built using cargo-concordium >=2.0.0, which are internally versioned,
and then the version does not need to be provided.

Then we will construct the update payload with parameters obtained

```ts
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

Finally, to actually update the contract on the chain, send
the constructed `updateContractTransaction` to the chain using
`sendAccountTransaction`. (See [Create a simple transfer with or without
memo](#create-a-simple-transfer-with-or-without-memo) for how to do this)

### Serialize parameters with only the specific type's schema

In the previous section the schema used was assumed to be the schema for an
entire module. In some cases one might want to use a schema containing only
the specific type of the parameter.

For this, the function `serializeTypeValue` can used.

```ts
    const inputParams = serializeTypeValue(userInput, rawTypeSchema);
```

For reference, the type schema for parameters can be extracted
using the functions `getInitContractParameterSchema` and
`getUpdateContractParameterSchema`. For a receive function:

```ts
    const rawTypeSchema = getUpdateContractParameterSchema(
            rawModuleSchema,
            contractName,
            receiveFunctionName,
            schemaVersion
    )
```

And for the initialization:

```ts
    const rawTypeSchema = getInitContractParameterSchema(
            rawModuleSchema,
            contractName,
            schemaVersion
    )
```
