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
const blockStream: AsyncIterable<ArrivedBlockInfo> = client.getBlocks();

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
const blockStream: AsyncIterable<ArrivedBlockInfo> = client.getBlocks(ac.signal);

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
const blockStream: AsyncIterable<FinalizedBlockInfo> = client.getFinalizedBlocks();

// Prints blocks infinitely
for await (const block of blockStream) {
    console.log(block)
}
```

Likewise, you can also pass it an `AbortSignal`:

```js
// Create abort controller and block stream
const ac = new AbortController();
const blockStream: AsyncIterable<FinalizedBlockInfo>  = client.getFinalizedBlocks(ac.signal);

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
const transactionHash: HexString = await client.sendAccountTransaction(
    someTransaction,
    signature
);

const blockHash: HexString = await client.waitForTransactionFinalization(
    transactionHash
);
```

### getAccountList
Retrieves the accounts that exists a the end of a given block as an async iterable.

If a blockhash is not supplied it will pick the latest finalized block. An optional abortSignal can also be provided that closes the stream.

```js
const blockHash = 'fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e';
const accounts: AsyncIterable<Base58String> = client.getAccountList(blockHash);

// Prints accounts
for await (const account of accounts) {
    console.log(account);
}
```

### getModuleList
Retrieves all smart contract modules, as an async iterable, that exists in the state at the end of a given block.

If a blockhash is not supplied it will pick the latest finalized block. An optional abortSignal can also be provided that closes the stream.

```js
const blockHash = 'fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e';
const moduleRefs: AsyncIterable<HexString> = client.getModuleList(blockHash);

// Prints module references
for await (const moduleRef of moduleRefs) {
    console.log(moduleRef);
}
```

### getAncestors
Retrieves all smart contract modules that exists in the state at the end of a given block, as an async iterable of hex strings. A bigint representing the max number of ancestors to get must be provided.

If a blockhash is not supplied it will pick the latest finalized block. An optional abortSignal can also be provided that closes the stream.

```js
const maxNumberOfAncestors = 100n;
const blockHash = 'fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e';
const ancestors: AsyncIterable<HexString> = client.getAncestors(blockHash);

// Prints ancestors
for await (const ancestor of ancestors) {
    console.log(ancestor);
}
```

### getInstanceState
Get the exact state of a specific contract instance, streamed as a list of hex string key-value pairs.

If a blockhash is not supplied it will pick the latest finalized block. An optional abortSignal can also be provided that closes the stream.

```js
const contractAddress = {
    index: 602n,
    subindex: 0n,
};
const blockHash = 'fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e';
const states: AsyncIterable<InstanceStateKVPair> = client.getInstanceState(blockHash);

// Prints instance state key-value pairs
for await (const state of states) {
    console.log('key:', state.key);
    console.log('value:', state.value);
}
```

### instanceStateLookup
Get the value at a specific key of a contract state as a hex string.

In contrast to `GetInstanceState` this is more efficient, but requires the user to know the specific key to look for.

If a blockhash is not supplied it will pick the latest finalized block.

```js
const contract = {
    index: 601n,
    subindex: 0n,
};
const key = '0000000000000000';
const blockHash = 'fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e'

const state: HexString = await client.instanceStateLookup(blockHash);
...
```

### getIdentityProviders
Get the identity providers registered as of the end of a given block as a stream

If a blockhash is not supplied it will pick the latest finalized block. An optional abortSignal can also be provided that closes the stream.

```js
const blockHash = "7f7409679e53875567e2ae812c9fcefe90ced8961d08554756f42bf268a42749";
const ips: AsyncIterable<IpInfo> = client.getIdentityProviders(blockHash);

for await (const ip of ips) {
    console.log(ip.ipDescription);
}
```

## getAnonymityRevokers
Get the anonymity revokers registered as of the end of a given block as a stream.

If a blockhash is not supplied it will pick the latest finalized block. An optional abortSignal can also be provided that closes the stream.
```js
const blockHash = "7f7409679e53875567e2ae812c9fcefe90ced8961d08554756f42bf268a42749";
const ars: AsyncIterable<IpInfo> = client.getAnonymityRevokers(blockHash);

for await (const ar of ars) {
    console.log(ar.ipDescription);
}
...
```

## getBlocksAtHeight
Get a list of live blocks at a given height.


It can accept an absolute height:
```js
const blocks: HexString[] = await client.getBlocksAtHeight(100n);
...
```
Or it can accept a relative height:
```js
const request: BlocksAtHeightRequest = {
    // Genesis index to start from.
    genesisIndex: 1;
    // Height starting from the genesis block at the genesis index.
    height: 100n;
    // Whether to return results only from the specified genesis index (`true`),
    // or allow results from more recent genesis indices as well (`false`).
    restrict: true;
}
const blocks: HexString[] = await client.getBlocksAtHeight(request);
```

## getBlockInfo
Retrieves information about a specific block.

If a blockhash is not supplied it will pick the latest finalized block.

```js
const blockHash = "7f7409679e53875567e2ae812c9fcefe90ced8761d08554756f42bf268a42749";
const blockInfo: BlockInfo = await client.getBlockInfo(blockHash);
const transactionsCount = blockInfo.transactionCount;
...
```

## getBakerList
Retrieves a stream of ID's for registered bakers on the network at a specific block.

If a blockhash is not supplied it will pick the latest finalized block. An optional abort signal can also be provided that closes the stream.
```js
const blockHash = "7f7409679e53875567e2ae812c9fcefe90ced8961d08554756f42bf268a42749";
const bakerIds: AsyncIterable<BakerId> = client.getBakerList(blockHash);

