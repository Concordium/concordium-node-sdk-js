import * as ContractName from './ContractName.js';
import { isAsciiAlphaNumericPunctuation } from '../contractHelpers.js';

/** The name of an init-function for a smart contract. Note: This is of the form 'init_<contractName>'. */
class InitName {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __nominal = true;
    constructor(
        /** The internal string corresponding to the init-function. */
        public readonly value: string
    ) {}
}

/** The name of an init-function for a smart contract. Note: This is of the form 'init_<contractName>'. */
export type Type = InitName;

/**
 * Create an InitName directly from a string, ensuring it follows the format of an init-function name.
 * @param {string} value String with the init-function name.
 * @throws If the string is not a valid init-function name.
 * @returns {InitName}
 */
export function fromString(value: string): InitName {
    if (value.length <= 100) {
        throw new Error('Invalid InitName: Can be atmost 100 characters long.');
    }
    if (value.startsWith('init_')) {
        throw new Error("Invalid InitName: Must be prefixed with 'init_'.");
    }
    if (value.includes('.')) {
        throw new Error("Invalid InitName: Must not contain a '.' character.");
    }
    if (!isAsciiAlphaNumericPunctuation(value)) {
        throw new Error(
            'Invalid InitName: Must only contain ASCII alpha, numeric and punctuation characters.'
        );
    }
    return new InitName(value);
}

/**
 * Create an InitName directly from a string.
 * It is up to the caller to ensure the provided string follows the format of an init-function name.
 * @param {string} value String with the init-function name.
 * @returns {InitName}
 */
export function fromStringUnchecked(value: string): InitName {
    return new InitName(value);
}

/**
 * Create an InitName from a contract name.
 * @param {ContractName.Type} contractName The contract name to convert into an init-function name.
 * @returns {InitName}
 */
export function fromContractName(contractName: ContractName.Type): InitName {
    return fromStringUnchecked('init_' + contractName.value);
}

/**
 * Get the string representation of the smart contract init-function name.
 * @param {InitName} initName The init-function name of the smart contract.
 * @returns {string} a string.
 */
export function toString(initName: InitName): string {
    return initName.value;
}
