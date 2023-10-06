import * as InitName from './InitName.js';
import { isAsciiAlphaNumericPunctuation } from '../contractHelpers.js';
import { TypeBase, TypedJsonDiscriminator, makeFromTypedJson } from './util.js';

/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 */
export const JSON_DISCRIMINATOR = TypedJsonDiscriminator.ContractName;
type Serializable = string;

/** The name of a smart contract. Note: This does _not_ including the 'init_' prefix. */
class ContractName extends TypeBase<Serializable> {
    protected typedJsonType = JSON_DISCRIMINATOR;
    protected get serializable(): Serializable {
        return this.value;
    }
    constructor(
        /** The internal string value of the contract name. */
        public readonly value: string
    ) {
        super();
    }
}

/** The name of a smart contract. Note: This does _not_ including the 'init_' prefix. */
export { ContractName as Type };

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
 * Takes a JSON string and converts it to instance of type {@linkcode Type}.
 *
 * @param {TypedJson} json - The typed JSON to convert.
 * @throws {TypedJsonParseError} - If unexpected JSON string is passed.
 * @returns {Type} The parsed instance.
 */
export const fromTypedJSON = makeFromTypedJson(
    JSON_DISCRIMINATOR,
    ContractName
);
