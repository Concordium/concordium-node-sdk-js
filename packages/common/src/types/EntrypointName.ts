import { isAsciiAlphaNumericPunctuation } from '../contractHelpers.js';

/**
 * Type representing an entrypoint of a smart contract.
 * @template S Use for using string literals for the type.
 */
class EntrypointName<S extends string> {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __nominal = true;
    constructor(
        /** The internal string value of the receive name. */
        public value: S
    ) {}
}

/**
 * Type representing an entrypoint of a smart contract.
 */
export type Type<S extends string = string> = EntrypointName<S>;

/**
 * Create a smart contract entrypoint name from a string, ensuring it follows the required format.
 * @param {string} value The string with the entrypoint name.
 * @throws If the provided value is not a valid entrypoint name.
 * @returns {EntrypointName}
 */
export function fromString<S extends string>(value: S): EntrypointName<S> {
    if (value.length > 99) {
        throw new Error(
            'Invalid EntrypointName: Can be atmost 99 characters long.'
        );
    }
    if (!isAsciiAlphaNumericPunctuation(value)) {
        throw new Error(
            'Invalid EntrypointName: Must only contain ASCII alpha, numeric and punctuation characters.'
        );
    }
    return new EntrypointName(value);
}

/**
 * Create a smart contract entrypoint name from a string, but _without_ ensuring it follows the required format.
 * It is up to the caller to ensure the string is a valid entrypoint name.
 * @param {string} value The string with the entrypoint name.
 * @returns {EntrypointName}
 */
export function fromStringUnchecked<S extends string>(
    value: S
): EntrypointName<S> {
    return new EntrypointName(value);
}

/**
 * Convert a entrypoint name to a string
 * @param {EntrypointName} entrypointName The entrypoint name to stringify.
 * @returns {string}
 */
export function toString<S extends string>(
    entrypointName: EntrypointName<S>
): S {
    return entrypointName.value;
}
