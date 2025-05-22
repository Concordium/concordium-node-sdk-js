import type * as Proto from '../grpc-api/v2/concordium/protocol-level-tokens.js';
import { isValidUTF8 } from '../util.js';

/**
 * Protocol level token (PLT) ID JSON representation.
 */
export type JSON = string;

const MAX_LENGTH = 255;

/**
 * Enum representing the types of errors that can occur with token IDs.
 */
export enum ErrorType {
    /** Error type indicating the length length exceeds the max allowed. */
    EXCEEDS_MAX_LENGTH = 'EXCEEDS_MAX_LENGTH',
    /** Error type indicating the token ID is invalid. */
    INVALID = 'INVALID',
}

/**
 * Custom error to represent issues with token IDs.
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
     * Creates a TokenId.Err indicating the length exceeds the max allowed.
     */
    public static exceedsMaxLength(): Err {
        return new Err(
            ErrorType.EXCEEDS_MAX_LENGTH,
            `Token ID's cannot be longer than ${MAX_LENGTH} utf-8 encoded bytes`
        );
    }

    /**
     * Creates a TokenId.Err indicating the token ID is invalid.
     */
    public static invalid(): Err {
        return new Err(ErrorType.INVALID, 'Token ID can only contain utf8 characters');
    }
}

/**
 * Protocol level token (PLT) ID.
 */
class TokenId {
    #nominal = true;

    /**
     * Constructs a new TokenId instance.
     * Validates that the value is smaller than the allowed utf-8 byte length.
     *
     * @throws {Err} If the value is longer than 255 utf-8 encoded bytes or contains invalid UTF-8.
     */
    constructor(
        /** The inner value */
        public readonly value: string
    ) {
        if (!isValidUTF8(value)) {
            throw Err.invalid();
        }

        // Check if the value exceeds 255 UTF-8 bytes
        if (new TextEncoder().encode(value).length > MAX_LENGTH) {
            throw Err.exceedsMaxLength();
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
 * @throws {Err} If the value is longer than 255 utf-8 encoded bytes or contains invalid UTF-8.
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
 * @throws {Err} If the value is longer than 255 utf-8 encoded bytes or contains invalid UTF-8.
 */
export function fromJSON(json: JSON): TokenId {
    return fromString(json);
}

/**
 * Convert token ID from its protobuf encoding.
 * @param {Proto.TokenId} tokenId the token ID
 * @returns {TokenId} The token ID.
 * @throws {Err} If the value is longer than 255 utf-8 encoded bytes or contains invalid UTF-8.
 */
export function fromProto(tokenId: Proto.TokenId): TokenId {
    return fromString(tokenId.value);
}

/**
 * Convert token ID into its protobuf encoding.
 * @param {TokenId} tokenId The token ID.
 * @returns {Proto.TokenId} The protobuf encoding.
 */
export function toProto(tokenId: Type): Proto.TokenId {
    return {
        value: tokenId.value,
    };
}

/**
 * Encode a TokenId to UTF-8 bytes. This is the serialization format used for token IDs in transactions.
 *
 * @param {TokenId} tokenId - The TokenId to encode.
 * @returns {Uint8Array} The UTF-8 byte representation of the TokenId.
 */
export function toBytes(tokenId: TokenId): Uint8Array {
    return new TextEncoder().encode(tokenId.value);
}

/**
 * Decode UTF-8 bytes to a TokenId. This can be used to deserialize token IDs in transactions.
 *
 * @param {Uint8Array} bytes - The UTF-8 byte array to decode.
 * @returns {TokenId} The decoded TokenId.
 * @throws {Err} If the decoded string is longer than 255 utf-8 encoded bytes or contains invalid UTF-8.
 */
export function fromBytes(bytes: ArrayBuffer): TokenId {
    try {
        // This will catch any surrogate pairs that cannot be properly encoded to UTF-8
        let value = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        return new TokenId(value);
    } catch (error) {
        throw Err.invalid();
    }
}

/**
 * Check if two token IDs are the same.
 * @param {TokenId} left
 * @param {TokenId} right
 * @returns {boolean} True if they are equal.
 */
export function equals(left: TokenId, right: TokenId): boolean {
    return left.value === right.value;
}
