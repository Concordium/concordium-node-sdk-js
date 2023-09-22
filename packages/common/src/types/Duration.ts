/**
 * Type representing a duration of time.
 */
class Duration {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __nominal = true;
    constructor(
        /** The internal value for representing a duration in milliseconds. */
        public readonly value: number
    ) {}
}

/**
 * Type representing a duration of time.
 */
export type Type = Duration;

/**
 * Construct a Duration from a given number of milliseconds.
 * @param {number} value Number of milliseconds
 * @throws If a negative value is provided.
 * @returns {Duration} Duration corresponding to the provided value.
 */
export function fromMillis(value: number): Duration {
    if (value < 0) {
        throw new Error(
            'Invalid duration: The value cannot be a negative number.'
        );
    }
    return new Duration(value);
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
