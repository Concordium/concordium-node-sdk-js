There is a collection of runnable examples that utilizes the SDK. These are
located in the examples folder of the repo. To run an example call, navigate
to the examples directory from the repo and run your example:

```shell
    yarn run-example /path/to/example.ts [opts]
```

Where opts are any arguments that the example script takes.

Note that you must first build the project using:

```shell
    yarn build:dev
```

For example, after building, navigate to the `examples` directory from the
repo root and run:

```shell
    yarn run-example client/getBlockInfo.ts
```

This will get block info on the last finalized block and print the
information. The above command assumes that you have a _mainnet_ Concordium
Node running on your machine with the GRPCv2 API exposed on port 20000
(default).

If you are running a testnet node where the GRPCv2 API is exposed by default
on port 20001 you can override the GRPC-endpoint using the `--endpoint` flag:

```shell
    yarn run-example client/getBlockInfo.ts --endpoint localhost:20001
```

For information on how to run a Concordium node see [this
page](https://developer.concordium.software/en/mainnet/net/nodes/node-requirements.html)
