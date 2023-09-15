/** Represents a timestamp. */
class Timestamp {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __nominal = true;
    constructor(
        /** The internal value for representing the timestamp as milliseconds since Unix epoch. */
        public value: number
    ) {}
}

/** Represents a timestamp. */
export type Type = Timestamp;

/**
 * Create a Timestamp from milliseconds since Unix epoch.
 * @param {number} value Milliseconds since Unix epoch.
 * @throws If the value is negative.
 * @returns {Timestamp} The created timestamp.
 */
export function fromMillis(value: number): Timestamp {
    if (value < 0) {
        throw new Error(
            'Invalid timestamp: The value cannot be a negative number.'
        );
    }
    return new Timestamp(value);
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
    const date = new Date(timestamp.value);
    return date.toISOString();
}
