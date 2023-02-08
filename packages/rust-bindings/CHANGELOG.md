# Changelog

## 0.10.0

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

-  Bindings for the HdWallet methods: `getAccountSigningKey`, `getAccountPublicKey`, `getPrfKey`, `getSignatureBlindingRandomness` and `getAttributeCommitmentRandomness` now takes the identity provider index as parameter.

## 0.3.0 2022-8-15

### Added

- `createCredentialV1`
- `createIdRequestV1`
- `createIdentityRecoveryRequest`
-  Bindings for the HdWallet methods: `getAccountSigningKey`, `getAccountPublicKey`, `getPrfKey`, `getSignatureBlindingRandomness` and `getAttributeCommitmentRandomness`.
