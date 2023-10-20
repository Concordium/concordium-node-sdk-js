import { isAsciiAlphaNumericPunctuation } from '../contractHelpers.js';
import {
    TypedJson,
    TypedJsonDiscriminator,
    makeFromTypedJson,
} from './util.js';

/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 */
export const JSON_DISCRIMINATOR = TypedJsonDiscriminator.EntrypointName;
export type Serializable = string;

/**
 * Type representing an entrypoint of a smart contract.
 * @template S Use for using string literals for the type.
 */
class EntrypointName<S extends string = string> {
    protected get serializable(): Serializable {
        return this.value;
    }

    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __type = JSON_DISCRIMINATOR;
    constructor(
        /** The internal string value of the receive name. */
        public readonly value: S
    ) {}
}

/**
 * Type representing an entrypoint of a smart contract.
 */
export type Type<S extends string = string> = EntrypointName<S>;

/**
 * Type predicate for {@linkcode Type}
 *
 * @param value value to check.
 * @returns whether `value` is of type {@linkcode Type}
 */
export function instanceOf(value: unknown): value is EntrypointName {
    return value instanceof EntrypointName;
}

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

/**
 * Takes an {@linkcode Type} and transforms it to a {@linkcode TypedJson} format.
 *
 * @param {Type} value - The account address instance to transform.
 * @returns {TypedJson} The transformed object.
 */
export function toTypedJSON(value: EntrypointName): TypedJson<Serializable> {
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
