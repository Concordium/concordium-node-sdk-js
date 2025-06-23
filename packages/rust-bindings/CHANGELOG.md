# Changelog

## Unreleased

## 3.3.0

### Added
- The `@concordium/rust-bindings/wallet` entrypoint now supports react-native.

## 3.2.1

### Fixed

- The build pipeline was using rust version `1.79` instead of the version specified as part of the workflow.
  This caused runtime error `unreachable` for the WebAssembly module for certain operations.
  Fixing the pipeline to use `1.73` as intended, resolved the issue.

## 3.2.0

### Added

- Support creating account with company related attributes: `lei`, `legalName`, `legalCountry`, `businessNumber` and `registrationAuth`, allow for company account creation.

## 3.1.0

### Added

- The function `verify_presentation` to `@concordium/rust-bindings/wallet`, exposed with the WASM entrypoint `verifyPresentation`.

## 3.0.0

### Breaking changes

- The function `create_id_request_v1_ext` exposed with the WASM entrypoint `createIdRequestV1` now expects a new JSON type.
- The function `create_identity_recovery_request_ext` exposed with the WASM entrypoint `createIdentityRecoveryRequest` now expects a new JSON type.

### Changed

- Identity requests, identity recovery requests and unsigned credentials are now created using the `wallet_library` from `concordium-base` instead of the local implementation.
- Deriving wallet keys is now done by utilizing functionality from `wallet_library` in `concordium-base` instead of the local implementation.

## 2.0.1

### Added

- Added react-native condition to root/dapp subpath for, which uses javascript converted from the corresponding WASM used otherwise.

## 2.0.0

### Breaking changes

- The package has been split into two entrypoints to decrease the size of bundles produced for applications using only part of the functionality provided.
  - `@concordium/rust-bindings` (and its alias `@concordium/rust-bindings/dapp`) entrypoints expose functionality commonly used by dApps.
  - `@concordium/rust-bindings/wallet` entrypoint exposes functionality commonly used by wallets and other applications requiring functionality used in wallets.
  - If using a bundler, it might be preferable to load the WASM module asynchronously instead of the version which has it inlined. This can be done
  by adding an alias to your bundler resolve configuration from `@concordium/rust-bindings` to `@concordium/rust-bindings/bundler`.
  - This change makes the library **incompatible** with node versions <16 and requires bundlers to respect the `exports` field of `package.json`.
  - For TypeScript projects the minimum required version of typescript is:
    - NodeJS: 4.7, `"moduleResolution": "node16" // or "nodenext"`
    - Bundled applications (webpack, esbuild, rollup, etc...): 5.0, `"moduleResolution": "bundler"`

## 1.2.0

### Added

- `create_web3_id_proof_ext` function.
- `verify_web3_id_credential_signature_ext` function.
- `get_verifiable_credential_backup_encryption_key_ext` function.

### Changed

- Add issuer contract index and subindex as arguments to `get_verifiable_credential_signing_key_aux` and `get_verifiable_credential_public_key_ext`.

### Removed

- `get_verifiable_credential_encryption_key_ext` function.

## 1.1.0

### Added

- `display_type_schema_template` function

## 1.0.0

### Breaking changes

- Errors thrown from entrypoints in `external_functions.rs` are now proper javascript `Error`s.

### Changes

- Updated reference to concordium-base, which improves error messages when serializing/deserializing using smart contract schemas.
- Added an additional parameter to contract schema serialization/deserializtion entrypoints, making it possible to receive errors in a verbose format with added detail.

## 0.12.0

### Added

- Methods for deriving verifiable credentials keys from a seed phrase.

## 0.11.1 2023-4-21

### Changes

- `generateBakerKeys` now also returns the private keys.

## 0.11.0 2023-3-22

### Added

- `deserializeTypeValue`

### Fixed

- Updated dependencies from concordium-base. (Which includes a bugfix for serialization of negative integers in contract values)

## 0.10.0 2023-2-27

### Added

- `serialize_credential_deployment_payload`
- `create_unsigned_credential_v1`
- `generateBakerKeys`

## 0.9.0 2023-1-4

### Added

- `serializeTypeValue`
- `getInitContractParameterSchema`
- `getReceiveContractParameterSchema`

## 0.8.0 2022-11-30

### Added

- `createIdProof`.

## 0.7.0 2022-11-15

### Added

- `deserializeReceiveError`.
- `deserializeInitError`.

### Changes

- Bumped the concordium-contracts-common rust dependency version from 3.1 to 4.1.

## 0.6.0 2022-11-8

### Added

- `deserializeReceiveReturnValue`.

## 0.5.0

- Add `getCredentialId` method for the HdWallet.

## 0.4.0

### Changes

- Bindings for the HdWallet methods: `getAccountSigningKey`, `getAccountPublicKey`, `getPrfKey`, `getSignatureBlindingRandomness` and `getAttributeCommitmentRandomness` now takes the identity provider index as parameter.

## 0.3.0 2022-8-15

### Added

- `createCredentialV1`
- `createIdRequestV1`
- `createIdentityRecoveryRequest`
- Bindings for the HdWallet methods: `getAccountSigningKey`, `getAccountPublicKey`, `getPrfKey`, `getSignatureBlindingRandomness` and `getAttributeCommitmentRandomness`.
