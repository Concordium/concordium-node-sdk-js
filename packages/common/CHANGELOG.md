# Changelog

## 2.0.0

### Added

- Support deserializing version 2 schemas.
- Support serializing parameters for contracts using version 2 schemas.

### Breaking changes

- `serializeInitContractParameters` and `serializeUpdateContractParameters` each have an additional parameter, which denotes the version of the schema provided. For existing users that are using V0 contracts, that parameter should be `SchemaVersion.V1`.
- Deserialization of schemas have been changed: types and functions have been renamed and getModuleFromBuffer have an additional parameter.

## 1.0.1 2022-6-2

### Fixed

-   Fixed JSON-RPC client crash on empty response when calling getInstanceInfo.
    (And update the format of the arguments  for the server)
-   Fixed issue by bumping rust bindings version

## 1.0.0 2022-5-25

-   Initial release
