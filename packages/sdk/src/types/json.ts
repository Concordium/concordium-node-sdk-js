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
import { isTypedJsonCandidate } from './util.js';

function reviveConcordiumTypes(value: unknown) {
    if (isTypedJsonCandidate(value)) {
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

    return value;
}

/**
 * Acts as an inverse for {@linkcode jsonStringify}
 */
export function jsonParse(
    input: string,
    reviver?: (this: any, key: string, value: any) => any
): any {
    return JSON.parse(input, (k, v) =>
        reviver === undefined
            ? reviveConcordiumTypes(v)
            : reviver(k, reviveConcordiumTypes(v))
    );
}

/**
 * Replaces values of concordium domain types with values that can be revived into their original types.
 */
function replaceConcordiumType(value: unknown) {
    switch (true) {
        case AccountAddress.instanceOf(value):
            return (value as AccountAddress.Type).toTypedJSON();
        case BlockHash.instanceOf(value):
            return (value as BlockHash.Type).toTypedJSON();
        case CcdAmount.instanceOf(value):
            return (value as CcdAmount.Type).toTypedJSON();
        case ContractAddress.instanceOf(value):
            return (value as ContractAddress.Type).toTypedJSON();
        case ContractName.instanceOf(value):
            return (value as ContractName.Type).toTypedJSON();
        case CredentialRegistrationId.instanceOf(value):
            return (value as CredentialRegistrationId.Type).toTypedJSON();
        case value instanceof DataBlob:
            return (value as DataBlob).toTypedJSON();
        case Duration.instanceOf(value):
            return (value as Duration.Type).toTypedJSON();
        case Energy.instanceOf(value):
            return (value as Energy.Type).toTypedJSON();
        case EntrypointName.instanceOf(value):
            return (value as EntrypointName.Type).toTypedJSON();
        case InitName.instanceOf(value):
            return (value as InitName.Type).toTypedJSON();
        case ModuleReference.instanceOf(value):
            return (value as ModuleReference.Type).toTypedJSON();
        case Parameter.instanceOf(value):
            return (value as Parameter.Type).toTypedJSON();
        case ReceiveName.instanceOf(value):
            return (value as ReceiveName.Type).toTypedJSON();
        case ReturnValue.instanceOf(value):
            return (value as ReturnValue.Type).toTypedJSON();
        case SequenceNumber.instanceOf(value):
            return (value as SequenceNumber.Type).toTypedJSON();
        case Timestamp.instanceOf(value):
            return (value as Timestamp.Type).toTypedJSON();
        case TransactionExpiry.instanceOf(value):
            return (value as TransactionExpiry.Type).toTypedJSON();
        case TransactionHash.instanceOf(value):
            return (value as TransactionHash.Type).toTypedJSON();
    }

    return value;
}

/**
 * Stringify, which ensures concordium domain types are stringified in a restorable fashion.
 *
 * @param value A JavaScript value, usually an object or array, to be converted.
 * @param replacer A function that transforms the results.
 * @param space Adds indentation, white space, and line break characters to the return-value JSON text to make it easier to read.
 */
export function jsonStringify(
    value: any,
    replacer?: (this: any, key: string, value: any) => any,
    space?: string | number
): string;
/**
 * Stringify, which ensures concordium domain types are stringified in a restorable fashion.
 *
 * @param value A JavaScript value, usually an object or array, to be converted.
 * @param replacer An array of strings and numbers that acts as an approved list for selecting the object properties that will be stringified.
 * @param space Adds indentation, white space, and line break characters to the return-value JSON text to make it easier to read.
 */
export function jsonStringify(
    value: any,
    replacer?: (number | string)[] | null,
    space?: string | number
): string;
export function jsonStringify(
    input: any,
    replacer?: any,
    space?: string | number
): string {
    /**
     * Recursively maps concordium domain types to values that can be revived into their original types.
     */
    const mapValues = (v: any): any => {
        if (v === undefined || v === null || typeof v !== 'object') return v;
        return Object.entries(v)
            .map(([k, v]) => [k, mapValues(replaceConcordiumType(v))])
            .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
    };

    return JSON.stringify(
        // Runs replace function for concordium types prior to JSON.stringify, as otherwise
        // an attempt to run `toJSON` on objects is done before any replacer function.
        mapValues(input),
        replacer,
        space
    );
}
