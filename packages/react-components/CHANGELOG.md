# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

-   `WithWalletConnector`: Decouple component from concrete connector implementations by constructing instances from the application.
    This also introduces the ability for applications to control the activation/deactivation lifecycle of the connectors.
-   `WithWalletConnector`: Removed method `connectActive` (and child prop `isConnecting`).
    Use the `connect` method directly on `WalletConnector` instead.

## [0.1.0] - 2023-01-17

### Added

-   Initial implementation.
