/* eslint-disable @typescript-eslint/no-explicit-any */
import JSONBig from 'json-bigint';

import * as AccountAddress from './AccountAddress.js';
import * as BlockHash from './BlockHash.js';
import * as CcdAmount from './CcdAmount.js';
import * as ContractAddress from './ContractAddress.js';
import * as ContractName from './ContractName.js';
import * as CredentialRegistrationId from './CredentialRegistrationId.js';
import { JSON_DISCRIMINATOR as DATA_BLOB_DISCRIMINATOR, DataBlob } from './DataBlob.js';
import * as Duration from './Duration.js';
import * as Energy from './Energy.js';
import * as EntrypointName from './EntrypointName.js';
import * as InitName from './InitName.js';
import * as ModuleReference from './ModuleReference.js';
import * as Parameter from './Parameter.js';
import * as ReceiveName from './ReceiveName.js';
import * as ReturnValue from './ReturnValue.js';
import * as SequenceNumber from './SequenceNumber.js';
import * as Timestamp from './Timestamp.js';
import * as TransactionExpiry from './TransactionExpiry.js';
import * as TransactionHash from './TransactionHash.js';
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
 * Acts as an inverse for {@linkcode jsonStringify}.
 * @deprecated Manually convert the JSON structure instead. For account transactions,
 * parse the output with something that handles deserializing`bigint`s, e.g. the
 * `json-bigint` dependency, and use `AccountTransactionHandler.fromJSON`.
 */
export function jsonParse(input: string, reviver?: (this: any, key: string, value: any) => any): any {
    return JSON.parse(input, (k, v) =>
        reviver === undefined ? reviveConcordiumTypes(v) : reviver(k, reviveConcordiumTypes(v))
    );
}

/**
 * Replaces values of concordium domain types with values that can be revived into their original types. Returns undefined if type cannot be matched.
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
            return CredentialRegistrationId.toTypedJSON(value as CredentialRegistrationId.Type);
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
            return TransactionExpiry.toTypedJSON(value as TransactionExpiry.Type);
        case TransactionHash.instanceOf(value):
            return TransactionHash.toTypedJSON(value as TransactionHash.Type);
    }

    return undefined;
}

/**
 * Replaces values of concordium domain types with their unwrapped values. Returns undefined if type cannot be matched.
 */
function unwrapConcordiumType(value: unknown): unknown | undefined {
    switch (true) {
        case AccountAddress.instanceOf(value):
            return AccountAddress.toUnwrappedJSON(value as AccountAddress.Type);
        case BlockHash.instanceOf(value):
            return BlockHash.toUnwrappedJSON(value as BlockHash.Type);
        case CcdAmount.instanceOf(value):
            return (value as CcdAmount.Type).toJSON();
        case ContractAddress.instanceOf(value):
            return ContractAddress.toUnwrappedJSON(value as ContractAddress.Type);
        case ContractName.instanceOf(value):
            return ContractName.toUnwrappedJSON(value as ContractName.Type);
        case CredentialRegistrationId.instanceOf(value):
            return (value as CredentialRegistrationId.Type).toJSON();
        case value instanceof DataBlob:
            return (value as DataBlob).toJSON();
        case Duration.instanceOf(value):
            return Duration.toUnwrappedJSON(value as Duration.Type);
        case Energy.instanceOf(value):
            return Energy.toUnwrappedJSON(value as Energy.Type);
        case EntrypointName.instanceOf(value):
            return EntrypointName.toUnwrappedJSON(value as EntrypointName.Type);
        case InitName.instanceOf(value):
            return InitName.toUnwrappedJSON(value as InitName.Type);
        case ModuleReference.instanceOf(value):
            return ModuleReference.toUnwrappedJSON(value as ModuleReference.Type);
        case Parameter.instanceOf(value):
            return Parameter.toUnwrappedJSON(value as Parameter.Type);
        case ReceiveName.instanceOf(value):
            return ReceiveName.toUnwrappedJSON(value as ReceiveName.Type);
        case ReturnValue.instanceOf(value):
            return ReturnValue.toUnwrappedJSON(value as ReturnValue.Type);
        case SequenceNumber.instanceOf(value):
            return SequenceNumber.toUnwrappedJSON(value as SequenceNumber.Type);
        case Timestamp.instanceOf(value):
            return Timestamp.toUnwrappedJSON(value as Timestamp.Type);
        case TransactionExpiry.instanceOf(value):
            return TransactionExpiry.toUnwrappedJSON(value as TransactionExpiry.Type);
        case TransactionHash.instanceOf(value):
            return TransactionHash.toUnwrappedJSON(value as TransactionHash.Type);
    }

    return undefined;
}

type ReplacerFun = (this: any, key: string, value: any) => any;

function ccdTypesReplacer(this: any, key: string, value: any): any {
    const rawValue = this[key];
    return transformConcordiumType(rawValue) ?? value;
}

