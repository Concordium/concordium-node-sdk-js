# Wallet example for web applications

This example demonstrates how to utilize the Concordium web-sdk to build a web based wallet for interacting with the Concordium blockchain. In particular
it focuses on the creation of identities and accounts, and sending a simple transfer. As it just serves as a simple example everything is in-memory, and
nothing is persisted.

## Installing

From the root of the concordium-node-sdk-js you must first run
```
yarn install
```
Then navigate into the example/wallet directory and run
```
yarn install
```

## Running
When dependencies have been installed, then build and run the example by executing
```
yarn build && yarn start
```
The console will output the location where the example can be accessed.
