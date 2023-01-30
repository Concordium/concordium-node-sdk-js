# Upgrade Guide

## Common SDK version 5 to 6 (Web 2->3) (Node 5->6) 
Some classes and types have been renamed or changed, and should be update if used.

### AccountTransactionType
Some types in the AccountTransactionType enum have been changed to align with other languages.

- InitializeSmartContractInstance -> InitContract
- UpdateSmartContractInstance -> Update
- SimpleTransfer -> Transfer
- EncryptedTransfer -> EncryptedAmountTransfer
- SimpleTransferWithMemo -> TransferWithMemo
- EncryptedTransferWithMemo -> EncryptedAmountTransferWithMemo

### GtuAmount
The `GtuAmount` class has been renamed to `CcdAmount` to reflect the current name of token.
If an object was used in place of a class instance, the field `microGtuAmount` should be renamed to `microCcdAmount`.

### DeployModule
The field `content` has been renamed to `source` to align with other languages.

### UpdateConcractPayload
Field names have been renamed to align with other languages.
`contractAddress` field has been renamed to `address`.
`parameter` field has been renamed to `message`.

### InitContractPayload
Field names have been renamed to align with other languages.
`contractName` field has been renamed to `initName`.
`parameter` field has been renamed to `params`.
