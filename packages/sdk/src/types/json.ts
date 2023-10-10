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
import { TypedJson, isTypedJsonCandidate } from './util.js';

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
function transformConcordiumType(
    value: unknown
):
    | { transformed: true; value: TypedJson<unknown> }
    | { transformed: false; value: unknown } {
    let newValue: TypedJson<unknown> | undefined = undefined;
    switch (true) {
        case AccountAddress.instanceOf(value):
            newValue = AccountAddress.toTypedJSON(value as AccountAddress.Type);
            break;
        case BlockHash.instanceOf(value):
            newValue = BlockHash.toTypedJSON(value as BlockHash.Type);
            break;
        case CcdAmount.instanceOf(value):
            newValue = CcdAmount.toTypedJSON(value as CcdAmount.Type);
            break;
        case ContractAddress.instanceOf(value):
            newValue = ContractAddress.toTypedJSON(
                value as ContractAddress.Type
            );
            break;
        case ContractName.instanceOf(value):
            newValue = ContractName.toTypedJSON(value as ContractName.Type);
            break;
        case CredentialRegistrationId.instanceOf(value):
            newValue = CredentialRegistrationId.toTypedJSON(
                value as CredentialRegistrationId.Type
            );
            break;
        case value instanceof DataBlob:
            newValue = (value as DataBlob).toTypedJSON();
            break;
        case Duration.instanceOf(value):
            newValue = Duration.toTypedJSON(value as Duration.Type);
            break;
        case Energy.instanceOf(value):
            newValue = Energy.toTypedJSON(value as Energy.Type);
            break;
        case EntrypointName.instanceOf(value):
            newValue = EntrypointName.toTypedJSON(value as EntrypointName.Type);
            break;
        case InitName.instanceOf(value):
            newValue = InitName.toTypedJSON(value as InitName.Type);
            break;
        case ModuleReference.instanceOf(value):
            newValue = ModuleReference.toTypedJSON(
                value as ModuleReference.Type
            );
            break;
        case Parameter.instanceOf(value):
            newValue = Parameter.toTypedJSON(value as Parameter.Type);
            break;
        case ReceiveName.instanceOf(value):
            newValue = ReceiveName.toTypedJSON(value as ReceiveName.Type);
            break;
        case ReturnValue.instanceOf(value):
            newValue = ReturnValue.toTypedJSON(value as ReturnValue.Type);
            break;
        case SequenceNumber.instanceOf(value):
            newValue = SequenceNumber.toTypedJSON(value as SequenceNumber.Type);
            break;
        case Timestamp.instanceOf(value):
            newValue = Timestamp.toTypedJSON(value as Timestamp.Type);
            break;
        case TransactionExpiry.instanceOf(value):
            newValue = TransactionExpiry.toTypedJSON(
                value as TransactionExpiry.Type
            );
            break;
        case TransactionHash.instanceOf(value):
            newValue = TransactionHash.toTypedJSON(
                value as TransactionHash.Type
            );
            break;
    }

    if (newValue !== undefined) {
        return { transformed: true, value: newValue };
    }

    return { transformed: false, value };
}

type ReplacerFun = (this: any, key: string, value: any) => any;

function transformConcordiumTypes(obj: unknown, replacer?: ReplacerFun) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    type StackItem = {
        obj: Record<string, any>;
        path: string[];
    };

    const stack: StackItem[] = [{ obj, path: [] }];
    const result: Record<string, any> = { ...obj };

    while (stack.length) {
        const item = stack[0];
        for (const k in item.obj) {
            // Transform concordium types first.
            const { transformed, value } = transformConcordiumType(item.obj[k]);
            // Then run values through user defined replacer function.
            const jsonValue =
                (value as any).toJSON?.() ??
                replacer?.call(item.obj, k, value) ??
                value;

            // Find the node matching the path registered for the object.
            const local = item.path.reduce((acc, key) => acc[key], result);
            if (transformed) {
                local[k] = jsonValue;
            } else if (typeof jsonValue === 'object' && jsonValue !== null) {
                // If the value was not replaced and is a valid object, push it to the stack.
                stack.push({ obj: jsonValue, path: [...item.path, k] });
                // And override the value with a shallow copy to avoid modifying the original.
                local[k] = { ...jsonValue };
            }
        }

        stack.shift();
    }

    return result;
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
    replacer?: ReplacerFun,
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
    // const mapValues = (v: any): any => {
    //     if (v === undefined || v === null || typeof v !== 'object') return v;
    //     return Object.entries(v)
    //         .map(([k, v]) => [k, mapValues(replaceConcordiumType(v))])
    //         .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
    // };
    //

    return JSON.stringify(
        // Runs replace function for concordium types prior to JSON.stringify, as otherwise
        // an attempt to run `toJSON` on objects is done before any replacer function.
        transformConcordiumTypes(
            input,
            typeof replacer === 'function' ? replacer : undefined
        ),
        typeof replacer === 'function' ? undefined : replacer,
        space
    );
}
