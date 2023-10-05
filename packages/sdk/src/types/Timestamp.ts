import type * as Proto from '../grpc-api/v2/concordium/types.js';
import { TypeBase, TypedJsonDiscriminator, fromTypedJson } from './util.js';

/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 */
export const JSON_TYPE = TypedJsonDiscriminator.Timestamp;
type Json = string;

/** Represents a timestamp. */
class Timestamp extends TypeBase<Json> {
    protected jsonType = JSON_TYPE;
    protected get jsonValue(): Json {
        return this.value.toString();
    }

    constructor(
        /** The internal value for representing the timestamp as milliseconds since Unix epoch. */
        public readonly value: bigint
    ) {
        super();
    }
}

/** Represents a timestamp. */
export type Type = Timestamp;

/**
 * Create a Timestamp from milliseconds since Unix epoch.
 * @param {number} value Milliseconds since Unix epoch.
 * @throws If the value is negative.
 * @returns {Timestamp} The created timestamp.
 */
export function fromMillis(value: number | bigint): Timestamp {
    if (value < 0) {
        throw new Error(
            'Invalid timestamp: The value cannot be a negative number.'
        );
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

/** Type used when encoding the account address using a schema. */
export type SchemaValue = string;

/**
 * Get timestamp in the format used by schemas.
 * @param {Timestamp} timestamp The timestamp.
 * @returns {SchemaValue} The schema value representation.
 */
export function toSchemaValue(timestamp: Timestamp): SchemaValue {
    return toDate(timestamp).toISOString();
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
 * Takes a JSON string and converts it to instance of type {@linkcode Type}.
 *
 * @param {JsonString} json - The JSON string to convert.
 * @throws {TypedJsonParseError} - If unexpected JSON string is passed.
 * @returns {Type} The parsed instance.
 */
export const fromJSON = fromTypedJson(JSON_TYPE, (v: string) => {
    fromMillis(BigInt(v));
});
