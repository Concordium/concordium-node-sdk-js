# Concordium Nodejs SDK

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.0-4baaaa.svg)](https://github.com/Concordium/.github/blob/main/.github/CODE_OF_CONDUCT.md)

Wrappers for interacting with the Concordium node, using nodejs.

[Note that this package contains and exports the functions from the common-sdk, check the readme of that package for an overview of those](../common/README.md).


**Table of Contents**
- [ConcordiumNodeClient](#concordiumnodeclient)
    - [Creating a client](#creating-a-client)
    - [Create a new account](#create-a-new-account)
    - [getAccountInfo](#getaccountinfo)
    - [getNextAccountSequenceNumber](#getnextaccountsequencenumber)
    - [getCryptographicParameters](#getcryptographicparameters)

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

## getAccountInfo
Retrieves information about an account. The function must be provided an account address or a credential registration id.
If a credential registration id is provided, then the node returns the information of the account,
which the corresponding credential is (or was) deployed to.
If there is no account that matches the address or credential id at the provided
block, then undefined will be returned.
```js
const accountAddress = new AccountAddress('3sAHwfehRNEnXk28W7A3XB3GzyBiuQkXLNRmDwDGPUe8JsoAcU');
const blockHash = Buffer.from('6b01f2043d5621192480f4223644ef659dd5cda1e54a78fc64ad642587c73def', 'hex');
const accountInfo: AccountInfo = await client.getAccountInfo(accountAddress, blockHash);
const amount: bigint = accountInfo.amount?.value;
```

## getNextAccountSequenceNumber
Retrieves the next account sequence number, i.e. the number that must be set in the account transaction
header for the next transaction submitted by that account. Along with the sequence number there is a boolean
that indicates whether all transactions are finalized. If this is true, then the sequence number is reliable,
if not then the next sequence number might be off.
```js
const accountAddress = new AccountAddress('3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt');
const nextAccountSequenceNumber: NextAccountSequenceNumber = await client.getNextAccountSequenceNumber(accountAddress);
const sequenceNumber: bigint = nextAccountsequenceNumber.sequenceNumber?.value;
const allFinal: boolean = nextAccountSequenceNumber.allFinal;
if (allFinal) {
    // nonce is reliable
}
```

## getCryptographicParameters
Retrieves the global cryptographic parameters for the blockchain at a specific block.
These are a required input for e.g. creating credentials.
```js
const blockHash = Buffer.from('7f7409679e53875567e2ae812c9fcefe90ced8761d08554756f42bf268a42749', 'hex')
const cryptographicParameters: CryptographicParameters = await client.getCryptographicParameters(blockHash);
...
```