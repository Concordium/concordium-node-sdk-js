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
import ConcordiumNodeClient from "@concordium/concordium-node-sdk-js";

const metadata = new Metadata();
metadata.add("authentication", "rpcadmin");

const credentials = credentials.createInsecure();

const client = new ConcordiumNodeClient(
    "127.0.0.1",    // ip address
    10000,          // port
    credentials,
    metadata,
    15000           // timeout in ms
);
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
if (transactionStatus.status === TransactionStatusEnum.Finalized &&) {
    const event = Object.values(response.outcomes)[0];
    if (event.result.outcome === "success") {
        // transaction was successful.
    }
}
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

# Build

## Updating the gRPC files
If the external dependency concordium-grpc-api has been updated, then it is required to regenerate the
files from the `.proto` file. Do this by running:
```
yarn generate
```
This will overwrite the existing files in `src/grpc`. Remember to check that existing functionality still
works after performing an update.

# Test
An automatic test suite is part of this project, and it is run by executing:
```
yarn test
```
Note that the tests require a locally running concordium-node on the testnet. Otherwise the tests will fail.
