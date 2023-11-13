# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.0] - 2023-11-13

### Changed

-   (breaking) Make compatible with `@concordium/web-sdk@^7`, which is now a peer dependency.
-   `BrowserWalletConnector` (breaking): Change method `getGrpcClient` to `getGrpcTransport`
    and expose the transport object instead of a full client.
-   Build as ES module to facilitate tree-shaking.

### Removed

-   `WalletConnection`: The deprecated method `getJsonRpcClient()` and related symbols have been removed
    in favor of the new gRPC client (`ConcordiumGRPCClient`) for the Node API v2.
    Existing usage is migrated by simply constructing and using this client directly
    instead of using the one previously fetched with `connection.getJsonRpcClient`.
    Usage of `withJsonRpcClient`, i.e.,
    ```typescript
    if (connection) {
      const res = await withJsonRpcClient(connection, func);
      ...
    }
    ```
    may be directly replaced by
    ```typescript
    if (grpcClient) {
      const res = await func(grpcClient);
      ...
    }
    ```
    The `Network` type has a field `grpcOpts` which may be used to construct the client (see its docstring for details).
    The field is optional, but present on the predefined constants `TESTNET` and `MAINNET`.
    For users of `@concordium/react-components`, this is all wrapped into the hook `useGrpcClient`.

## [0.3.2] - 2023-08-17

### Changed

-   Bump dependency `@concordium/web-sdk` to v6.0.0+. This transitively bumps `@concordium/common-sdk` to v9.0.0.

### Fixed

-   `WalletConnect`: Fix schema object format conversion in `signAndSendTransaction` in request payloads.
-   `WalletConnect`: Use standard string identifiers for transaction type in request payload.

## [0.3.1] - 2023-06-04

### Added

-   Standard values of `Network` for testnet and mainnet, exposed as constants `TESTNET` and `MAINNET`.

### Changed

-   `WalletConnection`: Deprecate the method `getJsonRpcClient` on `WalletConnection`
    in favor of the gRPC Web client `ConcordiumGRPCClient` for querying a Node via API version 2.
    The client should be managed independently of this library, e.g. using `useGrpcClient` in `@concordium/react-components`.
-   `Network`: Add field `grpcOpts` containing the initialization options for a gRPC Web client `ConcordiumGRPCClient`
    to connect to the given network.
    If field `jsonRpcUrl` is empty, the JSON-RPC client is not initialized for WalletConnect connections,
    and if so, `getJsonRpcClient` will throw an exception.

## [0.3.0] - 2023-05-21

### Changed

-   `WalletConnection` (breaking): Support both module and type/parameter schemas in `signAndSendTransaction`.
    To migrate existing usage, wrap the schema string in the new function `moduleSchemaFromBase64(...)`.
-   `WalletConnection` (breaking): Support both string and binary messages in `signMessage`.
    To migrate existing usage, wrap the message string in the new function `stringMessage(...)`.

## [0.2.3] - 2023-04-03

No changes. Had to bump version to fix NPM release.

## [0.2.2] - 2023-04-03

### Added

-   Added exported constant `CONCORDIUM_WALLET_CONNECT_PROJECT_ID` that dApps may use when connecting to a Concordium mobile wallet.

### Changed

-   `WalletConnect`: Removed incorrect stringification of `signMessage` result.

## [0.2.1] - 2023-03-13

### Changed

-   `WalletConnect`: Added `sign_message` to `requiredNamespaces` in the call to `connect`.

## [0.2.0] - 2023-02-06

### Added

-   `WalletConnection`: Added method for pinging the remote end of the connection.

### Changed

-   `WalletConnectionDelegate`: Added `onConnected` event method and renamed `onDisconnect` to `onDisconnected`
    for consistency.
-   `WalletConnect`: Reordered constructor parameters to accommodate changes in `@concordium/react-components`.
-   `WalletConnector`: Made `getConnections` non-async.
-   `WalletConnection`: Removed `getConnectedAccount` (the implementation methods stay but are no longer forced to be async).

## [0.1.0] - 2023-01-17

### Added

-   Initial implementation.
