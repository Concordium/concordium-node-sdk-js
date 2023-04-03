# Concordium gRPC client

This document describes the different endpoints for the concordium gRPC V2 client. 

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
    - [getBlockChainParameters](#getblockchainparameters)
    - [getPoolInfo](#getpoolinfo)
    - [getPassiveDelegationInfo](#getpassivedelegationinfo)
    - [getTokenomicsInfo](#gettokenomicsinfo)
    - [getInstanceInfo](#getinstanceinfo)
    - [invokeContract](#invokecontract)
    - [getModuleSource](#getmodulesource)
    - [getBlocks](#getblocks)
    - [getFinalizedBlocks](#getfinalizedblocks)
    - [waitForTransactionFinalization](#waitfortransactionfinalization)
    - [getAccountList](#getaccountlist)
    - [getModuleList](#getmodulelist)
    - [getAncestors](#getancestors)
    - [getInstanceState](#getinstancestate)
    - [instanceStateLookup](#instancestatelookup)
    - [getIdentityProviders](#getidentityproviders)
    - [getAnonymityRevokers](#getanonymityrevokers)
    - [getBlocksAtHeight](#getblocksatheight)
    - [getBlockInfo](#getblockinfo)
    - [getBakerList](#getbakerlist)
    - [getPoolDelegators](#getpooldelegators)
    - [getPoolDelegatorsRewardPeriod](#getpooldelegatorsrewardperiod)
    - [getPassiveDelegators](#getpassivedelegators)
    - [getPassiveDelegatorsRewardPeriod](#getpassivedelegatorsrewardperiod)
    - [getBranches](#getbranches)
    - [getElectionInfo](#getelectioninfo)
    - [getAccountNonFinalizedTransactions](#getaccountnonfinalizedtransactions)
    - [getBlockTransactionEvents](#getblocktransactionevents)
    - [getNextUpdateSequenceNumbers](#getnextupdatesequencenumbers)
    - [shutdown](#shutdown)
    - [peerConnect](#peerconnect)
    - [peerDisconnect](#peerdisconnect)
    - [getBannedPeers](#getbannedpeers)
    - [banPeer](#banpeer)
    - [unbanPeer](#unbanpeer)
    - [dumpStart](#dumpstart)
    - [dumpStop](#dumpstop)
    - [getNodeInfo](#getnodeinfo)
    - [getPeersInfo](#getpeersinfo)
    - [getBlockSpecialEvents](#getblockspecialevents)
    - [getBlockPendingUpdates](#getblockpendingupdates)
    - [getBlockFinalizationSummary](#getblockfinalizationsummary)

# ConcordiumNodeClient

The ConcordiumNodeClient defines the interface to be used to send and receive data from
a concordium-node.

## Creating a client
The client requires an appropriate transport. However the web-sdk and node-sdk each exposes a helper function `createConcordiumClient` that creates a client using the appropriate transport (gRPC-web for web and regular gRPC for nodeJS).
Please refer the the [node-sdk](../packages/nodejs/README.md#concordiumnodeclient) or [web-sdk's](../packages/web/README.md#concordiumnodeclient)  README's to see how to use those functions.

## Send Account Transaction
The following example demonstrates how to send any account transaction.

See the Constructing transactions section for the [common package](../packages/common/README.md#constructing-transactions) for how to create an account transaction.
See the signing a transaction section for the [common package](../packages/common/README.md#sign-an-account-transaction) for how to sign an account transaction.

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
To create a new account the following is needed:
-    idObject: Identity object for the identity that should be used to create the credential
-    ipInfo: The information of the identity provider used for the identity. (See `getIdentityProviders`)
-    globalContext: The cryptographic parameters for the block chain (See `getCryptographicParameters`)
-    arsInfos: The information of all the anonymity revokers used for the identity (See `getAnonymityRevokers`) 
-    revealedAttributes: A list of attributes that should be revealed. Note that this can be left empty.
-    credNumber: The index of the credential for the identity. This is used to create the credential id, and cannot be reused for the same identity.

If you can provide the seedPhrase used for the identity, use `createCredentialTransaction`, which uses that and the identity index and network identitfier.
Otherwise you can use `createCredentialTransactionNoSeed`, which requires the:
  -  idCredSec
  -  prfKey
  -  signature retrievel randomness
  -  credential public keys
  -  list of attribute randomness
All of which should be generated from the seedPhrase. Note that the purpose of this alternative is to support cases where the seed phrase is not directly available.

The credentialDeployment can be signed with the `signCredentialTransaction` function if the signing key is available, otherwise the digest can be retrieved by using the `getCredentialDeploymentSignDigest` function.

The following example helps demonstrate how to create a credential deployment using a seed:

```js
const cryptographicParameters = await client.getCryptographicParameters();
if (!cryptographicParameters) {
    throw new Error('Cryptographic parameters were not found on a block that has been finalized.');
}

// The identityObject obtained from identity issuance.
const identityObject = ...

// The attributes to reveal about the account holder on chain. This can be empty
const revealedAttributes: AttributeKey[] = ['firstName', 'nationality'];

const seedAsHex = 'efa5e27326f8fa0902e647b52449bf335b7b605adc387015ec903f41d95080eb71361cbc7fb78721dcd4f3926a337340aa1406df83332c44c1cdcfe100603860';
const net = 'Mainnet'; // use 'Testnet' for the testnet.

// Information about the identity provider (Can be retrieved with getIdentityProviders)
// Should be the IpInfo for the identityProvider used for the identity
const ipInfo = ...

// Information about the anonymity revokers (Can be retrieved with getAnonymityRevokers)
// Should be the information for the revokers used for the identity
const arsInfos = ...

// The index used for the identity (on the key derivation path);
const identityIndex = 0;
// The index for the credential (on the key derivation path), should not be reused for the identity.
const credNumber = 0;

const inputs = {
        ipInfo,
        globalContext: cryptographicParameters,
        arsInfos,
        idObject: identityObject,
        revealedAttributes,
        seedAsHex,
        net,
        identityIndex,
        credNumber,
};

const expiry = new TransactionExpiry(new Date(Date.now() + 3600000));
const credentialDeploymentTransaction: CredentialDeploymentTransaction =
    createCredentialTransaction(
        inputs,
        expiry
    );

// the signing key should be generated from the seed used for the identity and credential details
const signingKey = ConcordiumHdWallet.fromHex(seedAsHex, net).getAccountSigningKey(ipInfo.ipIdentity, identityIndex, credNumber);

const signatures = await [signCredentialTransaction(credentialDeploymentTransaction, signingKey)];

// The address, that the account created by the transaction will get, can
// be derived ahead of time.
const accountAddress: AccountAddress = getAccountAddress(credentialDeploymentTransaction.unsignedCdi.credId);

// Send the transaction to the node
const success = await client.sendCredentialDeploymentTransaction(
    credentialDeploymentTransaction,
    signatures
);
if (success) {
    // The node accepted the transaction. This does not ensure that the transaction
    // will end up in a block, only that the format of the submitted transaction was valid.
} else {
    // The node rejected the transaction.
}

// Wait until the account has finalized.
const transactionHash = getCredentialDeploymentTransactionHash(credentialDeploymentTransaction, signatures);
const transactionStatus = await client.waitForTransactionFinalization(transactionHash);
```

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

## getBlockChainParameters
Retrieves the block chain update parameters, which can be chained by chain updates, at a specific block.
```
const blockHash = Buffer.from('7f7409679e53875567e2ae812c9fcefe90ced8761d08554756f42bf268a42749', 'hex')
const cryptographicParameters: ChainParameters = await client.getBlockChainParameters(blockHash);
```

## getPoolInfo
Retrives various information on the specified baker pool, at the end of the specified block.
```
const bakerId = 1n;
const blockHash = Buffer.from('7f7409679e53875567e2ae812c9fcefe90ced8761d08554756f42bf268a42749', 'hex');
const bakerPoolInfo: BakerPoolStatus = await client.getBlockChainParameters(bakerId, blockHash);
```

## getPassiveDelegationInfo
Retrieves information about the passive delegators, at the end of the specified block.
```
const blockHash = Buffer.from('7f7409679e53875567e2ae812c9fcefe90ced8761d08554756f42bf268a42749', 'hex');
const bakerPoolInfo: PassiveDelegationStatus = await client.getBlockChainParameters(blockHash);
```

## getTokenomicsInfo
Retrieves the current amount of funds in the system at a specific block, and the state of the special accounts.
```js
const blockHash = "7f7409679e53875567e2ae812c9fcefe90ced8961d08554756f42bf268a42749";

const tokenomicsInfo = await client.getTokenomicsInfo(blockHash);
```

Protocol version 4 expanded the amount of information in the response, so one should check the type to access that.
This information includes information about the payday and total amount of funds staked.
```js
if (isRewardStatusV1(tokenomicsInfo)) {
    const nextPaydayTime = tokenomicsInfo.nextPaydayTime;
    ...
}
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
 - energy: defaults to 1,000,000 NRG.

## getModuleSource
This commands gets the source of a module on the chain.

Note that this returns the raw bytes of the source, as a Uint8Array.
```js
const blockHash = 'fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e';
const moduleRef = '7e8398adc406a97db4d869c3fd7adc813a3183667a3a7db078ebae6f7dce5f64';
const source = await client.getModuleSource(moduleReference, blockHash);
```

## getBlocks
Returns a stream of blocks that is iterable. The following code will receive blocks
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

## waitForTransactionFinalization
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

## getAccountList
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

## getModuleList
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

## getAncestors
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

## getInstanceState
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

## instanceStateLookup
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

## getIdentityProviders
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
but in bad network conditions it might. The stream will end when all the
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
const seqNums: NextUpdateSequenceNumbers = await client.getNextUpdateSequenceNumbers(accountAddress);
```

## shutdown
Shuts down the node.
```js
await this.client.shutdown();
```

## peerConnect
Suggest to connect the specified address as a peer.
This, if successful, adds the peer to the list of given addresses, otherwise rejects.
Note. The peer might not be connected to instantly, in that case the node will try to establish the connection in near future.
```js
await this.client.peerConnect("127.0.0.1", 20000);
```

## peerDisconnect
Disconnect from the peer and remove them from the given addresses list
if they are on it. Resolves if the request was processed successfully.
Otherwise rejects.
```js
await this.client.peerDisonnect("127.0.0.1", 20000);
```

## getBannedPeers
Get a list of banned peers.
```js
const bannedPeers: IpAddressString[] = await this.client.bannedPeers();
```

## banPeer
Bans the specified peer.
Rejects if the action fails.
```js
await this.client.banPeer("127.0.0.1");
```

## unbanPeer
Unbans the specified peer.
Rejects if the action fails.
```js
await this.client.unbanPeer("127.0.0.1");
```

## dumpStart
Start dumping packages into the specified file.
Only enabled if the node was built with the `network_dump` feature.
Rejects if the network dump failed to start.

The first argument specifies which file to dump the packages into. The second parameter specifies whether the node should dump raw packages.

```js
await this.client.dumpStart("/some/file/path", true);
```

## dumpStop
Stop dumping packages.
Only enabled if the node was built with the `network_dump` feature.
Rejects if the network dump failed to be stopped.
```js
await this.client.dumpStop();
```

## getNodeInfo
Get information about the node.

The `NodeInfo` includes information of:
 - **Meta information** such as the, version of the node, type of the node, uptime and the local time of the node.
 - **NetworkInfo**, which yields data such as the node id, packets sent/received,
  average bytes per second sent/received.
 - **ConsensusInfo**. The `ConsensusInfo` returned depends on if the node supports
  the protocol on chain and whether the node is configured as a baker or not.

```js
const nodeInfo: NodeInfo = await this.client.getNodeInfo();
```

## getPeersInfo
Get a list of the peers that the node is connected to and associated network related information for each peer.

```js
const peerInfo: PeerInfo[] = await this.client.getPeersInfo();
```

## getBlockSpecialEvents
Get a list of special events in a given block. These are events generated
by the protocol, such as minting and reward payouts. They are not directly
generated by any transaction. The stream will end when all the special
events for a given block have been returned.

If a blockhash is not supplied it will pick the latest finalized block. An optional abort signal can also be provided that closes the stream.
```js
const blockHash = "fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e";
const blockSpecialEvents: AsyncIterable<BlockSpecialEvent> = this.client.getBlockSpecialEvents(blockHash);

for await (const blockSpecialEvent of blockSpecialEvents) {
    console.log(blockSpecialEvent);
}
```

## getBlockPendingUpdates
Get the pending updates to chain parameters at the end of a given block.
The stream will end when all the pending updates for a given block have been returned.

If a blockhash is not supplied it will pick the latest finalized block. An optional abort signal can also be provided that closes the stream.

```js
const blockHash = "39122a9c720cae643b999d93dd7bf09bcf50e99bb716767dd35c39690390db54";
const pendingUpdates: AsyncIterable<PendingUpdate> = this.client.getBlockPendingUpdates(blockHash);

for await (const pendingUpdate of pendingUpdates) {
    console.log(pendingUpdate);
}
```

## getBlockFinalizationSummary
Get the summary of the finalization data in a given block. Only finalized blocks will return a finalization summary, if the summary is requested for a non-finalized block, this will return an object with only the tag field, with value "none".

If a blockhash is not supplied it will pick the latest finalized block.

```js
const blockHash = "fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e";
const blockFinalizationSummary: BlockFinalizationSummary = await this.client.getBlockFinalizationSummary(blockHash);

if (blockFinalizationSummary.tag === "record") {
    // Response contains finalization summary for the given block:
    const { block, index, delay, finalizers} = blockFinalizationSummary.record;
} else {
    // Given block has not been finalized.
}
```