function ccdUnwrapReplacer(this: any, key: string, value: any): any {
    const rawValue = this[key];
    return unwrapConcordiumType(rawValue) ?? value;
}

/**
 * Stringify, which ensures concordium domain types are stringified in a restorable fashion.
 * This should be used if you want to be able to restore the concordium domain types in the JSON to its original types.
 * @deprecated Manually convert the object to the preferred JSON structure instead. For account transactions,
 * use `AccountTransactionHandler.toJSON` prior to invoking `JSON.stringify`. It's up to the developer to
 * handle serialization of `bigints`, e.g. with the `json-bigint` dependency.
 *
 * @param value A JavaScript value, usually an object or array, to be converted.
 * @param replacer A function that transforms the results.
 * @param space Adds indentation, white space, and line break characters to the return-value JSON text to make it easier to read.
 */
export function jsonStringify(input: any, replacer?: ReplacerFun, space?: string | number): string {
    function replacerFunction(this: any, key: string, value: any) {
        const transformedValue = ccdTypesReplacer.call(this, key, value);
        return replacer?.call(this, key, transformedValue) ?? transformedValue;
    }
    return JSON.stringify(input, replacerFunction, space);
}

/**
 * Describes how bigints encountered in {@linkcode jsonUnwrapStringify} are handled by default.
 */
export const enum BigintFormatType {
    /** Use 'json-bigint' to safely convert `bigint`s to integers */
    Integer,
    /** Convert `bigint`s to strings */
    String,
    /** Do nothing, i.e. must be handled manually in replacer function. */
    None,
}

/**
 * Stringify, which ensures concordium domain types are unwrapped to their inner type before stringified.
 * This should be used if you want to manually deserialize the inner property values, as the serialization is irreversible.
 * @deprecated Manually convert the object to the preferred JSON structure instead. For account transactions,
 * use `AccountTransactionHandler.toJSON` prior to invoking `JSON.stringify`. It's up to the developer to
 * handle serialization of `bigints`, e.g. with the `json-bigint` dependency.
 *
 * @param value A JavaScript value, usually an object or array, to be converted.
 * @param bigintFormat Determines how to handle bigints. Can be set to either:
 * - `BigintFormatType.Number`: uses 'json-bigint to safely serialize,
 * - `BigintFormatType.String`: converts `bigint` to strings
 * - `BigintFormatType.None`: must be taken care of manually, e.g. in replacer function.
 * Defaults to BigintFormatType.None
 * @param replacer A function that transforms the results.
 * This overrides `bigintFormat`, and will also run on primitive values passed as `value.`
 * @param space Adds indentation, white space, and line break characters to the return-value JSON text to make it easier to read.
 *
 * @example
 * jsonUnwrapStringify(100n) => throws `TypeError`, as bigints cannot be serialized.
 * jsonUnwrapStringify(100n, BigintFormatType.None) => throws `TypeError`
 * jsonUnwrapStringify(100n, BigintFormatType.None, (_key, value) => 'replaced') => '"replaced"'
 *
 * jsonUnwrapStringify(100n, BigintFormatType.Number) => '100'
 * jsonUnwrapStringify(100n, BigintFormatType.Number, (_key, value) => -value) => '-100' // runs both replacer and bigintFormat
 * jsonUnwrapStringify(100n, BigintFormatType.Number, (_key, value) => 'replaced') => '"replaced"' // replacer takes precedence
 *
 * jsonUnwrapStringify(100n, BigintFormatType.String) => '"100"'
 * jsonUnwrapStringify(100n, BigintFormatType.String, (_key, value) => -value) => '"-100"' // runs both replacer and bigintFormat
 * jsonUnwrapStringify(100n, BigintFormatType.String, (_key, value) => 10) => '10' // replacer takes precedence
 */
export function jsonUnwrapStringify(
    input: any,
    bigintFormat = BigintFormatType.None,
    replacer?: ReplacerFun,
    space?: string | number
): string {
    function replaceBigintValue(value: any): any {
        switch (bigintFormat) {
            case BigintFormatType.String:
                if (typeof value === 'bigint') {
                    return value.toString();
                }
            default:
                return value;
        }
    }

    function replacerFunction(this: any, key: string, value: any) {
        let replaced = ccdUnwrapReplacer.call(this, key, value);
        replaced = replacer?.call(this, key, replaced) ?? replaced;
        return replaceBigintValue(replaced);
    }

    let replaced = input;
    if (typeof input !== 'object') {
        replaced = replacer?.call(replaced, '', replaced) ?? replaced;
        replaced = replaceBigintValue(replaced);
    }

    const stringify = bigintFormat === BigintFormatType.Integer ? JSONBig.stringify : JSON.stringify;
    return stringify(replaced, replacerFunction, space);
}
