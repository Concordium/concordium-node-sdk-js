import type * as Proto from '../grpc-api/v2/concordium/types.js';
import { TypeBase, TypedJsonDiscriminator, makeFromTypedJson } from './util.js';

/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 */
export const JSON_DISCRIMINATOR = TypedJsonDiscriminator.Duration;
type Serializable = string;

/**
 * Type representing a duration of time.
 */
class Duration extends TypeBase<Serializable> {
    protected typedJsonType = JSON_DISCRIMINATOR;
    protected get serializable(): Serializable {
        return this.value.toString();
    }

    constructor(
        /** The internal value for representing a duration in milliseconds. */
        public readonly value: bigint
    ) {
        super();
    }
}

/**
 * Type representing a duration of time.
 */
export { Duration as Type };

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

/**
 * Takes a JSON string and converts it to instance of type {@linkcode Type}.
 *
 * @param {TypedJson} json - The typed JSON to convert.
 * @throws {TypedJsonParseError} - If unexpected JSON string is passed.
 * @returns {Type} The parsed instance.
 */
export const fromTypedJSON = makeFromTypedJson(
    JSON_DISCRIMINATOR,
    (v: string) => fromMillis(BigInt(v))
);
