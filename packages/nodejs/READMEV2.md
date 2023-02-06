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
    - [getBlockChainParameters](#getblockchainparameters)
    - [getPoolInfo](#getpoolinfo)
    - [getPassiveDelegationInfo](#getpassivedelegationinfo)
    - [getTokenomicsInfo](#gettokenomicsinfo)
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
