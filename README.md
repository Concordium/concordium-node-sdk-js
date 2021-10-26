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
    memo: new Memo(Buffer.from('6B68656C6C6F20776F726C64', 'hex')),
};
const simpleTransferWithMemoAccountTransaction: AccountTransaction = {
    header: header,
    payload: simpleTransferWithMemo,
    type: AccountTransactionType.SimpleTransferWithMemo,
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


## getAccountInfo
Retrieves information about an account. If no account exists with the provided address, then the node
will check if any credential with that credential identifier exists and will return information
about the credential instead. If neither an account or credential matches the address at the provided
block, then undefined will be returned.
```js
const accountAddress = new AccountAddress("3sAHwfehRNEnXk28W7A3XB3GzyBiuQkXLNRmDwDGPUe8JsoAcU");
const blockHash = "6b01f2043d5621192480f4223644ef659dd5cda1e54a78fc64ad642587c73def";
const accountInfo: AccountInfo = await client.getAccountInfo(accountAddress, blockHash);
const amount: bigint = accountInfo.accountAmount;

// Nationality for the account creator, if the information has been revealed.
const nationality: string = accountInfo.accountCredentials[0].value.contents.policy.revealedAttributes["nationality"];
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

## Create a deploy module
The following example demonstrates how to create a 'deploy module' transaction.
```js
const header: AccountTransactionHeader = {
    expiry: new TransactionExpiry(new Date(Date.now() + 3600000)),
    nonce: nextAccountNonce.nonce,
    sender: new AccountAddress(senderAccountAddress),
};
```
The following code is to get the wasm file buffer which is one of the parameter
for deploy module
```js
const wasmFileBuffer = getByteArray(wasmFilePath) as Buffer;
```

The following code is how to create the payload for deploy module
```js
const deployModule: DeployModulePayload = {
    tag: ModuleTransactionType.DeployModule,
    content: wasmFileBuffer,
    length: wasmFileBuffer.length,
    version: 0,
} as DeployModulePayload;

const deployModuleTransaction: AccountTransaction = {
    header: header,
    payload: deployModule as AccountTransactionPayload,
    type: AccountTransactionType.DeployModule,
};
```

## Deploy module
The following example demonstrates how to deploy a smart contract module. 
See the previous section for how to create a deploy module transaction

```js
import * as ed from "noble-ed25519";

let deployModuleTransaction: AccountTransaction;
// Create the deploy module transaction
// ...

// Sign the transaction, the following is just an example, and any method for signing
// with the key can be employed.
const signingKey = '621de9198d274b56eace2f86eb134bfc414f5c566022f281335be0b2d45189845';
const hashToSign = getAccountTransactionSignDigest(deployModuleTransaction);

const signature = Buffer.from(
        await ed.sign(hashToSign, signingKey)
    ).toString('hex');

// The signatures used to sign the transaction must be provided in a structured way,
// so that each signature can be mapped to the credential that signed the transaction.
// In this example we assume the key used was from the credential with index 0, and it
// was the key with index 0.
const signatures: AccountTransactionSignature = {
    0: {
        0: signature,
    },
};

// Send the deploy module transaction to the node.
const result = await client.sendAccountTransaction(
        deployModuleTransaction,
        signatures
    );

// Get the transaction hash and status of the transaction once deploy transaction is sent
const txHash = await getAccountTransactionHash(deployModuleTransaction, signatures);
const transactionStatus = await client.getTransactionStatus(transactionHash);   
```

## Create Init contract module
The following example demonstrates how to create a init contract transaction.
```js
const header: AccountTransactionHeader = {
    expiry: new TransactionExpiry(new Date(Date.now() + 3600000)),
    nonce: nextAccountNonce.nonce,
    sender: new AccountAddress(senderAccountAddress),
};
```
The following code is how to create the payload for init contract 

Name of init function including "init_" prefix(for suppose the contract with name as "INDBank" then the init name should be as "init_INDBank") and parameter for the init function.
```js
const initName = 'init_INDBank'; 
const params: ParamtersValue<any>[] = [];
```

```js
const initModule: InitContractPayload = {
    amount: new GtuAmount(0n),
    moduleRef: new ModuleReference('a225a5aeb0a5cf9bbc59209e15df030e8cc2c17b8dba08c4bf59f80edaedd8b1'), //module refernce which obtained after deploy smart contract
    initName: initName,
    parameter: params
} as InitContractPayload;

const initModuleTransaction: AccountTransaction = {
    header: header,
    payload: initModule,
    type: AccountTransactionType.InitializeSmartContractInstance,
};
```

## Init Contract (parameterless smart contract)
The following example demonstrates how to initialize a smart contract module. 
See the previous section for how to create init contract transaction

```js
import * as ed from "noble-ed25519";

let initContractTransaction: AccountTransaction;
// Create init contract transaction
// ...

// Sign the transaction, the following is just an example, and any method for signing
// with the key can be employed.
const signingKey = '621de9198d274b56eace2f86eb134bfc414f5c566022f281335be0b2d45189845';
const hashToSign = getAccountTransactionSignDigest(initContractTransaction);

const signature = Buffer.from(
        await ed.sign(hashToSign, signingKey)
    ).toString('hex');

// The signatures used to sign the transaction must be provided in a structured way,
// so that each signature can be mapped to the credential that signed the transaction.
// In this example we assume the key used was from the credential with index 0, and it
// was the key with index 0.
const signatures: AccountTransactionSignature = {
    0: {
        0: signature,
    },
};

// Send the init contract transaction to the node.
const result = await client.sendAccountTransaction(
        initContractTransaction,
        signatures
    );

// Get the transaction hash once init contract transaction is sent
const txHash = await getAccountTransactionHash(initContractTransaction, signatures);
const transactionStatus = await client.getTransactionStatus(transactionHash);    
```

## Create update contract 
The following example demonstrates how to create a update contract.
```js
const header: AccountTransactionHeader = {
    expiry: new TransactionExpiry(new Date(Date.now() + 3600000)),
    nonce: nextAccountNonce.nonce,
    sender: new AccountAddress(senderAccountAddress),
};
```
The following code is how to create the payload for update contract

Name of receive function including "<contractName>." prefix(for suppose the contract with name as "INDBank" and one of the receive function name as "insertAmount" then the name of receive function should be as "INDBank.insertAmount") and parameter for the init function. Contract Address of contract instance consisting of an index and a subindex.
```js
const receiveName = 'DCBBank.insertAmount';
const params: ParamtersValue<any>[] = [];
const contractAddress = { index: BigInt(83), subindex: BigInt(0) } as ContractAddress;
//The amount of energy to execute the transaction
const baseEnergy = 30000n;
```

```js
const updateContractTransaction: UpdateContractPayload =
{
    amount: new GtuAmount(1000n),
    contractAddress: contractAddress,
    receiveName: receiveName,
    parameter: [],
    baseEnergyCost: baseEnergy, 
} as UpdateContractPayload;

const updateContractTransaction: AccountTransaction = {
    header: header,
    payload: updateModule,
    type: AccountTransactionType.UpdateSmartContractInstance,
};
```
## Update Contract(parameterless smart contract)
The following example demonstrates how to update a smart contract. 
See the previous section for how to create update contract transaction

```js
import * as ed from "noble-ed25519";

let updateContractTransaction: AccountTransaction;
// Create update contract transaction
// ...

// Sign the transaction, the following is just an example, and any method for signing
// with the key can be employed.
const signingKey = '621de9198d274b56eace2f86eb134bfc414f5c566022f281335be0b2d45189845';
const hashToSign = getAccountTransactionSignDigest(updateContractTransaction);

const signature = Buffer.from(
        await ed.sign(hashToSign, signingKey)
    ).toString('hex');

// The signatures used to sign the transaction must be provided in a structured way,
// so that each signature can be mapped to the credential that signed the transaction.
// In this example we assume the key used was from the credential with index 0, and it
// was the key with index 0.
const signatures: AccountTransactionSignature = {
    0: {
        0: signature,
    },
};

// Send the update contract transaction to the node.
const result = await client.sendAccountTransaction(
        updateContractTransaction,
        signatures
);

// Get the transaction hash and status of the transaction once update contract transaction is sent
const txHash = await getAccountTransactionHash(updateContractTransaction, signatures);
const transactionStatus = await client.getTransactionStatus(transactionHash);  
```

# Build

## Building for a release
To build the project run
```
yarn build
```

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
