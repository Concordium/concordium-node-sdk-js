# Migration guide from GRPCv1 to v2:

## General:
Blockhash inputs are now optional, and if given must be given as a Uint8Array/buffer. If the blockhash is not given the function will use the last final block.

## getNextAccountNonce
- The function has been renamed to getNextAccountSequenceNumber. 
- The nonce field is renamed to sequenceNumber.

## getCryptographicParameters
nothing?

## getAccountInfo
???
