/**
 * Protocol level token (PLT) ID JSON representation.
 */
export type JSON = string;

const MAX_LENGTH = 256;

/**
 * Enum representing the types of errors that can occur with token amounts.
 */
export enum ErrorType {
    /** Error type indicating the length of module reference is incorrect. */
    EXCEEDS_MAX_LENGTH = 'EXCEEDS_MAX_LENGTH',
}

/**
 * Custom error to represent issues with token amounts.
 */
export class Err extends Error {
    private constructor(
        /** The {@linkcode ErrorType} of the error. Can be used as to distinguish different types of errors. */
        public readonly type: ErrorType,
        message: string
    ) {
        super(message);
        this.name = `TokenId.Err.${type}`;
    }

    /**
     * Creates a TokenId.Err indicating the length of module reference is incorrect.
     */
    public static incorrectLength(): Err {
        return new Err(
            ErrorType.EXCEEDS_MAX_LENGTH,
            `Token ID's cannot be longer than ${MAX_LENGTH} utf-8 encoded bytes`
        );
    }
}

/**
 * Protocol level token (PLT) ID.
 */
class TokenId {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private readonly __type = 'PLT.Id';

    /**
     * Constructs a new TokenId instance.
     * Validates that the value is smaller than the allowed utf-8 byte length.
     *
     * @throws {Err} If the value is longer than 256 utf-8 encoded bytes.
     */
    constructor(
        /** The inner value */
        public readonly value: string
    ) {
        // Check if the value exceeds 256 UTF-8 bytes
        if (new TextEncoder().encode(value).length > MAX_LENGTH) {
            throw Err.incorrectLength();
        }
    }

    /**
     * Get a string representation of the token ID.
     * @returns {string} The string representation.
     */
    public toString(): string {
        return this.value;
    }

    /**
     * Get a JSON-serializable representation of the token ID. This is called implicitly when serialized with JSON.stringify.
     * @returns {HexString} The JSON representation.
     */
    public toJSON(): JSON {
        return this.value;
    }
}

/**
 * Protocol level token (PLT) ID.
 */
export type Type = TokenId;

/**
 * Create a protocol level token ID from a string value.
 *
 * @param {string} value - The string to create the token ID from.
 * @returns {TokenId} A new token ID instance.
 * @throws {Err} If the value is longer than 256 utf-8 encoded bytes.
 */
export function fromString(value: string): TokenId {
    return new TokenId(value);
}

/**
 * Type predicate for {@linkcode Type}
 *
 * @param value value to check.
 * @returns whether `value` is of type {@linkcode Type}
 */
export function instanceOf(value: unknown): value is TokenId {
    return value instanceof TokenId;
}

/**
 * Converts {@linkcode JSON} to a token amount.
 *
 * @param {string} json The JSON representation of the CCD amount.
 * @returns {CcdAmount} The CCD amount.
 * @throws {Err} If the value is longer than 256 utf-8 encoded bytes.
 */
export function fromJSON(json: JSON): TokenId {
    return fromString(json);
}
