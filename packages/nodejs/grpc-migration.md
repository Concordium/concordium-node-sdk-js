# Migration guide from GRPCv1 to v2:

## General:
Blockhash inputs are now optional, and if given must be given as a hex encoded string. If the blockhash is not given the function will use the last final block.


## GetBlockSummary

The `GetBlockSummary` endpoint has been split up.

To access the chain parameters, use the `getBlockChainParameters` endpoint, which corresponds to the `blockSummary.updates.chainParameters`,
except that the foundationAccountIndex field is no longer present, instead the foundationAccount field is present and contains the account address of the foundation account instead of the account index,

## GetPoolStatus

The `GetPoolStatus` endpoint has been split up into two separate endpoints.

For the status and information on a specific baker pool, use the `getPoolInfo` endpoint.
for information on passive delegators, use the `getPassiveDelegationInfo` endpoint.
