// Functionality revolving concordium domain types and utitlity for working with these types.
export * from '../types.js';
export {
    getAccountTransactionHash,
    getAccountTransactionSignDigest,
    getCredentialDeploymentSignDigest,
    getCredentialForExistingAccountSignDigest,
    serializeAccountTransactionForSubmission,
    serializeAccountTransactionPayload,
    serializeAccountTransaction,
} from '../serialization.js';
export { encodeHexString } from '../serializationHelpers.js';
export { sha256 } from '../hash.js';

export { DataBlob } from '../types/DataBlob.js';
export * from '../types/VersionedModuleSource.js';
export {
    VerifiablePresentation,
    reviveDateFromTimeStampAttribute,
    replaceDateWithTimeStampAttribute,
} from '../types/VerifiablePresentation.js';

export { deserializeAccountTransaction } from '../deserialization.js';
export * from '../signHelpers.js';
export * from '../versionedTypeHelpers.js';
export * from '../accountHelpers.js';

export { isHex, streamToList, wasmToSchema, unwrap } from '../util.js';

export { getAccountTransactionHandler } from '../accountTransactions.js';
export * from '../energyCost.js';
export * from '../commonProofTypes.js';

export * from '../uleb128.js';
export {
    Schema,
    Contract,
    ContractDryRun,
    ContractSchema,
    ContractUpdateTransaction,
    ContractTransactionMetadata,
    CreateContractTransactionMetadata,
    ContractUpdateTransactionWithSchema,
} from '../GenericContract.js';

import * as ModuleClient from '../types/ModuleClient.js';
import * as Parameter from '../types/Parameter.js';
import * as ReturnValue from '../types/ReturnValue.js';
import * as SequenceNumber from '../types/SequenceNumber.js';
import * as Energy from '../types/Energy.js';
import * as TransactionHash from '../types/TransactionHash.js';
import * as BlockHash from '../types/BlockHash.js';
import * as ContractName from '../types/ContractName.js';
import * as InitName from '../types/InitName.js';
import * as ReceiveName from '../types/ReceiveName.js';
import * as CredentialRegistrationId from '../types/CredentialRegistrationId.js';
import * as AccountAddress from '../types/AccountAddress.js';
import * as ContractAddress from '../types/ContractAddress.js';
import * as EntrypointName from '../types/EntrypointName.js';
import * as Timestamp from '../types/Timestamp.js';
import * as Duration from '../types/Duration.js';
import * as CcdAmount from '../types/CcdAmount.js';
import * as TransactionExpiry from '../types/TransactionExpiry.js';
import * as ModuleReference from '../types/ModuleReference.js';
export {
    isJsonParseError,
    TypedJsonParseError,
    TypedJsonParseErrorType,
} from '../types/util.js';

// These cannot be exported directly as modules because of a bug in an eslint plugin.
// https://github.com/import-js/eslint-plugin-import/issues/2289.
export {
    ModuleClient,
    Parameter,
    ReturnValue,
    SequenceNumber,
    Energy,
    TransactionHash,
    BlockHash,
    ContractName,
    InitName,
    ReceiveName,
    CredentialRegistrationId,
    AccountAddress,
    ContractAddress,
    EntrypointName,
    Timestamp,
    Duration,
    CcdAmount,
    TransactionExpiry,
    ModuleReference,
};
