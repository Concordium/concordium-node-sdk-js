import * as ContractName from '../types/ContractName.js';
import * as CredentialRegistrationId from '../types/CredentialRegistrationId.js';
import * as EntrypointName from '../types/EntrypointName.js';
import * as ModuleClient from '../types/ModuleClient.js';
// To limit the exports meant only for internal use, we re-create the module exports.
import * as AccountAddress from './types/AccountAddress.js';
import * as BlockHash from './types/BlockHash.js';
import * as CcdAmount from './types/CcdAmount.js';
import * as ContractAddress from './types/ContractAddress.js';
import * as ContractEvent from './types/ContractEvent.js';
import * as Duration from './types/Duration.js';
import * as Energy from './types/Energy.js';
import * as InitName from './types/InitName.js';
import * as ModuleReference from './types/ModuleReference.js';
import * as Parameter from './types/Parameter.js';
import * as ReceiveName from './types/ReceiveName.js';
import * as ReturnValue from './types/ReturnValue.js';
import * as SequenceNumber from './types/SequenceNumber.js';
import * as Timestamp from './types/Timestamp.js';
import * as TransactionExpiry from './types/TransactionExpiry.js';
import * as TransactionHash from './types/TransactionHash.js';

// Functionality revolving concordium domain types and utitlity for working with these types.
export * from '../types.js';
export { DataBlob } from '../types/DataBlob.js';
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

export { isHex, streamToList, unwrap } from '../util.js';

export * from '../accountTransactions.js';
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
    ContractInvokeMetadata,
    CreateContractTransactionMetadata,
    ContractUpdateTransactionWithSchema,
} from '../GenericContract.js';

export { TypedJsonParseError, TypedJsonParseErrorCode, TypedJson } from '../types/util.js';
export { jsonParse, jsonStringify, jsonUnwrapStringify, BigintFormatType } from '../types/json.js';

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
    ContractEvent,
    CcdAmount,
    TransactionExpiry,
    ModuleReference,
};

export * from '../types/cbor.js';
