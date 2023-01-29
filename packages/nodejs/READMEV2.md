# Concordium Nodejs SDK

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.0-4baaaa.svg)](https://github.com/Concordium/.github/blob/main/.github/CODE_OF_CONDUCT.md)

Wrappers for interacting with the Concordium node, using nodejs.

[Note that this package contains and exports the functions from the common-sdk, check the readme of that package for an overview of those](../common/README.md).

**Table of Contents**
- [ConcordiumNodeClient](#concordiumnodeclient)
    - [Creating a client](#creating-a-client)
    - [Send Account Transaction](#send-account-transaction)
    - [Create a new account](#create-a-new-account)
    - [getAccountInfo](#getaccountinfo)
    - [getNextAccountSequenceNumber](#getnextaccountsequencenumber)
    - [getBlockItemStatus](#getblockitemstatus)
    - [getConsensusStatus](#getconsensusstatus)
    - [getCryptographicParameters](#getcryptographicparameters)
    - [getInstanceInfo](#getinstanceinfo)
    - [invokeContract](#invokecontract)
    - [getModuleSource](#getModuleSource)

# ConcordiumNodeClient

The ConcordiumNodeClient defines the interface to be used to send and receive data from
a concordium-node.

## Creating a client
Connection to a node can be done using either an insecure connection or a TLS connection. If the node that you are trying to connect to supports TLS, you can create a TLS connection in the following way:

```js
import { credentials, Metadata } from "@grpc/grpc-js";
import { ConcordiumNodeClient } from "@concordium/node-sdk";

const metadata = new Metadata();
metadata.add("authentication", "rpcadmin");

const client = new ConcordiumNodeClient(
    "127.0.0.1",    // ip address
    10000,          // port
    credentials.createSsl(),
    metadata,
    15000           // timeout in ms
);
```

The access is controlled by the credentials and the metadata. If the node does not support TLS an insecure connection can be established using `credentials.createInsecure()` instead of `credentials.createSsl()`.

## Send Account Transaction
The following example demonstrates how to send any account transaction.

See the Constructing transactions section for the [common package](../common#constructing-transactions) for how to create an account transaction.
See the signing a transaction section for the [common package](../common#sign-an-account-transaction) for how to sign an account transaction.

```js

let accountTransaction: AccountTransaction;
// Create the transaction
// ...

let signatures: AccountTransactionSignature;
// Sign the transaction
// ...

// Send the transaction to the node, throws on rejection.
const transactionHash = await client.sendAccountTransaction(accountTransaction, signatures);

// Check the status of the transaction. Should be checked with an appropriate interval,
// as it will take some time for the transaction to be processed.
const transactionStatus = await client.getBlockItemStatus(transactionHash);
```

## Create a new account
**TODO**

## getAccountInfo
Retrieves information about an account. The function must be provided an account address or a credential registration id.
If a credential registration id is provided, then the node returns the information of the account,
which the corresponding credential is (or was) deployed to.
If there is no account that matches the address or credential id at the provided
block, then undefined will be returned.
```js
const accountAddress = new AccountAddress('3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G');
const blockHash = 'fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e';
const accountInfo: AccountInfo = await client.getAccountInfo(accountAddress, blockHash);
const amount: bigint = accountInfo.amount;
```

## getNextAccountSequenceNumber
Retrieves the next account sequence number, i.e. the number that must be set in the account transaction
header for the next transaction submitted by that account. Along with the sequence number there is a boolean
that indicates whether all transactions are finalized. If this is true, then the sequence number is reliable,
if not then the next sequence number might be off.
```js
const accountAddress = new AccountAddress('3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G');
const nextAccountSequenceNumber: NextAccountNonce = await client.getNextAccountNonce(accountAddress);
const sequenceNumber: bigint = nextAccountsequenceNumber.nonce;
const allFinal: boolean = nextAccountSequenceNumber.allFinal;
if (allFinal) {
    // nonce is reliable
}
```

## getBlockItemStatus
Retrieves status information about a block item (transaction).
```js
const transactionHash = 'f1f5f966e36b95d5474e6b85b85c273c81bac347c38621a0d8fefe68b69a430f';
const blockItemStatus: BlockItemStatus = await client.getBlockItemStatus(transactionHash);
const isFinalized = transactionStatus.status === 'finalized';
...
```
Note that there will be no outcomes for a transaction that has only been received:
```js
if (blockItemStatus.status === 'received') {
    // blockItemStatus.status.received will be empty
}
```
If the transaction has been finalized, then there is exactly one outcome:
```js
if (blockItemStatus.status === 'finalized') {
    const outcome  = blockItemStatus.outcome;
    // Only one outcome
}
```
If the transaction has only been committed, then there is a list of outcomes:
```js
if (blockItemStatus.status === 'finalized') {
    const outcomes = blockItemStatus.outcomes;
    // Potentially multiple outcomes
}
```
The outcome is contains the blockHash and the summary of the block item. The summary can be of three different types, `accountTransaction`, `accountCreation` or `UpdateTransaction`, which is denoted by the type field.
```js
const {blockHash, summary} = outcome.blockHash;
const type = summary.type;
if (type === 'accountTransaction') {
    // The block item is an account transaction
    const transactionType = summary.transactionType;
    switch (transactionType) {
        case 'transfer':
            // the transaction is a simple transfer
        ...
        case undefined:
            // the transaction was rejected, in which case the transaction type is still available under the failedTransactionType field
            { failedTransactionType, rejectReason } = summary
    }
} else if (type === 'updateTransaction') {
    // The block item is a chain update
    const { effectiveTime, payload } = summary
} else {
    // The block item is an account creation
    const { address, credentialType, regId } = summary

```

## getConsensusStatus
Retrieves the current consensus info from the node.
```js
const consensusInfo: ConsensusStatus = await client.getConsensusStatus();
const bestBlock = consensusInfo.bestBlock;
...
```

## getCryptographicParameters
Retrieves the global cryptographic parameters for the blockchain at a specific block.
These are a required input for e.g. creating credentials.
```js
const blockHash = 'fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e';
const cryptographicParameters: CryptographicParameters = await client.getCryptographicParameters(blockHash);
...
```

## getInstanceInfo
Used to get information about a specific contract instance, at a specific block.

```js
const blockHash = 'fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e';
const contractAddress: ContractAddress = { index: 1n, subindex: 0n };

const instanceInfo: InstanceInfo = await client.getInstanceInfo(contractAddress, blockHash);
const name = instanceInfo.name;
...
```

## invokeContract
Used to simulate a contract update, and to trigger view functions.

```js
const blockHash = 'fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e';
const invoker = new AccountAddress('3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G');
const context: ContractContext = {
    invoker: invoker,
    contract: {
        index: 6n,
        subindex: 0n,
    },
    method: 'PiggyBank.smash',
    amount: new v1.CcdAmount(0n),
    parameter: undefined,
    energy: 30000n,
},

const result = await client.invokeContract(
    context,
    blockHash,
);

if (result.tag === 'failure') {
    // Invoke was unsuccesful
    const rejectReason = result.reason; // Describes why the update failed;
    ...
} else if (result.tag === 'success') {
    const events = result.effects; // a list of effects that the update would have
    const returnValue = result.returnValue; // If the invoked method has return value
    ...
}
```

Note that some of the parts of the context are optional:
 - blockHash: defaults to last finalized block

## getModuleSource
This commands gets the source of a module on the chain.

Note that this returns the raw bytes of the source, as a Uint8Array.
```js
const blockHash = 'fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e';
const moduleRef = '7e8398adc406a97db4d869c3fd7adc813a3183667a3a7db078ebae6f7dce5f64';
const source = await client.getModuleSource(moduleReference, blockHash);
```

## getBlocks
Returns a stream of blocks that is iterable. The following code will recieved blocks
as long as there is a connection to the node:

```js
// Create stream
const blockStream = client.getBlocks();

// Prints blocks infinitely
for await (const block of blockStream) {
    console.log(block)
}
```

You can pass it an abort signal to close the connection. This is particurlary useful for this
function as it otherwise continues forever. An example of how to use `AbortSignal` can be seen below:

```js
// Create abort controller and block stream
const ac = new AbortController();
const blockStream = client.getBlocks(ac.signal);

// Only get one item then break
for await (const block of blockStream) {
    console.log(block)
    break
}

// Closes the stream
ac.abort();
```

## getFinalizedBlocks
Works exactly like `getBlocks()` but only returns finalized blocks:

```js
// Create stream
const blockStream = client.getFinalizedBlocks();

// Prints blocks infinitely
for await (const block of blockStream) {
    console.log(block)
}
```

Likewise, you can also pass it an `AbortSignal`:

```js
// Create abort controller and block stream
const ac = new AbortController();
const blockStream = client.getFinalizedBlocks(ac.signal);

// Only get one item then break
for await (const block of blockStream) {
    console.log(block)
    break
}

// Closes the stream
ac.abort();
```

### waitForTransactionFinalization
This function waits for the given transaction hash (given as a hex string) to finalize and then returns
the blockhash of the block that contains given transaction as a hex string.

```js
const transactionHash = await client.sendAccountTransaction(
    someTransaction,
    signature
);

const blockHash = await client.waitForTransactionFinalization(
    transactionHash
);
```