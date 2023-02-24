# JSON-RPC client

> :warning: **This explains behaviour of the deprecated JSON-RPC client**: check out [the documentation the gRPC client](./GRPC)

This describes the JSON-RPC client, which can interact with the [Concordium JSON-RPC server](https://github.com/Concordium/concordium-json-rpc)

## Creating a client
To create a client, one needs a provider, which handles sending and receiving over a specific protocol. Currently the only one available is the HTTP provider.
The HTTP provider needs the URL to the JSON-RPC server. The following example demonstrates how to create a client that connects to a local server on port 9095:
```js
const client = new JsonRpcClient(new HttpProvider("http://localhost:9095"));
```

## API Entrypoints
Currently the client only supports the following entrypoints, with the same interface as the grpc v1 node client:

- [sendTransaction](./GrpcV1.md#send-account-transaction)
- [getTransactionStatus](./GrpcV1.md#gettransactionstatus)
- [getInstanceInfo](./GrpcV1.md#getInstanceInfo)
- [getConsensusStatus](./GrpcV1.md#getconsensusstatus)
- [getAccountInfo](./GrpcV1.md#getAccountInfo)
- [getCryptographicParameters](./GrpcV1.md#getcryptographicparameters)
- [invokeContract](./GrpcV1.md#invokecontract)
- [getModuleSource](./GrpcV1.md#getModuleSource)
