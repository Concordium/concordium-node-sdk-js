## Examples for the Concordium NodeJS-SDK

This is a collection of scripts/examples that utilizes the SDK. There are
three directories with examples:
- `client` containing examples that utilize the client to interact with a Concordium node.
- `cis2`  containing examples that helps interact with CIS-2 compliant smart contracts.
- `common` that use various general functions from the library.

To run an example call:

```shell
yarn run-example /path/to/example.ts [opts]
```

Where opts are any arguments that the example script takes.

Note that you must first build the project using:

```shell
    yarn build:dev
```
