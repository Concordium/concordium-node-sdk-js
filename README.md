# Concordium dApp Libraries

A collection of TypeScript libraries for making it easy for dApp developers to create robust dApps that do interesting things
on the Concordium blockchain.

They allow the developer to focus on their core application without having to worry about the low level details of
things like managing connections to wallets and fetching contract state.

The libraries are layered in order to reduce their dependencies as much as possible:
The lowest layers don’t depend on any UI frameworks and are therefore applicable anywhere.
The higher ones provide components that are ready for use with supported frameworks (currently only React).

## Contents

The project currently includes the following libraries:

- [`@concordium/wallet-connectors`](./packages/wallet-connectors):
  Interfaces for interacting with wallets along with implementations for Browser Wallet and WalletConnect (v2).
  The library has no dependencies to any UI framework.

- [`@concordium/react-components`](./packages/react-components):
  React components and hooks for implementing features commonly needed by dApps.
  The components only manage React state and pass data to application components - no actual HTML is being rendered.

The project also includes a sample dApp [`concordium-dapp-contractupdate`](./samples/contractupdate) as an example
of how to integrate the libraries.
It allows the user to invoke any method on any smart contract on the chain either via the Browser Wallet or WalletConnect.

## Build

Run

```shell
yarn
yarn build
```

to build all the libraries into the `dist` subfolder of their respective paths.