for await (const id of bakerIds) {
    console.log(id);
}
...
```

## getPoolDelegators
Get the registered delegators of a given pool at the end of a given block.
In contrast to the `GetPoolDelegatorsRewardPeriod` which returns delegators
that are fixed for the reward period of the block, this endpoint returns the
list of delegators that are registered in the block. Any changes to delegators
are immediately visible in this list.
The stream will end when all the delegators has been returned.

If a blockhash is not supplied it will pick the latest finalized block. An optional abort signal can also be provided that closes the stream.
```js
const blockHash = "fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e";
const delegatorInfoStream: AsyncIterable<DelegatorInfo> = client.getPoolDelegators(15n, blockHash);

for await (const delegatorInfo of delegatorInfoStream) {
    console.log(delegatorInfo);
}
...
```

## getPoolDelegatorsRewardPeriod
Get the fixed delegators of a given pool for the reward period of the given block.
In contracts to the `GetPoolDelegators` which returns delegators registered
for the given block, this endpoint returns the fixed delegators contributing
stake in the reward period containing the given block.
The stream will end when all the delegators has been returned.

If a blockhash is not supplied it will pick the latest finalized block. An optional abort signal can also be provided that closes the stream.
```js
const blockHash = "fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e";
const delegatorInfoStream: AsyncIterable<DelegatorRewardPeriodInfo> = client.getPoolDelegatorsRewardPeriod(15n, blockHash);

for await (const delegatorInfo of delegatorInfoStream) {
    console.log(delegatorInfo);
}
...
```

## getPassiveDelegators
Get the registered passive delegators at the end of a given block.
In contrast to the `GetPassiveDelegatorsRewardPeriod` which returns delegators
that are fixed for the reward period of the block, this endpoint returns the
list of delegators that are registered in the block. Any changes to delegators
are immediately visible in this list.
The stream will end when all the delegators has been returned.

If a blockhash is not supplied it will pick the latest finalized block. An optional abort signal can also be provided that closes the stream.
```js
const blockHash = "fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e";
const delegatorInfoStream: AsyncIterable<DelegatorInfo> = client.getPassiveDelegators(blockHash);

for await (const delegatorInfo of delegatorInfoStream) {
    console.log(delegatorInfo);
}
...
```

## getPassiveDelegatorsRewardPeriod
Get the fixed passive delegators for the reward period of the given block.
In contracts to the `GetPassiveDelegators` which returns delegators registered
for the given block, this endpoint returns the fixed delegators contributing
stake in the reward period containing the given block.
The stream will end when all the delegators has been returned.

If a blockhash is not supplied it will pick the latest finalized block. An optional abort signal can also be provided that closes the stream.
```js
const blockHash = "fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e";
const delegatorInfoStream: AsyncIterable<DelegatorRewardPeriodInfo> = client.getPassiveDelegatorsRewardPeriod(blockHash);

for await (const delegatorInfo of delegatorInfoStream) {
    console.log(delegatorInfo);
}
...
```

## getBranches
Get the current branches of blocks starting from and including the last finalized block.
```js
const branch: Branch = await client.getBranches();

console.log(branch.blockhash);
console.log(branch.children);
...
```

## getElectionInfo
Get information related to the baker election for a particular block.

If a blockhash is not supplied it will pick the latest finalized block.

```js
const blockHash = "fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e";
const electionInfo: ElectionInfo = await client.getElectionInfo(blockHash);

console.log(electionInfo.electionDifficulty);
console.log(electionInfo.electionNonce);
for (const bakerElectionInfo of electionInfo.bakerElectionInfo) {
    console.log(bakerElectionInfo.baker);
    console.log(bakerElectionInfo.account);
    console.log(bakerElectionInfo.lotteryPower);
}
```

## getAccountNonFinalizedTransactions
Get a list of non-finalized transaction hashes for a given account. This
endpoint is not expected to return a large amount of data in most cases,
but in bad network condtions it might. The stream will end when all the
non-finalized transaction hashes have been returned.

An optional abort signal can also be provided that closes the stream.

```js
const accountAddress = new AccountAddress('3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G');
const transactions: AsyncIterable<HexString> = client.getAccountNonFinalizedTransactions(accountAddress);

for await (const transaction of transactions) {
    console.log(transaction);
}
```

## getBlockTransactionEvents

Get a list of transaction events in a given block.
The stream will end when all the transaction events for a given block have been returned.

An optional abort signal can also be provided that closes the stream.

```js
const blockHash = "fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e";
const transactionEvents: AsyncIterable<BlockItemSummary> = client.getBlockTransactionEvents(blockHash);

for await (const transactionEvent of transactionEvents) {
    console.log(transactionEvent);
}
```

## getNextUpdateSequenceNumbers
Get next available sequence numbers for updating chain parameters after a given block.
```js
const blockHash = "fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e";
const seqNums: NextUpdateSequenceNumbers = await client.NextUpdateSequenceNumbers(accountAddress);
```
