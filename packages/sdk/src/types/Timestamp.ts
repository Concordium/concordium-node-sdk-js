import type * as Proto from '../grpc-api/v2/concordium/types.js';
import { TypedJson, TypedJsonDiscriminator, makeFromTypedJson } from './util.js';

/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 * @deprecated
 */
export const JSON_DISCRIMINATOR = TypedJsonDiscriminator.Timestamp;
export type Serializable = string;

/** Represents a timestamp. */
class Timestamp {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __type = JSON_DISCRIMINATOR;
    constructor(
        /** The internal value for representing the timestamp as milliseconds since Unix epoch. */
        public readonly value: bigint
    ) {}

    /**
     * Get a string representation of the timestamp as the number of milliseconds since Unix epoch.
     * @returns {string} The string representation.
     */
    public toString(): string {
        return this.value.toString();
    }
}

/**
 * Unwraps {@linkcode Type} value
 * @param value value to unwrap.
 * @returns the unwrapped {@linkcode bigint} value
 */
export function toUnwrappedJSON(value: Type): bigint {
    return value.value;
}

/** Represents a timestamp. */
export type Type = Timestamp;

/**
 * Type predicate for {@linkcode Type}
 *
 * @param value value to check.
 * @returns whether `value` is of type {@linkcode Type}
 */
export function instanceOf(value: unknown): value is Timestamp {
    return value instanceof Timestamp;
}

/**
 * Create a Timestamp from milliseconds since Unix epoch.
 * @param {number} value Milliseconds since Unix epoch.
 * @throws If the value is negative.
 * @returns {Timestamp} The created timestamp.
 */
export function fromMillis(value: number | bigint): Timestamp {
    if (value < 0) {
        throw new Error('Invalid timestamp: The value cannot be a negative number.');
    }
    return new Timestamp(BigInt(value));
}

/**
 * Create a Timestamp from a Date object.
 * @param {Date} date Date representing the timestamp.
 * @throws If the date if from before January 1, 1970 UTC.
 * @returns {Timestamp} The created timestamp.
 */
export function fromDate(date: Date): Timestamp {
    return fromMillis(date.getTime());
}

/**
 * Construct a Timestamp minutes in the future from the time of calling this function.
 * @param {number} minutes The number of minutes in the future to set as the expiry time.
 * @returns {Timestamp} The transaction expiry.
 */
export function futureMinutes(minutes: number): Timestamp {
    const timestampMillis = Date.now() + minutes * 60 * 1000;
    return fromDate(new Date(timestampMillis));
}

/** Type used when encoding a timestamp in the JSON format used when serializing using a smart contract schema type. */
export type SchemaValue = string;

/**
 * Get timestamp in the JSON format used when serializing using a smart contract schema type.
 * @param {Timestamp} timestamp The timestamp.
 * @returns {SchemaValue} The schema value representation.
 */
export function toSchemaValue(timestamp: Timestamp): SchemaValue {
    return toDate(timestamp).toISOString();
}

/**
 * Convert to timestamp from JSON format used when serializing using a smart contract schema type.
 * @param {SchemaValue} timestamp The timestamp in schema format.
 * @returns {Timestamp} The timestamp
 */
export function fromSchemaValue(timestamp: SchemaValue): Timestamp {
    return fromMillis(Date.parse(timestamp));
}

/**
 * Get timestamp as a Date.
 * @param {Timestamp} timestamp The timestamp.
 * @returns {Date} Date object.
 */
export function toDate(timestamp: Timestamp): Date {
    const number = Number(timestamp.value);
    if (isNaN(number)) {
        throw new Error('Timestamp cannot be represented as a date.');
    }
    return new Date(number);
}

/**
 * Convert a timestamp from its protobuf encoding.
 * @param {Proto.Timestamp} timestamp The timestamp in protobuf.
 * @returns {Timestamp} The timestamp.
 */
export function fromProto(timestamp: Proto.Timestamp): Timestamp {
    return fromMillis(timestamp.value);
}

/**
 * Convert a timestamp into its protobuf encoding.
 * @param {Timestamp} timestamp The timestamp.
 * @returns {Proto.Timestamp} The protobuf encoding.
 */
export function toProto(timestamp: Timestamp): Proto.Timestamp {
    return {
        value: timestamp.value,
    };
}

/**
 * Constructs a {@linkcode Type} from {@linkcode Serializable}.
 * @param {Serializable} value
 * @returns {Type} The duration.
 */
export function fromSerializable(value: Serializable): Type {
    return fromMillis(BigInt(value));
}

/**
 * Converts {@linkcode Type} into {@linkcode Serializable}
 * @param {Type} value
 * @returns {Serializable} The serializable value
 */
export function toSerializable(value: Type): Serializable {
    return value.value.toString();
}

/**
 * Takes an {@linkcode Type} and transforms it to a {@linkcode TypedJson} format.
 * @deprecated Use the {@linkcode toSerializable} function instead.
 * @param {Type} value - The account address instance to transform.
 * @returns {TypedJson} The transformed object.
 */
export function toTypedJSON(value: Timestamp): TypedJson<Serializable> {
    return {
        ['@type']: JSON_DISCRIMINATOR,
        value: toSerializable(value),
    };
}

/**
 * Takes a {@linkcode TypedJson} object and converts it to instance of type {@linkcode Type}.
 * @deprecated Use the{@linkcode fromSerializable} function instead.
 * @param {TypedJson} json - The typed JSON to convert.
 * @throws {TypedJsonParseError} - If unexpected JSON string is passed.
 * @returns {Type} The parsed instance.
 */
export const fromTypedJSON = /*#__PURE__*/ makeFromTypedJson(JSON_DISCRIMINATOR, fromSerializable);
