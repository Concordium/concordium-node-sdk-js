# Changelog - ccd-js-gen

## Unreleased

- Improve information when reporting progress during code-generation.
- Generate `create<ContractName>ParameterWebWallet` and `create<EntrypointName>ParameterWebWallet` functions for constructing the smart contract parameters in the format used by the Concordium Web-Wallet.
- Minor breaking change: `create<EntrypointName>Parameter` function for contract entries and `create<ContractName>Parameter` function in module are no longer generated when parameter schema type is `Unit`. These functions are mainly used internally, but are still exposed.
- Fix bug for generating JSON for schema type `ULeb128` and `ILeb128`.
- Add optional flag `--ts-nocheck`, enabling it will add `// @ts-nocheck` in each generated file.
- Add `--output-type <type>` flag to CLI allowing to specify whether to generate TypeScript or JavaScript directly.
- Fix the executable version of the package on Windows.

## 1.0.1

- Fix missing `bin` in deployed package.

## 1.0.0

- Initial release
