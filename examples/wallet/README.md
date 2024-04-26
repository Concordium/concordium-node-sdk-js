# Wallet example for web applications

This example demonstrates how to utilize the Concordium web-sdk to build a web based wallet for interacting with the Concordium blockchain. In particular
it focuses on the creation of identities and accounts, and sending a simple transfer. As it just serves as a simple example everything is in-memory, and
nothing is persisted.

## Installing

From the root of concordium-node-sdk-js you must run

```console
yarn install
```

### Skip building

An alternative to building all of the packages in the project, you can change the code base to use the builds already published on NPM, note that this might not work for unreleased changes:

- Remove packages from the workspace i.e remove the line with `"./packages/*",` from `package.json` in the project root.
- Replace `workspace:^` in `package.json` found in this example with `*`:

  ```json
  ...
  "@concordium/web-sdk": "*",
  ```

Then run:

```shell
yarn workspaces focus @concordium/examples-web-wallet
```

to only install dependencies related to examples.

## Running

When dependencies have been installed, then build and run the example by executing

```console
yarn build && yarn start
```

The console will output the location where the example can be accessed.
