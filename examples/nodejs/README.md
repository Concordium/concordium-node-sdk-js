## Examples for the Concordium NodeJS-SDK

This is a collection of scripts/examples that utilizes the SDK. There are
three directories with examples:

- `ccd-js-gen` containing examples with generate and using smart contract clients.
- `client` containing examples that utilize the client to interact with
a Concordium node.
- `cis2`  containing examples that helps interact with CIS-2 compliant smart contracts.
- `cis4`  containing examples that helps interact with CIS-4 compliant smart contracts.
- `common` that use various general functions from the library.

### Building

To try the examples you need to build the entire project, which can be time comsuming the first time:

```shell
    yarn build:dev
```

### Skip building

An alternative to building all of the packages in the project, you can change the code base to use the builds already published on NPM, note that this might not work for unreleased changes:

- Remove packages from the workspace i.e remove the line with `"./packages/*",` from `package.json` in the project root.
- Replace `workspace:^` in `package.json` found in this example with `*`:

  ```json
  ...
  "@concordium/ccd-js-gen": "*",
  "@concordium/web-sdk": "*",
  ```

Then run:

```shell
yarn workspaces focus @concordium/examples
```

to only install dependencies related to examples.

### Run an example

To run an example call:

```shell
yarn run-example /path/to/example.ts [opts]
```

Where opts are any arguments that the example script takes.

Default endpoint for node is 'localhost:20000',
but instead of installing local node,
can be used testnet node <https://node.testnet.concordium.com:20000>
