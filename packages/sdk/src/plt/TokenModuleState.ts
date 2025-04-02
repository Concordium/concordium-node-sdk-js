import * as Proto from '../grpc-api/v2/concordium/protocol-level-tokens.js';
import { HexString } from '../types.js';

export type JSON = HexString;

/**
 * Represents state of arbitrary PLT module instances
 */
class TokenModuleState {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private readonly __type = 'PLT.ModuleState';
    constructor(
        /** The internal buffer of bytes representing the state. */
        public readonly buffer: Uint8Array
    ) {}

    /**
     * Get a string representation of the token state.
     * @returns {string} The string representation.
     */
    public toString(): string {
        return toHexString(this);
    }

    /**
     * Get a JSON-serializable representation of the token state.
     * @returns {HexString} The JSON-serializable representation.
     */
    public toJSON(): HexString {
        return toHexString(this);
    }
}

/**
 * Converts a {@linkcode HexString} token state.
 * @param {HexString} json The JSON representation of the token state.
 * @returns {TokenModuleState} The token state.
 */
export function fromJSON(json: HexString): TokenModuleState {
    return fromHexString(json);
}

/**
 * Represents state of arbitrary PLT module instances
 */
export type Type = TokenModuleState;

/**
 * Create a TokenModuleState from a byte representation
 * @param buffer The byte representation
 * @returns {TokenModuleState} The token state
 */
export function fromBuffer(buffer: ArrayBuffer): TokenModuleState {
    return new TokenModuleState(new Uint8Array(buffer));
}

/**
 * Get byte representation of a TokenModuleState.
 * @param {TokenModuleState} state The state.
 * @returns {ArrayBuffer} State represented as bytes.
 */
export function toBuffer(state: TokenModuleState): Uint8Array {
    return state.buffer;
}

/**
 * Create a TokenModuleState from a hex string.
 * @param {HexString} hex Hex encoding of the state.
 * @returns {TokenModuleState}
 */
export function fromHexString(hex: HexString): TokenModuleState {
    return fromBuffer(Buffer.from(hex, 'hex'));
}

/**
 * Hex encode a TokenModuleState.
 * @param {TokenModuleState} state state to encode.
 * @returns {HexString} String containing the hex encoding.
 */
export function toHexString(state: TokenModuleState): HexString {
    return Buffer.from(state.buffer).toString('hex');
}

/**
 * Convert token state from its protobuf encoding.
 * @param {Proto.CBor} state The protobuf encoding.
 * @returns {TokenModuleState}
 */
export function fromProto(state: Proto.CBor): TokenModuleState {
    return fromBuffer(state.value);
}

/**
 * Convert token state into its protobuf encoding.
 * @param {TokenModuleState} state The token state.
 * @returns {Proto.CBor} The protobuf encoding.
 */
export function toProto(state: TokenModuleState): Proto.CBor {
    return {
        value: state.buffer,
    };
}
