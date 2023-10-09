import type * as Proto from '../grpc-api/v2/concordium/types.js';
import {
    TypedJson,
    TypedJsonDiscriminator,
    makeFromTypedJson,
} from './util.js';

/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 */
export const JSON_DISCRIMINATOR = TypedJsonDiscriminator.Duration;
type Serializable = string;

/**
 * Type representing a duration of time.
 */
class Duration {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __type = JSON_DISCRIMINATOR;
    constructor(
        /** The internal value for representing a duration in milliseconds. */
        public readonly value: bigint
    ) {}
}

/**
 * Type representing a duration of time.
 */
export type Type = Duration;

/**
 * Type predicate for {@linkcode Type}
 *
 * @param value value to check.
 * @returns whether `value` is of type {@linkcode Type}
 */
export function instanceOf(value: unknown): value is Duration {
    return value instanceof Duration;
}

/**
 * Construct a Duration from a given number of milliseconds.
 * @param {number} value Number of milliseconds
 * @throws If a negative value is provided.
 * @returns {Duration} Duration corresponding to the provided value.
 */
export function fromMillis(value: number | bigint): Duration {
    if (value < 0) {
        throw new Error(
            'Invalid duration: The value cannot be a negative number.'
        );
    }
    return new Duration(BigInt(value));
}

/** Type used when encoding a duration using a schema. */
export type SchemaValue = string;

/**
 * Get duration in the format used by schemas.
 * @param {Duration} duration The duration.
 * @returns {SchemaValue} The schema value representation.
 */
export function toSchemaValue(duration: Duration): SchemaValue {
    return `${duration.value} ms`;
}

/**
 * Convert a duration from its protobuf encoding.
 * @param {Proto.Duration} duration The duration in protobuf.
 * @returns {Duration} The duration.
 */
export function fromProto(duration: Proto.Duration): Duration {
    return fromMillis(duration.value);
}

/**
 * Convert a duration into its protobuf encoding.
 * @param {Duration} duration The duration.
 * @returns {Proto.Duration} The protobuf encoding.
 */
export function toProto(duration: Duration): Proto.Duration {
    return {
        value: duration.value,
    };
}

const fromSerializable = (v: Serializable) => fromMillis(BigInt(v));

/**
 * Takes an {@linkcode Type} and transforms it to a {@linkcode TypedJson} format.
 *
 * @param {Type} value - The account address instance to transform.
 * @returns {TypedJson} The transformed object.
 */
export function toTypedJSON({ value }: Duration): TypedJson<Serializable> {
    return {
        ['@type']: JSON_DISCRIMINATOR,
        value: value.toString(),
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
    fromSerializable
);
