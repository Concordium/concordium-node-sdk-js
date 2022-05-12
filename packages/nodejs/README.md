# concordium-nodejs-sdk

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.0-4baaaa.svg)](https://github.com/Concordium/.github/blob/main/.github/CODE_OF_CONDUCT.md)

Wrappers for interacting with the Concordium node, using nodejs.

# ConcordiumNodeClient

The ConcordiumNodeClient defines the interface to be used to send and receive data from
a concordium-node.

## Creating a client
The current node setup only allows for insecure connections, which can be set up in the following way.
The access is controlled by the credentials and the metadata.
```js
import { credentials, Metadata } from "@grpc/grpc-js";
import { ConcordiumNodeClient } from "@concordium/node-sdk";

const metadata = new Metadata();
metadata.add("authentication", "rpcadmin");

const insecureCredentials = credentials.createInsecure();
const client = new ConcordiumNodeClient(
    "127.0.0.1",    // ip address
    10000,          // port
    insecureCredentials,
    metadata,
    15000           // timeout in ms
);
```

## Send Account Transaction
The following example demonstrates how to send any account transaction.

See the Constructing transactions section for the [common package](../common#constructing-transactions) for how to create an account transaction.

```js
import * as ed from "noble-ed25519";

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

// Send the transaction to the node.
const success = await client.sendAccountTransaction(accountTransaction, signatures);
if (success) {
    // The node accepted the transaction. This does not ensure that the transaction
    // will end up in a block, only that the format of the submitted transaction was valid.
} else {
    // The node rejected the transaction. 
}

// Check the status of the transaction. Should be checked with an appropriate interval,
// as it will take some time for the transaction to be processed.
const transactionHash = getAccountTransactionHash(accountTransaction, signatures);
const transactionStatus = await client.getTransactionStatus(transactionHash);
```

## Create a new account
The following example demonstrates how to create a new account on an existing
identity. The `credentialIndex` should be the next unused credential index for that identity, and keeping track of that index is done off-chain. Note that index `0` is used by the initial account that was created together with the identity.
See [Construct IdentityInput](#Construct-identityInput-for-creating-credentials) for how to construct an IdentityInput.
```js
const lastFinalizedBlockHash = (await client.getConsensusStatus()).lastFinalizedBlock;
const cryptographicParameters = await client.getCryptographicParameters(lastFinalizedBlockHash);
if (!cryptographicParameters) {
    throw new Error('Cryptographic parameters were not found on a block that has been finalized.');
}

// The parts of the identity required to create a new account, parsed from 
// e.g. a wallet export.
const identityInput: IdentityInput = ...

// Require just one key on the credential to sign. This can be any number 
// up to the number of public keys added to the credential.
const threshold: number = 1;

// The index of the credential that will be created. This index is per identity
// and has to be in sequence, and not already used. Note that index 0 is used
// by the initial credential that was created with the identity.
const credentialIndex: number = 1;

// In this example the credential on the account will have two keys. Note that
// the credential information has to be signed (in order) by corresponding 
// private keys.
const publicKeys: VerifyKey[] = [
    {
        schemeId: "Ed25519",
        verifyKey: "c8cd7623c5a9316d8e2fccb51e1deee615bdb5d324fb4a6d33801848fb5e459e"
    },
    {
        schemeId: "Ed25519",
        verifyKey: "b6baf645540d0ea6ae5ff0b87dff324340ae1120a5c430ffee60d5f370b2ab75"
    }
];

// The attributes to reveal about the account holder on chain. This can be empty
const revealedAttributes: AttributeKey[] = ['firstName', 'nationality'];

const expiry = new TransactionExpiry(new Date(Date.now() + 3600000));
const credentialDeploymentTransaction: CredentialDeploymentTransaction =
    createCredentialDeploymentTransaction(
        identityInput,
        cryptographicParameters.value,
        threshold,
        publicKeys,
        credentialIndex,
        revealedAttributes,
        expiry
    );
const hashToSign: Buffer = getCredentialDeploymentSignDigest(
    credentialDeploymentTransaction
);

// The next step is to sign the credential information with each private key that matches
// one of the public keys in the credential information.
const signingKey1 = "1053de23867e0f92a48814aabff834e2ca0b518497abaef71cad4e1be506334a";
const signingKey2 = "fcd0e499f5dc7a989a37f8c89536e9af956170d7f502411855052ff75cfc3646";

const signature1 = Buffer.from(await ed.sign(hashToSign, signingKey1)).toString('hex');
const signature2 = Buffer.from(await ed.sign(hashToSign, signingKey2)).toString('hex');
const signatures: string[] = [signature1, signature2];

// The address that the account created by the transaction will get can 
// be derived ahead of time.
const accountAddress: AccountAddress = getAccountAddress(credentialDeploymentTransaction.cdi.credId);

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

// Check the status of the transaction. Should be checked with an appropriate interval,
// as it will take some time for the transaction to be processed.
const transactionHash = getCredentialDeploymentTransactionHash(credentialDeploymentTransaction, signatures);
const transactionStatus = await client.getTransactionStatus(transactionHash);
```

## Construct IdentityInput for creating credentials

When creating a new identity the user will choose an identity provider, create an id-use-data object, which contains the private data to use for the identity, and obtain an identity object from the identity provider.

To create accounts/credentials on that identity, this SDK expects an "IdentityInput" object, which contains the identity object, the id-use-data, and the identity provider's information.

### Construct from user-cli output:

Below is an example of how to construct the identityInput, with a plaintext id-use-data.json from the [user-cli guide](https://github.com/Concordium/concordium-base/blob/main/rust-bins/docs/user-cli.md#generate-a-request-for-the-identity-object), and an id-object file.

```js
// First we load the files. We assume here that they are available as local files.
const rawIdUseData = fs.readFileSync(
    'path/to/id-use-data.json',
    'utf8'
);
const rawIdObject = fs.readFileSync(
    'path/to/id-object.json',
    'utf8'
);

// Then we parse them. We assume here that they are both version 0.
const idUseData = JSON.parse(rawIdUseData).value;
const identityObject = JSON.parse(rawIdObject).value;

// Finally we construct the IdentityInput:
const identityInput: IdentityInput = {
    identityObject,
    identityProvider: {
        ipInfo: idUseData.ipInfo,
        arsInfos: idUseData.ars,
    },
    idCredSecret: idUseData.idUseData.aci.credentialHolderInformation.idCredSecret,
    prfKey: idUseData.idUseData.aci.prfKey,
    randomness: idUseData.idUseData.randomness,
};
```

### Construct from mobile wallet export:

The following is an example of how to construct the identityInput for the _i_-th identity from a mobile wallet export:

```js
// We assume the export is available as a local file:
const rawData = fs.readFileSync(
    'path/to/export.concordiumwallet',
    'utf8'
);
const mobileWalletExport: EncryptedData = JSON.parse(rawData);
const decrypted: MobileWalletExport = decryptMobileWalletExport(
    mobileWalletExport,
    password
);
const identity = decrypted.value.identities[i];
const identityInput: IdentityInput = {
    identityObject: identity.identityObject,
    identityProvider: identity.identityProvider,
    idCredSecret: identity.privateIdObjectData.aci.credentialHolderInformation.idCredSecret,
    prfKey: identity.privateIdObjectData.aci.prfKey,
    randomness: identity.privateIdObjectData.randomness,
};
```

## getAccountInfo
Retrieves information about an account. The function must be provided an account address or a credential registration id. 
If a credential registration id is provided, then the node returns the information of the account, 
which the corresponding credential is (or was) deployed to.
If there is no account that matches the address or credential id at the provided
block, then undefined will be returned.
```js
const accountAddress = new AccountAddress("3sAHwfehRNEnXk28W7A3XB3GzyBiuQkXLNRmDwDGPUe8JsoAcU");
const blockHash = "6b01f2043d5621192480f4223644ef659dd5cda1e54a78fc64ad642587c73def";
const accountInfo: AccountInfo = await client.getAccountInfo(accountAddress, blockHash);
const amount: bigint = accountInfo.accountAmount;

// Nationality for the account creator, if the information has been revealed.
const nationality: string = accountInfo.accountCredentials[0].value.contents.policy.revealedAttributes["nationality"];
```

To check if the account is a baker or a delegator, one can use the functions `isDelegatorAccount` and `isBakerAccount`.
```js
...
const accountInfo: AccountInfo = await client.getAccountInfo(accountAddress, blockHash);
if (isDelegatorAccount(accountInfo)) {
    const delegationDetails = accountInfo.accountDelegation;
    ...
} else if (isBakerAccount(accountInfo) {
    const bakingDetails = accountInfo.accountBaker;
    ...
} else {
    // Neither a baker nor a delegator
}
```
Furthermore there are different versions, based on Protocol version, of a baker's accountInfo.
In protocol version 4 the concept of baker pools was introduced, so to get baker pool information one should confirm the version with `isBakerAccountV0` or `isBakerAccountV1`.

```js
...
const accountInfo: AccountInfo = await client.getAccountInfo(accountAddress, blockHash);
if (isBakerAccountV1(accountInfo)) {
    const bakerPoolInfo = accountInfo.accountBaker.bakerPoolInfo;
    ...
} else if (isBakerAccountV0(accountInfo) {
    // accountInfo is from protocol version < 4, so it will not contain bakerPoolInfo
    ...
}
```

## getNextAccountNonce
Retrieves the next account nonce, i.e. the nonce that must be set in the account transaction
header for the next transaction submitted by that account. Along with the nonce there is a boolean
that indicates whether all transactions are finalized. If this is true, then the nonce is reliable, 
if not then the next nonce might be off.
```js
const accountAddress = new AccountAddress("3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt");
const nextAccountNonce: NextAccountNonce = await client.getNextAccountNonce(accountAddress);
const nonce: bigint = nextAccountNonce.nonce;
const allFinal: boolean = nextAccountNonce.allFinal;
if (allFinal) {
    // nonce is reliable
}
```

## getTransactionStatus
Retrieves status information about a transaction.
```js
const transactionHash = "f1f5f966e36b95d5474e6b85b85c273c81bac347c38621a0d8fefe68b69a430f";
const transactionStatus: TransactionStatus = await client.getTransactionStatus(transactionHash);
const isFinalized = transactionStatus.status === TransactionStatusEnum.Finalized;
...
```
Note that there will be no outcomes for a transaction that has only been received:
```js
if (transactionStatus.status === TransactionStatusEnum.Received) {
    const outcomes = Object.values(transactionStatus.outcomes);
    // outcomes.length === 0.
}
```
If the transaction has been finalized, then there is exactly one outcome:
```js
if (transactionStatus.status === TransactionStatusEnum.Finalized) {
    const outcomes = Object.values(transactionStatus.outcomes);
    // outcomes.length === 1.
}
```
A transaction was successful if it is finalized and it has a successful outcome:
```js
if (transactionStatus.status === TransactionStatusEnum.Finalized) {
    const event = Object.values(response.outcomes)[0];
    if (event.result.outcome === "success") {
        // transaction was successful.
    }
}
```

## getBlockSummary
Retrives a summary for a specific block. The summary contains information about finalization, the
current chain parameters, a list of the governance keys, information about any queued chain parameter
updates and a summary of any transactions within the block.
```js
const blockHash = "7f7409679e53875567e2ae812c9fcefe90ced8761d08554756f42bf268a42749";
const blockSummary: BlockSummary = await client.getBlockSummary(blockHash);
const numberOfFinalizers = blockSummary.finalizationData.finalizers.length;
...
```

Blocks before protocol version 4 have a different type than those from higher protocol versions.
To determine the version, use `isBlockSummaryV1` and `isBlockSummaryV0`:

```js
...
const blockSummary: BlockSummary = await client.getBlockSummary(blockHash);
if (isBlockSummaryV0(blockSummary)) {
    // This block is from protocol version <= 3, and so the summary has version 0 structure
    ...
} else if (isBlockSummaryV1(blockSummary) {
    // This block is from protocol version >= 4, and so the summary has version 1 structure
    ...
} else {
    // Must be a future version of a blockSummary (or the given object is not a blockSummary)
}
```

There are also type checks for specific fields in the summary, which can be found in [blockSummaryHelpers](../common/src/blockSummaryHelpers.ts).

## getBlockInfo
Retrieves information about a specific block.
```js
const blockHash = "7f7409679e53875567e2ae812c9fcefe90ced8761d08554756f42bf268a42749";
const blockInfo: BlockInfo = await client.getBlockInfo(blockHash);
const transactionsCount = blockInfo.transactionCount;
...
```

## getBlocksAtHeight
Retrieves the hashes of blocks at a specific height.
```js
const blockHeight: bigint = 5310n;
const blocksAtHeight: string[] = await client.getBlocksAtHeight(blockHeight);
```

## getConsensusStatus
Retrieves the current consensus status from the node.
```js
const consensusStatus: ConsensusStatus = await client.getConsensusStatus();
const bestBlock = consensusStatus.bestBlock;
...
```

## getCryptographicParameters
Retrieves the global cryptographic parameters for the blockchain at a specific block.
These are a required input for e.g. creating credentials.
```js
const blockHash = "7f7409679e53875567e2ae812c9fcefe90ced8761d08554756f42bf268a42749"
const cryptographicParameters = await client.getCryptographicParameters(blockHash);
...
```

## getIdentityProviders
Retrieves the list of identity providers at a specific block.
```js
const blockHash = "7f7409679e53875567e2ae812c9fcefe90ced8961d08554756f42bf268a42749";
const identityProviders = await client.getIdentityProviders(blockHash);
...
```

## getAnonymityRevokers
Retrieves the list of anonymity revokers at a specific block.
```js
const blockHash = "7f7409679e53875567e2ae812c9fcefe90ced8961d08554756f42bf268a42749";
const identityProviders = await client.getAnonymityRevokers(blockHash);
...
```

## getPeerList
Retrieves the list of peers that the node is connected to, including some
connection information about them. A boolean parameter determines if this 
should include bootstrapper nodes or not.
```js
const peerListResponse = await client.getPeerList(false);
const peersList = peerListResponse.getPeersList();
...
```

## getBakerList
Retrieves the list of ID's for registered bakers on the network at a specific block.
```js
const blockHash = "7f7409679e53875567e2ae812c9fcefe90ced8961d08554756f42bf268a42749";
const bakerIds = await client.getBakerList(blockHash);
...
```

## getPoolStatus
Retrieves the status of a pool (either a specific baker or passive delegation) at a specific block.
If a baker ID is specified, the status of that baker is returned. To get the status of passive delegation, baker ID should be left undefined.
```js
const blockHash = "7f7409679e53875567e2ae812c9fcefe90ced8961d08554756f42bf268a42749";
const bakerId = BigInt(1);

const bakerStatus = await client.getPoolStatus(blockHash, bakerId);
const passiveDelegationStatus = await client.getPoolStatus(blockHash); 
...
```

## getRewardStatus
Retrieves the current amount of funds in the system at a specific block, and the state of the special accounts. 
```js
const blockHash = "7f7409679e53875567e2ae812c9fcefe90ced8961d08554756f42bf268a42749";

const rewardStatus = await client.getRewardStatus(blockHash);
```

Protocol version 4 expanded the amount of information in the response, so one should check the type to access that.
This information includes information about the payday and total amount of funds staked.
```js
if (isRewardStatusV1(rewardStatus)) {
    const nextPaydayTime = rewardStatus.nextPaydayTime; 
    ...
}
```

## Check block for transfers with memo
The following example demonstrates how to check and parse a block 
for transfers with a memo.
```js
const blockHash = "b49bb1c06c697b7d6539c987082c5a0dc6d86d91208874517ab17da752472edf";
const blockSummary = await client.getBlockSummary(blockHash);
const transactionSummaries = blockSummary.transactionSummaries;

for (const transactionSummary of transactionSummaries) {
    if (transactionSummary.result.outcome === 'success') {
        if (instanceOfTransferWithMemoTransactionSummary(transactionSummary)) {
            const [transferredEvent, memoEvent] = transactionSummary.result.events;

            const toAddress = transferredEvent.to.address;
            const amount = transferredEvent.amount;
            const memo = memoEvent.memo;

            // Apply business logic to toAddress, amount and memo...
        }
    }
}
```

## getInstances
Used to get the full list of contract instances on the chain at a specific block.
```js
const blockHash = "7f7409679e53875567e2ae812c9fcefe90ced8961d08554756f42bf268a42749";

const instances = await client.getInstances(blockHash);
...
```

## getInstanceInfo
Used to get information about a specific contract instance, at a specific block.

```js
const blockHash = "7f7409679e53875567e2ae812c9fcefe90ced8961d08554756f42bf268a42749";
const contractAddress = { index: 1n, subindex: 0n };

const instanceInfo = await client.getInstanceInfo(blockHash, contractAddress);
const name = instanceInfo.name; 
...
```

Note that only version 0 contracts returns the model. (use `isInstanceInfoV0`/`isInstanceInfoV1` to check the version)

# Build

## Building for a release
To build the package run
```
yarn build
```

Note that this also builds the [common package](../common).

## Publishing a release
Before publishing a new release it is essential that it has been built first. So make sure that 
you have just built the up-to-date code you want to publish. To publish the release run
```
yarn publish
```
and step through the steps precented to you.

# Test
An automatic test suite is part of this project, and it is run by executing:
```
yarn test
```
Note that the tests require a locally running concordium-node on the testnet. Otherwise the tests will fail.
