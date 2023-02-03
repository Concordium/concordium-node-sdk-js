# Migration guide from GRPCv1 to v2:

## General:
Blockhash inputs are now optional, and if given must be given as a hex encoded string. If the blockhash is not given the function will use the last final block.

## GetBlockSummary

The `getBlockSummary` endpoint has been split up.

To access the chain parameters, use the `getBlockChainParameters` endpoint, which corresponds to the `blockSummary.updates.chainParameters`,
except that the foundationAccountIndex field is no longer present, instead the foundationAccount field is present and contains the account address of the foundation account instead of the account index,

## GetPoolStatus

The `getPoolStatus` endpoint has been split up into two separate endpoints.

For the status and information on a specific baker pool, use the `getPoolInfo` endpoint.
for information on passive delegators, use the `getPassiveDelegationInfo` endpoint.

## GetRewardStatus

The `getRewardStatus` endpoint has been renamed to `getTokenomicsInfo`.

The response has the same structure.

## getTransactionStatus

The `getTransactionStatus` has been replaced with the `getBlockItemStatus`.

The `GetBlockItemStatus` endpoints has the same information, but has a simpler structure, with better typing.

## getIdentityProviders

Returns a stream of identity providers instead of a list.

## getAnonymityRevokers

Returns a stream of anonymity revokers instead of a list.

## getBakerList

Returns a stream of BakerIds instead of a list.