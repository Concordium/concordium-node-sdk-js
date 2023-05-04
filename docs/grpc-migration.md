# Migration guide from Concordium gRPC v1 to v2:

## General:
Blockhash inputs are now optional, and if given must be given as a hex encoded string. If the blockhash is not given the function will use the last final block.

## GetBlockSummary

The `getBlockSummary` endpoint has been split up in the following endpoints:

 - getBlockChainParameters
 - getBlockSpecialEvents
 - getBlockFinalizationSummary
 - getBlockTransactionEvents
 - getBlockPendingUpdates
 - getNextUpdateSequenceNumbers

To access the chain parameters, use the `getBlockChainParameters` endpoint, which corresponds to the `blockSummary.updates.chainParameters` field,
except that the foundationAccountIndex field is no longer present, instead the foundationAccount field is present and contains the account address of the foundation account instead of the account index,
Note that this also contains the `blockSummary.updates.keys` field.

To access any pending updates at the time of the block, use the `getBlockPendingUpdates` endpoint, which corresponds to the `blockSummary.updates.updateQueues.*.queue` fields.
Note that this endpoint now returns a stream of the pending updates in block.

To access the next sequence number for any updates, use the `getNextUpdateSequenceNumbers` endpoint, which corresponds to `blockSummary.updates.updateQueues.*.nextSequenceNumber` fields.

To access the special events from the block, use the 'getBlockSpecialEvents', which corresponds to the `blockSummary.specialEvents` field.
Note that this endpoint now returns a stream of the special events in the block.

To access the finalization data, which was previously found in the `blockSummary.finalizationData` field, use the `getBlockFinalizationSummary` endpoints.
Note that the structure of the data has been changed, both how it is wrapped and the field names.

To access the events generated from the transactions in the block, use the `getBlockTransactionEvents` endpoint. This replaces the  `blockSummary.transactionSummaries`, but note that structure is different.

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
