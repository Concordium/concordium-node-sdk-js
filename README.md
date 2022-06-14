# concordium-node-sdk-js

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.0-4baaaa.svg)](https://github.com/Concordium/.github/blob/main/.github/CODE_OF_CONDUCT.md)

Wrappers for interacting with the Concordium node.

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

## Create a simple transfer
The following example demonstrates how a simple transfer can be created.
```js
const header: AccountTransactionHeader = {
    expiry: new TransactionExpiry(new Date(Date.now() + 3600000)),
    nonce: 1n,              // the next nonce for this account, can be found using getNextAccountNonce
    sender: new AccountAddress("4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M"),
};
const simpleTransfer: SimpleTransferPayload = {
    amount: new GtuAmount(100n),
    toAddress: new AccountAddress("4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf"),
};
const simpleTransferAccountTransaction: AccountTransaction = {
    header: header,
    payload: simpleTransfer,
    type: AccountTransactionType.SimpleTransfer,
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
    amount: new GtuAmount(100n),
    toAddress: new AccountAddress("4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf"),
    memo: new DataBlob(Buffer.from('6B68656C6C6F20776F726C64', 'hex')),
};
const simpleTransferWithMemoAccountTransaction: AccountTransaction = {
    header: header,
    payload: simpleTransferWithMemo,
    type: AccountTransactionType.SimpleTransferWithMemo,
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
        stake: new GtuAmount(1000000000n),
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

## Send Account Transaction
The following example demonstrates how to send any account transaction.
See the previous sections for how to create an account transaction.
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

There are also type checks for specific fields in the summary, which can be found in [blockSummaryHelpers](src/blockSummaryHelpers.ts).

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

## Deploy module
The following example demonstrates how to deploy a smart contract module.
```js
/**
 *
 * @param filePath for the wasm file moudule
 * @returns Buffer of the wasm file
 */
function getByteArray(filePath: string): Buffer {
    const data = fs.readFileSync(filePath);
    return Buffer.from(data);
}
//To get the buffer of the wasm file from the previous method
const wasmFileBuffer = getByteArray(wasmFilePath) as Buffer;

const deployModule: DeployModulePayload = {
        content: wasmFileBuffer,
        version: 0,
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
    amount: new GtuAmount(0n), // Amount to send to the contract. If the smart contract is not payable, set the amount to 0.
    moduleRef: new ModuleReference('a225a5aeb0a5cf9bbc59209e15df030e8cc2c17b8dba08c4bf59f80edaedd8b1'), // Module reference
    contractName: contractName,
    parameter: params,
    maxContractExecutionEnergy: maxContractExecutionEnergy
};
const initContractTransaction: AccountTransaction = {
    header: header,
    payload: initModule,
    type: AccountTransactionType.InitializeSmartContractInstance,
};
```

Finally, to actually initialize the contract on the chain, send the constructed `initContractTransaction` to the chain using `sendAccountTransaction`. (See [Send Account Transaction](#Send-Account-Transaction) for how to do this)

## Update Contract (parameterless smart contract)
The following example demonstrates how to update a smart contract. 

To update a smart contract we create a 'updateContractTransaction'.
To do this we need to specify the name of the receive function, which should contain the contract name as a prefix (So if the contract has the name "INDBank" and the receive function has the name "insertAmount" then the receiveName should be "INDBank.insertAmount").

We also need to supply the contract address of the contract instance. This consists of an index and a subindex.

In this example, the contract does not take any parameters, so we can leave the parameters as an empty buffer.
```js
const receiveName = 'INDBank.insertAmount';
const params = Buffer.from([]);
const contractAddress = { index: BigInt(83), subindex: BigInt(0) } as ContractAddress;
//The amount of energy that can be used for contract execution.
const maxContractExecutionEnergy = 30000n;
```
Create update contract transaction
```js
const updateModule: UpdateContractPayload =
{
    amount: new GtuAmount(1000n),
    contractAddress: contractAddress,
    receiveName: receiveName,
    parameter: params,
    maxContractExecutionEnergy: maxContractExecutionEnergy
};
const updateContractTransaction: AccountTransaction = {
    header: header,
    payload: updateModule,
    type: AccountTransactionType.UpdateSmartContractInstance,
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
Then the user needs to provide the schema for the module. Here we use getModuleBuffer to load the schema file:
```js
const modulefileBuffer = getModuleBuffer(
    'SCHEMA-FILE-PATH'
);
```
Then the parameters can be serialized into bytes:
```js
const inputParams = serializeInitContractParameters(
    "my-contract-name",
    userInput,
    modulefileBuffer
);
```
Then the payload and transaction can be constructed, in the same way as the parameterless example:
```js
const initModule: InitContractPayload = {
        amount: new GtuAmount(0n),
        moduleRef: new ModuleReference(
            '6cabee5b2d9d5013216eef3e5745288dcade77a4b1cd0d7a8951262476d564a0'
        ),
        contractName: contractName,
        parameter: inputParams,
        maxContractExecutionEnergy: baseEnergy,
    };
const initContractTransaction: AccountTransaction = {
    header: header,
    payload: initModule,
    type: AccountTransactionType.InitializeSmartContractInstance,
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

Then the user need to provide the schema. Here we use getModuleBuffer to load the schema file:
```js
const modulefileBuffer = getModuleBuffer(
    'SCHEMA-PATH'
);
```
Then the parameters can be serialized into bytes:
```js
const inputParams = serializeUpdateContractParameters(
        contractName,
        receiveFunctionName,
        userInput,
        modulefileBuffer
);
```
Then we will construct the update payload with parameters obtained 
```js
const updateModule: UpdateContractPayload = {
        amount: new GtuAmount(1000n),
        contractAddress: contractAddress,
        receiveName: receiveName,
        parameter: inputParams,
        maxContractExecutionEnergy: baseEnergy,
} as UpdateContractPayload;
const updateContractTransaction: AccountTransaction = {
        header: header,
        payload: updateModule,
        type: AccountTransactionType.UpdateSmartContractInstance,
};
```
Finally, to actually update the contract on the chain, send the constructed `updateContractTransaction` to the chain using `sendAccountTransaction`. (See [Send Account Transaction](#Send-Account-Transaction) for how to do this)


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

## InvokeContract
Used to simulate a contract update, and to trigger view functions.

```js
const blockHash = "7f7409679e53875567e2ae812c9fcefe90ced8961d08554756f42bf268a42749";
const contractAddress = { index: 1n, subindex: 0n };
const invoker = new AccountAddress('3tXiu8d4CWeuC12irAB7YVb1hzp3YxsmmmNzzkdujCPqQ9EjDm');
const result = await client.invokeContract(
    blockHash,
    {
        invoker: invoker,
        contract: contractAddress,
        method: 'PiggyBank.smash',
        amount: undefined,
        parameter: undefined,
        energy: 30000n,
    }
);

if (!result) {
    // The node could not attempt the invocation, most likely the contract doesn't exist.
}

if (result.tag === 'failure') {
    // Invoke was unsuccesful
    const rejectReason = result.reason; // Describes why the update failed;
    ...
} else {
    const events = result.events; // a list of events that would be generated by the update
    const returnValue = result.returnValue; // If the invoked method has return value
    ...
}
```

Note that some of the parts of the context are optional:
 - amount: defaults to 0
 - energy: defaults to 10 million
 - parameter: defaults to no parameters
 - invoker: uses the zero account address, which can be used instead of finding a random address.

## Deserialize contract state
The following example demonstrates how to deserialize a contract's state:

```js
const contractName = "my-contract-name"
const schema = Buffer.from(schemaSource); // Load schema from file
const rawContractState = Buffer.from(stateSource); // Could be getinstanceInfo(...).model (if contract is version 0)
const state = deserializeContractState(contractName, schema, rawContractState);
```

# Build

## Building for a release
To build the project run
```
yarn build
```
Note that you must have [wasm-pack](https://rustwasm.github.io/wasm-pack/) installed to build the project.

## Publishing a release
Before publishing a new release it is essential that it has been built first. So make sure that 
you have just built the up-to-date code you want to publish. To publish the release run
```
yarn publish
```
and step through the steps precented to you.

## Updating the gRPC files
If the external dependency concordium-grpc-api has been updated (or this is your first time building the project), 
then it is required to regenerate the files from the `.proto` file. Do this by running:
```
yarn generate
```
This will overwrite the existing files in `src/grpc/`. Remember to check that existing functionality still
works after performing an update.

# Test
An automatic test suite is part of this project, and it is run by executing:
```
yarn test
```
Note that the tests require a locally running concordium-node on the testnet. Otherwise the tests will fail.
