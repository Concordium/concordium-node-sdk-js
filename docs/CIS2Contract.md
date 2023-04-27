# CIS-2 contract

This document describes the helper class for working with CIS-2 contracts

**Table of Contents**

- [CIS2Contract](#cis2contract)
    - [Creating a CIS2Contract](#creating-a-cis2contract)
    - [Transfer token(s)](#transfer-tokens)
    - [Operator update(s)](#operator-updates)
    - [Querying for balance of token(s)](#querying-for-balance-of-tokens)
    - [Querying for operator of](#querying-for-operator-of)
    - [Querying for token metadata](#querying-for-token-metadata)
    - [Performing dry-run invocations of contract updates](#performing-dry-run-invocations-of-contract-updates)

# CIS2Contract

The CIS2Contract class wraps the [ConcordiumNodeClient]('./gRPC.md'), defining an interface matching the [CIS-2 standard](https://proposals.concordium.software/CIS/cis-2.html).

## Creating a CIS2Contract
The contract relies on a `ConcordiumNodeClient` instance to communicate with the node along with a contract address of the CIS-2 contract to invoke functions on.

```js
const contractAddress = {index: 1234n, subindex: 0n};
const contract = await CIS2Contract.create(nodeClient, contractAddress); // Implied that you already have a `ConcordiumNodeClient` instance of some form.
```

This gets the relevant contract information from the node and checks that the contract is in fact a CIS-2 contract, hence why it is async. You can also instantiate using the `new` keyword, circumventing standard checks:

```js
const contract = new CIS2Contract(nodeClient, contractAddress, 'my_contract_name');
```

## Transfer token(s)
The following example demonstrates how to send either a single/list of CIS-2 "transfer" transactions using a `CIS2Contract` instance. There are two different approaches to this. Which one suits you better, will likely depend on your runtime environment as one is most suited for use on a server, while the other is most suited for use in a client.

See the signing a transaction section for the [common package](../packages/common/README.md#sign-an-account-transaction) for create an `AccountSigner`.

### Using an `AccountSigner`.
This relies on using private keys for the sender account to sign the transaction before submitting to the node.

```js
const tokenId = ''; // HEX string representing a token ID defined in the contract.
const from = '4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd';
const to = '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB'; // An account receiver.
// const to = {address: {index: 1234n, subindex: 0n}, hookName: 'someReceiveHookName'} // A contract receiver can be specified as such.
const tokenAmount = 100n;

const signer: AccountSigner = ...; // Relies on using private keys of sender account.
const update = { from, to, tokenAmount, tokenId };
// const update [{ from, to, tokenAmount, tokenId }, { from, to, tokenAmount, tokenId }] // Example of batch update.

const txHash = await contract.transfer(
    {
        senderAddress: from,
        energy: 10000n,
    },
    update,
    signer
);
```

### Using a function for processing the transaction.
This delegates processing the transaction to a callback function. Typically, this function would submit the transaction through a Concordium compatible wallet, which handles signing and submitting.

```js
const tokenId = ''; // HEX string representing a token ID defined in the contract.
const from = '4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd';
const to = '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB'; // An account receiver.
// const to = {address: {index: 1234n, subindex: 0n}, hookName: 'someReceiveHookName'} // A contract receiver can be specified as such.
const tokenAmount = 100n;

const update = { from, to, tokenAmount, tokenId };
// const update [{ from, to, tokenAmount, tokenId }, { from, to, tokenAmount, tokenId }] // Example of batch update.

const txHash = await contract.transfer(
    { energy: 10000n },
    update,
    ({
        type, // The transaction type.
        payload, // The transaction payload
        parameter: {
            json, // The parameter to be supplied to the contract receive function in JSON format.
            hex, // The parameter to be supplied to the contract receive function as a hex encoded string
        },
        schema: {
            value, // The contract schema for the parameter. This is needed to translate the JSON format to a byte array.
            type, // The type of the schema. This is always 'parameter', meaning it can be used for the JSON formatted parameter only.
        }
    }) => {
        // Do something with the transaction details
    }
);
```

## Operator update(s)
The following example demonstrates how to send either a single/list of CIS-2 "updateOperator" transactions using a `CIS2Contract` instance. There are two different approaches to this. Which one suits you better, will likely depend on your runtime environment as one is most suited for use on a server, while the other is most suited for use in a client.

See the signing a transaction section for the [common package](../packages/common/README.md#sign-an-account-transaction) for create an `AccountSigner`.

### Using an `AccountSigner`.
This relies on using private keys for the sender account to sign the transaction before submitting to the node.

```js
const owner = '4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd';
const type = 'add'; // or 'remove';
const address = '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB'; // Address to add as operator of owner
// const address = {index: 1234n, 0n}; // Example of contract address operator.

const signer: AccountSigner = ...; // Relies on using private keys of sender account.
const update = { type, address };
// const update [{type, address}, {type, address}] // Example of batch update.

const txHash = await contract.updateOperator(
    {
        senderAddress: owner,
        energy: 10000n,
    },
    update,
    signer
);
```

### Using a function for processing the transaction.
This delegates processing the transaction to a callback function. Typically, this function would submit the transaction through a Concordium compatible wallet, which handles signing and submitting.

```js
const owner = '4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd';
const type = 'add'; // or 'remove';
const address = '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB'; // Address to add as operator of owner
// const address = {index: 1234n, 0n}; // Example of contract address operator.

const update = { type, address };
// const update [{type, address}, {type, address}] // Example of batch update.

const txHash = await contract.updateOperator(
    { energy: 10000n },
    update,
    ({
        type, // The transaction type.
        payload, // The transaction payload
        parameter: {
            json, // The parameter to be supplied to the contract receive function in JSON format.
            hex, // The parameter to be supplied to the contract receive function as a hex encoded string
        },
        schema: {
            value, // The contract schema for the parameter. This is needed to translate the JSON format to a byte array.
            type, // The type of the schema. This is always 'parameter', meaning it can be used for the JSON formatted parameter only.
        }
    }) => {
        // Do something with the transaction details
    }
);
```

## Querying for balance of token(s)
The following example demonstrates how to send either a single/list of CIS-2 "balanceOf" queries using a `CIS2Contract` instance. The response for the query will be either a single/list of bigint balances corresponding to the queries.

```js
const tokenId = ''; // HEX string representing a token ID defined in the contract.
const address = '4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd';

const query = { address, tokenId };
const balance = await contract.balanceOf(query);

// List of queries
const query1 = { address, tokenId };
const query2 = { address, tokenId };
const query3 = { address, tokenId };

const [balance1, balance2, balance3] = await contract.balanceOf([query1, query2, query3]);
```

## Querying for operator of
The following example demonstrates how to send either a single/list of CIS-2 "operatorOf" queries using a `CIS2Contract` instance. The response for the query will be either a single/list of boolean values corresponding to the queries, each signaling whether the specified `address` is an operator of the specified `owner`.

```js
const owner = '4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd';
const address = '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB'; // Address to check if operator of owner
// const address = {index: 1234n, 0n}; // Example of contract address operator.

const query = { owner, address };

const isOperator = await contract.operatorOf(query);

// List of queries
const query1 = { owner, address };
const query2 = { owner, address };
const query3 = { owner, address };

const [isOperator1, isOperator2, isOperator3] = await contract.isOperatorOf([query1, query2, query3]);
```

## Querying for token metadata
The following example demonstrates how to send either a single/list of CIS-2 "tokenMetadata" queries using a `CIS2Contract` instance. The response for the query will be either a single/list of `MetadataUrl` objects corresponding to the queries.

To get the actual metadata JSON for the contract, a subsequent request to the URL returned would have to be made.

```js
const tokenId = ''; // HEX string representing a token ID defined in the contract.
const metadataUrl = await contract.tokenMetadata(tokenId);

// List of queries
const tokenId1 = '00';
const tokenId2 = '01';
const tokenId3 = '02';

const [metadataUrl1, metadataUrl2, metadataUrl3] = await contract.tokenMetadata([tokenId1, tokenId2, tokenId3]);
```

## Performing dry-run invocations of contract updates
It can be useful to perform a dry-run of contract updates sent, as it allows you to see the result of the update without actually performing (and the user paying for) it.
One common use case is to check the energy needed to execute the update which can be translated to a cost in CCD.

### Token transfer(s) dry-run
The following example demonstrates how to perform a dry-run of CIS-2 "transfer" with either a single/list of transfers using a `CIS2Contract` instance. The response will be an object containing information about the function invocation.

```js
const tokenId = ''; // HEX string representing a token ID defined in the contract.
const from = '4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd';
const to = '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB'; // An account receiver.
// const to = {address: {index: 1234n, subindex: 0n}, hookName: 'someReceiveHookName'} // A contract receiver can be specified as such.
const tokenAmount = 100n;

const update = { from, to, tokenAmount, tokenId };
// const update [{ from, to, tokenAmount, tokenId }, { from, to, tokenAmount, tokenId }] // Example of batch update.

const result = await contract.dryRun.transfer(from, update);

```

### Operator updates(s) dry-run
The following example demonstrates how to perform a dry-run of CIS-2 "updateOperator" with either a single/list of updates using a `CIS2Contract` instance. The response will be an object containing information about the function invocation.

```js
const owner = '4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd';
const type = 'add'; // or 'remove';
const address = '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB'; // Address to add as operator of owner
// const address = {index: 1234n, 0n}; // Example of contract address operator.

const update = { type, address };
// const update [{type, address}, {type, address}] // Example of batch update.

const result = await contract.dryRun.updateOperator(from, update);

```
