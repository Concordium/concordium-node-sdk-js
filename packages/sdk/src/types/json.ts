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
function transformConcordiumType(value: unknown): unknown | undefined {
    switch (true) {
        case AccountAddress.instanceOf(value):
            return AccountAddress.toTypedJSON(value as AccountAddress.Type);
        case BlockHash.instanceOf(value):
            return BlockHash.toTypedJSON(value as BlockHash.Type);
        case CcdAmount.instanceOf(value):
            return CcdAmount.toTypedJSON(value as CcdAmount.Type);
        case ContractAddress.instanceOf(value):
            return ContractAddress.toTypedJSON(value as ContractAddress.Type);
        case ContractName.instanceOf(value):
            return ContractName.toTypedJSON(value as ContractName.Type);
        case CredentialRegistrationId.instanceOf(value):
            return CredentialRegistrationId.toTypedJSON(
                value as CredentialRegistrationId.Type
            );
        case value instanceof DataBlob:
            return (value as DataBlob).toTypedJSON();
        case Duration.instanceOf(value):
            return Duration.toTypedJSON(value as Duration.Type);
        case Energy.instanceOf(value):
            return Energy.toTypedJSON(value as Energy.Type);
        case EntrypointName.instanceOf(value):
            return EntrypointName.toTypedJSON(value as EntrypointName.Type);
        case InitName.instanceOf(value):
            return InitName.toTypedJSON(value as InitName.Type);
        case ModuleReference.instanceOf(value):
            return ModuleReference.toTypedJSON(value as ModuleReference.Type);
        case Parameter.instanceOf(value):
            return Parameter.toTypedJSON(value as Parameter.Type);
        case ReceiveName.instanceOf(value):
            return ReceiveName.toTypedJSON(value as ReceiveName.Type);
        case ReturnValue.instanceOf(value):
            return ReturnValue.toTypedJSON(value as ReturnValue.Type);
        case SequenceNumber.instanceOf(value):
            return SequenceNumber.toTypedJSON(value as SequenceNumber.Type);
        case Timestamp.instanceOf(value):
            return Timestamp.toTypedJSON(value as Timestamp.Type);
        case TransactionExpiry.instanceOf(value):
            return TransactionExpiry.toTypedJSON(
                value as TransactionExpiry.Type
            );
        case TransactionHash.instanceOf(value):
            return TransactionHash.toTypedJSON(value as TransactionHash.Type);
    }

    return undefined;
}

type ReplacerFun = (this: any, key: string, value: any) => any;

function ccdTypesReplacer(this: any, key: string, value: any): any {
    const rawValue = this[key];
    return transformConcordiumType(rawValue) ?? value;
}

/**
 * Stringify, which ensures concordium domain types are stringified in a restorable fashion.
 *
 * @param value A JavaScript value, usually an object or array, to be converted.
 * @param replacer A function that transforms the results.
 * @param space Adds indentation, white space, and line break characters to the return-value JSON text to make it easier to read.
 */
export function jsonStringify(
    input: any,
    replacer?: ReplacerFun,
    space?: string | number
): string {
    function replacerFunction(this: any, key: string, value: any) {
        const transformedValue = ccdTypesReplacer.call(this, key, value);
        return replacer?.call(this, key, transformedValue) ?? transformedValue;
    }
    return JSON.stringify(input, replacerFunction, space);
}
