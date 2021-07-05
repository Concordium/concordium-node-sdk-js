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
