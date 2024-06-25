# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2024-06-12

### Changed

-   Dependency on `@concordium/wallet-connectors` bumped to v0.6.0+.

### Added

-   Hook `useModuleSchemaRpc` for fetching the schema of a smart contract module from the chain.

## [0.5.1] - 2024-03-22

-   Dependency on `@concordium/wallet-connectors` bumped to v0.5.1+.

## [0.5.0] - 2024-03-13

### Changed

-   `useConnect` (breaking): Let `connection` function be `undefined` if `connector` is.
    This prevents the function from being called before `WalletConnectionProps.activeConnector` is ready which would fail anyway.
    The expectation before was that the button/function invoking `connect` would check this itself,
    but making it explicit in the type seems less prone to errors.
    To migrate, replace `connect()` with `connect && connect()` or `connect?.()`
    and optionally replace any guarding using `activeConnector` by the truthiness value of `connect` itself.

## [0.5.0] - 2024-03-13

### Changed

-   Dependency on `@concordium/wallet-connectors` bumped to v0.5.0+.

## [0.4.0] - 2023-11-13

### Changed

-   Build as ES module to facilitate tree-shaking.
-   (breaking) Make compatible with `@concordium/web-sdk@^7`, which is now a peer dependency.
-   `useContractSelector` (breaking): Support for supplying `JsonRpcClient` has been removed.

### Fixed

-   `useContractSelector`: Fix docstring of `rpc` parameter.

## [0.3.0] - 2023-06-04

### Added

-   Hook `useGrpcClient` for obtaining a gRPC Web client `ConcordiumGRPCClient` that connects to the appropriate network.

### Changed

-   Dependency on `@concordium/wallet-connectors` bumped to v0.3.1+.

## [0.2.1] - 2023-03-17

### Changed

-   Bump and unpin dependency to `wallet-connectors`.

## [0.2.0] - 2023-02-06

### Added

-   Hooks `useConnection` and `useConnect` for managing connections.

### Changed

-   `WithWalletConnector`: Decouple component from concrete connector implementations by constructing instances from the application.
    This also introduces the ability for applications to control the activation/deactivation lifecycle of the connectors.
-   `WithWalletConnector`: Removed method `connectActive` (and child prop `isConnecting`).
    Use the `connect` method directly on `WalletConnector` instead.
-   `WithWalletConnector`: Removed the exposed fields `activeConnection`, `activeConnectedAccount`, `activeConnectionGenesisHash`,
    and `setActiveConnection` (use the new hook `useConnection` instead).
    This gives applications much tighter control on how connections are managed, including the ability to have multiple active connections.
-   `WithWalletConnector`: The field `connectedAccounts` now maps connections to the empty string if they don't have an associated account.
    This means that the key set of this field matches the set of live connections exactly.

## [0.1.0] - 2023-01-17

### Added

-   Initial implementation.
