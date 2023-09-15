import * as InitName from './InitName.js';
import { isAsciiAlphaNumericPunctuation } from '../contractHelpers.js';

/** The name of a smart contract. Note: This does _not_ including the 'init_' prefix. */
class ContractName {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __nominal = true;
    constructor(
        /** The internal string value of the contract name. */
        public readonly value: string
    ) {}
}

/** The name of a smart contract. Note: This does _not_ including the 'init_' prefix. */
export type Type = ContractName;

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

/** Type used when encoding a contract name for the schema. */
export type SchemaValue = {
    contract: string;
};

/**
 * Get contract name in the format used by schema.
 * @param {ContractName} contractName The contract name.
 * @returns {SchemaValue} The schema value representation.
 */
export function toSchemaValue(contractName: ContractName): SchemaValue {
    return { contract: contractName.value };
}
