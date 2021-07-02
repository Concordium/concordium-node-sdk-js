# concordium-node-sdk-js

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.0-4baaaa.svg)](https://github.com/Concordium/.github/blob/main/.github/CODE_OF_CONDUCT.md)

Wrappers for interacting with the Concordium node.

# Updating the gRPC files

If the external dependency concordium-grpc-api has been updated, then it is required to regenerate the
files from the `.proto` file. Do this by running:
```
yarn generate
```
This will overwrite the existing files in `src/grpc`. Remember to check that existing functionality still
works after performing an update.
