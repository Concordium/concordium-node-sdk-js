/* eslint-disable @typescript-eslint/no-explicit-any */
import * as Parameter from './Parameter.js';
import * as ReturnValue from './ReturnValue.js';
import * as SequenceNumber from './SequenceNumber.js';
import * as Energy from './Energy.js';
import * as TransactionHash from './TransactionHash.js';
import * as BlockHash from './BlockHash.js';
import * as ContractName from './ContractName.js';
import * as InitName from './InitName.js';
import * as ReceiveName from './ReceiveName.js';
import * as CredentialRegistrationId from './CredentialRegistrationId.js';
import * as AccountAddress from './AccountAddress.js';
import * as ContractAddress from './ContractAddress.js';
import * as EntrypointName from './EntrypointName.js';
import * as Timestamp from './Timestamp.js';
import * as Duration from './Duration.js';
import * as CcdAmount from './CcdAmount.js';
import * as TransactionExpiry from './TransactionExpiry.js';
import * as ModuleReference from './ModuleReference.js';
import {
    DataBlob,
    JSON_DISCRIMINATOR as DATA_BLOB_DISCRIMINATOR,
} from './DataBlob.js';

function reviveConcordiumTypes(value: any) {
    if (value) {
        switch (value['@type']) {
            case Parameter.JSON_DISCRIMINATOR:
                return Parameter.fromTypedJSON(value);
            case ReturnValue.JSON_DISCRIMINATOR:
                return ReturnValue.fromTypedJSON(value);
            case SequenceNumber.JSON_DISCRIMINATOR:
                return SequenceNumber.fromTypedJSON(value);
            case Energy.JSON_DISCRIMINATOR:
                return Energy.fromTypedJSON(value);
            case TransactionHash.JSON_DISCRIMINATOR:
                return TransactionHash.fromTypedJSON(value);
            case BlockHash.JSON_DISCRIMINATOR:
                return BlockHash.fromTypedJSON(value);
            case ContractName.JSON_DISCRIMINATOR:
                return ContractName.fromTypedJSON(value);
            case InitName.JSON_DISCRIMINATOR:
                return InitName.fromTypedJSON(value);
            case ReceiveName.JSON_DISCRIMINATOR:
                return ReceiveName.fromTypedJSON(value);
            case CredentialRegistrationId.JSON_DISCRIMINATOR:
                return CredentialRegistrationId.fromTypedJSON(value);
            case AccountAddress.JSON_DISCRIMINATOR:
                return AccountAddress.fromTypedJSON(value);
            case ContractAddress.JSON_DISCRIMINATOR:
                return ContractAddress.fromTypedJSON(value);
            case EntrypointName.JSON_DISCRIMINATOR:
                return EntrypointName.fromTypedJSON(value);
            case Timestamp.JSON_DISCRIMINATOR:
                return Timestamp.fromTypedJSON(value);
            case Duration.JSON_DISCRIMINATOR:
                return Duration.fromTypedJSON(value);
            case CcdAmount.JSON_DISCRIMINATOR:
                return CcdAmount.fromTypedJSON(value);
            case TransactionExpiry.JSON_DISCRIMINATOR:
                return TransactionExpiry.fromTypedJSON(value);
            case ModuleReference.JSON_DISCRIMINATOR:
                return ModuleReference.fromTypedJSON(value);
            case DATA_BLOB_DISCRIMINATOR:
                return DataBlob.fromTypedJSON(value);
        }
    }

    return undefined;
}

/**
 * Acts as an inverse for {@linkcode jsonStringify}
 */
export function jsonParse(
    input: string | undefined,
    reviver?: (this: any, key: string, value: any) => any
): any {
    if (!input) {
        return undefined;
    }
    return JSON.parse(
        input,
        (k, v) => reviveConcordiumTypes(k) ?? reviver?.(k, v) ?? v
    );
}

function replaceConcordiumTypes(value: any) {
    switch (true) {
        case value instanceof AccountAddress.Type:
            return (value as AccountAddress.Type).toTypedJSON();
        case value instanceof BlockHash.Type:
            return (value as BlockHash.Type).toTypedJSON();
        case value instanceof CcdAmount.Type:
            return (value as CcdAmount.Type).toTypedJSON();
        case value instanceof ContractAddress.Type:
            return (value as ContractAddress.Type).toTypedJSON();
        case value instanceof ContractName.Type:
            return (value as ContractName.Type).toTypedJSON();
        case value instanceof CredentialRegistrationId.Type:
            return (value as CredentialRegistrationId.Type).toTypedJSON();
        case value instanceof DataBlob:
            return (value as DataBlob).toTypedJSON();
        case value instanceof Duration.Type:
            return (value as Duration.Type).toTypedJSON();
        case value instanceof Energy.Type:
            return (value as Energy.Type).toTypedJSON();
        case value instanceof EntrypointName.Type:
            return (value as EntrypointName.Type).toTypedJSON();
        case value instanceof InitName.Type:
            return (value as InitName.Type).toTypedJSON();
        case value instanceof ModuleReference.Type:
            return (value as ModuleReference.Type).toTypedJSON();
        case value instanceof Parameter.Type:
            return (value as Parameter.Type).toTypedJSON();
        case value instanceof ReceiveName.Type:
            return (value as ReceiveName.Type).toTypedJSON();
        case value instanceof ReturnValue.Type:
            return (value as ReturnValue.Type).toTypedJSON();
        case value instanceof SequenceNumber.Type:
            return (value as SequenceNumber.Type).toTypedJSON();
        case value instanceof Timestamp.Type:
            return (value as Timestamp.Type).toTypedJSON();
        case value instanceof TransactionExpiry.Type:
            return (value as TransactionExpiry.Type).toTypedJSON();
        case value instanceof TransactionHash.Type:
            return (value as TransactionHash.Type).toTypedJSON();
    }

    return value;
}

/**
 * Stringify, which ensures concordium domain types are stringified in a restorable fashion.
 */
export function jsonStringify(
    input: any,
    replacer?: (this: any, key: string, value: any) => any
): string {
    return JSON.stringify(
        input,
        (k, v) => replaceConcordiumTypes(v) ?? replacer?.(k, v) ?? v
    );
}
