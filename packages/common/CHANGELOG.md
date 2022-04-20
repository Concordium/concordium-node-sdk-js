# Changelog

## 0.8.0 2022-03-15

### Added

- Support for getting baker list from node.
- Support for getting status of Baker-/L-pool (required node to have protocol version 4 or later).
- Support for getting reward status of chain at specific block.
- Helper functions for determining the version of `BlockSummary` and nested types. 
- Helper functions for determining the version of `AccountInfo` variants. 

### Changed

- Updated `BlockSummary` type to include new version, effective from protocol version 4.
- Updated `AccountInfo` type to include new fields related to delegation introduced with protocol version 4.

## 0.7.1 2022-03-09

### Added

- Support for initiating and updating contracts with parameters.

## 0.6.0 2022-02-02

### Added

- Function to deserialize contract state.
- Support for register data transaction.

## 0.5.1 2021-11-19

### Added

- Functions to generate account aliases, and check if addresses are aliases.

## 0.4.0 2021-11-17

### Added

- Support for getting account info for a credential registration id.
- Support for the update credentials account transaction.
- Support for deploy module, initiate contract and update contract (without parameters).

## 0.3.0 2021-10-28

### Added

- Support for the credential deployment transaction.
- Helpers to decrypt mobile wallet exports, in particular to extract identity information from the export.
