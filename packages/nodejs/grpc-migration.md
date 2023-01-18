# Migration guide from GRPCv1 to v2:

## General:
Blockhash inputs are now optional, and if given must be given as a hex encoded string. If the blockhash is not given the function will use the last final block.

## getTransactionStatus

The `getTransactionStatus` has been replaced with the `getBlockItemStatus`.

The `GetBlockItemStatus` endpoints has the same information, but has a simpler structure, with better typing.
