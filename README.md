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

-   [`@concordium/wallet-connectors`](./packages/wallet-connectors):
    Interfaces for interacting with wallets along with implementations for Browser Wallet and WalletConnect (v2).
    The library has no dependencies to any UI framework.

-   [`@concordium/react-components`](./packages/react-components):
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

## Release

The libraries are released individually using the GitHub Actions workflow
[`Build and publish release`](./.github/workflows/build+release.yml).
The procedure is as follows:

1. Add an annotated tag for the commit to build from.
   The name of the tag name must follow the format `<package>/<version>`,
   where `<package>` is `wallet-connectors` or `react-components` and `<version>` is the version to release.
   The version must match the version given in `package.json` of the package followed by a build version.

   Example: Release `@concordium/wallet-connectors` version 1.2.3 from commit `<ref>`:
   ```
   git checkout <ref>
   git tag -a wallet-connectors/1.2.3-0
   ```
2. Provide an overview of the changes in the release as the message of the annotated tag.
   The release notes of the GitHub release is constructed from this message followed by the items corresponding to the version
   extracted from the library's `CHANGELOG.md`.
3. Run the GitHub Actions workflow
   [`Build and publish release`](https://github.com/Concordium/concordium-dapp-libraries/actions/workflows/build+release.yml)
   using the "Run Workflow" button.
   Keep `main` as the selected option of "Use workflow from" and provide the name of the tag created above as the value of "Tag".
   Hit "Run workflow" to start the workflow.
4. If the tag satisfies all the requirements, the workflow will build the package and publish it as a GitHub release
   as well as to the npm registry.
   Note that the procedure has to be performed once for each package to release.

The npm package is published using the API key stored in the repository secret `NPM_TOKEN`,
which belongs to the npm user `concordium-ci`.
The current key expires 2024-06-03.
