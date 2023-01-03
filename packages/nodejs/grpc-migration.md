# Migration guide from GRPCv1 to v2:

## general:
blockhash inputs are now optional, and if given must be given as a Uint8Array/buffer. If not given it uses the last final block.

## getNextAccountNonce
Renamed to getNextAccountSequenceNumber
nonce field is renamed to sequenceNumber

## getCryptographicParameters
nothing?

## getAccountInfo
???
