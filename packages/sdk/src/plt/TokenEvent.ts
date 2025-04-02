import * as Proto from '../grpc-api/v2/concordium/protocol-level-tokens.js';
import { HexString } from "../types.js";

export type JSON = HexString;

/**
 * An event logged by a PLT module instance.
 */
class TokenEvent {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __nominal = true;
    constructor(
        /** The internal buffer of bytes representing the event. */
        public readonly buffer: Uint8Array
    ) {}

    /**
     * Get a string representation of the token event.
     * @returns {string} The string representation.
     */
    public toString(): string {
        return toHexString(this);
    }

    /**
     * Get a JSON-serializable representation of the token event.
     * @returns {HexString} The JSON-serializable representation.
     */
    public toJSON(): HexString {
        return toHexString(this);
    }
}

/**
 * Converts a {@linkcode HexString} to a token event.
 * @param {HexString} json The JSON representation of the token event.
 * @returns {TokenEvent} The token event.
 */
export function fromJSON(json: HexString): TokenEvent {
    return fromHexString(json);
}

/**
 * An event logged by a smart contract instance.
 */
export type Type = TokenEvent;

/**
 * Create a TokenEvent from a byte representation
 * @param buffer The byte representation
 * @returns {TokenEvent} The token event
 */
export function fromBuffer(buffer: ArrayBuffer): TokenEvent {
    return new TokenEvent(new Uint8Array(buffer));
}

/**
 * Get byte representation of a TokenEvent.
 * @param {TokenEvent} event The event.
 * @returns {ArrayBuffer} Hash represented as bytes.
 */
export function toBuffer(event: TokenEvent): Uint8Array {
    return event.buffer;
}

/**
 * Create a TokenEvent from a hex string.
 * @param {HexString} hex Hex encoding of the event.
 * @returns {TokenEvent}
 */
export function fromHexString(hex: HexString): TokenEvent {
    return fromBuffer(Buffer.from(hex, 'hex'));
}

/**
 * Hex encode a TokenEvent.
 * @param {TokenEvent} event The event to encode.
 * @returns {HexString} String containing the hex encoding.
 */
export function toHexString(event: TokenEvent): HexString {
    return Buffer.from(event.buffer).toString('hex');
}

/**
 * Convert a token event from its protobuf encoding.
 * @param {Proto.CBor} event The protobuf encoding.
 * @returns {TokenEvent}
 */
export function fromProto(event: Proto.CBor): TokenEvent {
    return fromBuffer(event.value);
}

/**
 * Convert a token event into its protobuf encoding.
 * @param {TokenEvent} event The block hash.
 * @returns {Proto.CBor} The protobuf encoding.
 */
export function toProto(event: TokenEvent): Proto.CBor {
    return {
        value: event.buffer,
    };
}
