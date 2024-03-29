import * as InitName from './InitName.js';
import { isAsciiAlphaNumericPunctuation } from '../contractHelpers.js';
import {
    TypedJson,
    TypedJsonDiscriminator,
    makeFromTypedJson,
} from './util.js';

// IMPORTANT:
// When adding functionality to this module, it is important to not change the wrapper class, as changing this might break compatibility
// between different versions of the SDK, e.g. if a dependency exposes an API that depends on the class and a class from a different version
// of the SDK is passed.

/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 */
export const JSON_DISCRIMINATOR = TypedJsonDiscriminator.ContractName;
export type Serializable = string;

/** The name of a smart contract. Note: This does _not_ including the 'init_' prefix. */
class ContractName {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __type = JSON_DISCRIMINATOR;
    constructor(
        /** The internal string value of the contract name. */
        public readonly value: string
    ) {}
}

/**
 * Unwraps {@linkcode Type} value
 *
 * @param value value to unwrap.
 * @returns the unwrapped {@linkcode Serializable} value
 */
export function toUnwrappedJSON(value: Type): Serializable {
    return toString(value);
}

/** The name of a smart contract. Note: This does _not_ including the 'init_' prefix. */
export type Type = ContractName;

/**
 * Type predicate for {@linkcode Type}
 *
 * @param value value to check.
 * @returns whether `value` is of type {@linkcode Type}
 */
export function instanceOf(value: unknown): value is ContractName {
    return value instanceof ContractName;
}

/**
 * Create a contract name from a string, ensuring it follows the format of a contract name.
 * @param {string} value The string of the contract name.
 * @throws If the provided value is not a valid contract name.
 * @returns {ContractName}
 */
export function fromString(value: string): ContractName {
    if (value.length > 95) {
        throw new Error(
            'Invalid ContractName: Can be atmost 95 characters long.'
        );
    }
    if (value.includes('.')) {
        throw new Error(
            "Invalid ContractName: Must not contain a '.' character."
        );
    }
    if (!isAsciiAlphaNumericPunctuation(value)) {
        throw new Error(
            'Invalid ContractName: Must only contain ASCII alpha, numeric and punctuation characters.'
        );
    }
    return new ContractName(value);
}

/**
 * Create a contract name from a string, but _without_ ensuring it follows the format of a contract name.
 * It is up to the caller to validate the string is a contract name.
 * @param {string} value The string of the contract name.
 * @returns {ContractName}
 */
export function fromStringUnchecked(value: string): ContractName {
    return new ContractName(value);
}

/**
 * Extract the contract name from an {@link InitName.Type}.
 * @param {InitName.Type} initName The init-function name of a smart contract.
 * @returns {ContractName}
 */
export function fromInitName(initName: InitName.Type): ContractName {
    return fromStringUnchecked(initName.value.substring(5));
}

/**
 * Convert a contract name to a string
 * @param {ContractName} contractName The contract name to stringify.
 * @returns {string}
 */
export function toString(contractName: ContractName): string {
    return contractName.value;
}

/** Type used when encoding a contract name in the JSON format used when serializing using a smart contract schema type. */
export type SchemaValue = {
    contract: string;
};

/**
 * Get contract name in the JSON format used when serializing using a smart contract schema type.
 * @param {ContractName} contractName The contract name.
 * @returns {SchemaValue} The schema JSON representation.
 */
export function toSchemaValue(contractName: ContractName): SchemaValue {
    return { contract: contractName.value };
}

/**
 * Convert to contract name from JSON format used when serializing using a smart contract schema type.
 * @param {SchemaValue} contractName The contract name in schema JSON format.
 * @returns {ContractName} The contract name.
 */
export function fromSchemaValue(contractName: SchemaValue): ContractName {
    return fromString(contractName.contract);
}

/**
 * Check if two contract names represent the same name of a contract.
 * @param {ContractName} left
 * @param {ContractName} right
 * @returns {boolean} True if they are equal.
 */
export function equals(left: ContractName, right: ContractName): boolean {
    return left.value === right.value;
}

/**
 * Takes an {@linkcode Type} and transforms it to a {@linkcode TypedJson} format.
 *
 * @param {Type} value - The account address instance to transform.
 * @returns {TypedJson} The transformed object.
 */
export function toTypedJSON(value: ContractName): TypedJson<Serializable> {
    return {
        ['@type']: JSON_DISCRIMINATOR,
        value: toString(value),
    };
}

/**
 * Takes a {@linkcode TypedJson} object and converts it to instance of type {@linkcode Type}.
 *
 * @param {TypedJson} json - The typed JSON to convert.
 * @throws {TypedJsonParseError} - If unexpected JSON string is passed.
 * @returns {Type} The parsed instance.
 */
export const fromTypedJSON = /*#__PURE__*/ makeFromTypedJson(
    JSON_DISCRIMINATOR,
    fromString
);
