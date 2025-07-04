import { Buffer } from 'buffer/index.js';

import * as Proto from '../grpc-api/v2/concordium/protocol-level-tokens.js';
import { HexString } from '../types.js';
import { cborDecode, cborEncode } from '../types/cbor.js';
import { TokenHolder, TokenMetadataUrl } from './index.js';
import {
    TokenListUpdateEventDetails,
    TokenModuleAccountState,
    TokenModuleState,
    TokenPauseEventDetails,
} from './module.js';

export type JSON = HexString;

/**
 * CBOR encoded data
 */
class Cbor {
    #nominal = true;
    constructor(
        /** The internal value of bytes */
        public readonly bytes: Uint8Array
    ) {}

    /**
     * Get a string representation of the cbor.
     * @returns {string} The string representation.
     */
    public toString(): string {
        return toHexString(this);
    }

    /**
     * Get a JSON-serializable representation of the cbor.
     * @returns {HexString} The JSON-serializable representation.
     */
    public toJSON(): HexString {
        return toHexString(this);
    }
}

/**
 * Converts a {@linkcode HexString} to CBOR data.
 * @param {HexString} json The JSON representation of the token event.
 * @returns {Cbor} The CBOR data.
 */
export function fromJSON(json: HexString): Cbor {
    return fromHexString(json);
}

/**
 * CBOR encoded data
 */
export type Type = Cbor;

/**
 * Type predicate for {@linkcode Type}
 *
 * @param value value to check.
 * @returns whether `value` is of type {@linkcode Type}
 */
export function instanceOf(value: unknown): value is Cbor {
    return value instanceof Cbor;
}

/**
 * Create CBOR data type from a byte representation
 * @param buffer The byte representation
 * @returns {Cbor} The CBOR data
 */
export function fromBuffer(buffer: ArrayBuffer): Cbor {
    return new Cbor(new Uint8Array(buffer));
}

/**
 * Get byte representation of the CBOR data.
 * @param {Cbor} cbor The event.
 * @returns {Uint8Array} The CBOR bytes.
 */
export function toBuffer(cbor: Cbor): Uint8Array {
    return cbor.bytes;
}

/**
 * Create CBOR from a hex string.
 * @param {HexString} hex Hex encoded data.
 * @returns {Cbor}
 */
export function fromHexString(hex: HexString): Cbor {
    return fromBuffer(Buffer.from(hex, 'hex'));
}

/**
 * Hex encode CBOR data.
 * @param {Cbor} cbor The CBOR data.
 * @returns {HexString} String containing the hex encoding.
 */
export function toHexString(cbor: Cbor): HexString {
    return Buffer.from(cbor.bytes).toString('hex');
}

/**
 * Convert CBOR data from its protobuf encoding.
 * @param {Proto.CBor} cbor The protobuf encoding.
 * @returns {Cbor}
 */
export function fromProto(cbor: Proto.CBor): Cbor {
    return fromBuffer(cbor.value);
}

/**
 * Convert CBOR data into its protobuf encoding.
 * @param {Cbor} cbor module event.
 * @returns {Proto.CBor} The protobuf encoding.
 */
export function toProto(cbor: Cbor): Proto.CBor {
    return {
        value: cbor.bytes,
    };
}

function decodeTokenModuleState(value: Cbor): TokenModuleState {
    const decoded = cborDecode(value.bytes);
    if (typeof decoded !== 'object' || decoded === null) {
        throw new Error('Invalid CBOR data for TokenModuleState');
    }

    // Validate required fields
    if (!('governanceAccount' in decoded && TokenHolder.instanceOf(decoded.governanceAccount))) {
        throw new Error('Invalid TokenModuleState: missing or invalid governanceAccount');
    }
    if (!('metadata' in decoded && TokenMetadataUrl.instanceOf(decoded.metadata))) {
        throw new Error('Invalid TokenModuleState: missing or invalid metadataUrl');
    }
    if (!('name' in decoded && typeof decoded.name === 'string')) {
        throw new Error('Invalid TokenModuleState: missing or invalid name');
    }

    // Validate optional fields
    if ('allowList' in decoded && typeof decoded.allowList !== 'boolean') {
        throw new Error('Invalid TokenModuleState: allowList must be a boolean');
    }
    if ('denyList' in decoded && typeof decoded.denyList !== 'boolean') {
        throw Error('Invalid TokenModuleState: denyList must be a boolean');
    }
    if ('mintable' in decoded && typeof decoded.mintable !== 'boolean') {
        throw new Error('Invalid TokenModuleState: mintable must be a boolean');
    }
    if ('burnable' in decoded && typeof decoded.burnable !== 'boolean') {
        throw new Error('Invalid TokenModuleState: burnable must be a boolean');
    }
    if ('paused' in decoded && typeof decoded.paused !== 'boolean') {
        throw new Error('Invalid TokenModuleState: paused must be a boolean');
    }

    return decoded as TokenModuleState;
}

function decodeTokenModuleAccountState(value: Cbor): TokenModuleAccountState {
    const decoded = cborDecode(value.bytes);
    if (typeof decoded !== 'object' || decoded === null) {
        throw new Error('Invalid CBOR data for TokenModuleAccountState');
    }

    // Validate optional fields
    if ('allowList' in decoded && typeof decoded.allowList !== 'boolean') {
        throw new Error('Invalid TokenModuleState: allowList must be a boolean');
    }
    if ('denyList' in decoded && typeof decoded.denyList !== 'boolean') {
        throw Error('Invalid TokenModuleState: denyList must be a boolean');
    }

    return decoded as TokenModuleAccountState;
}

function decodeTokenListUpdateEventDetails(value: Cbor): TokenListUpdateEventDetails {
    const decoded = cborDecode(value.bytes);
    if (typeof decoded !== 'object' || decoded === null) {
        throw new Error(`Invalid event details: ${JSON.stringify(decoded)}. Expected an object.`);
    }
    if (!('target' in decoded && TokenHolder.instanceOf(decoded.target))) {
        throw new Error(`Invalid event details: ${JSON.stringify(decoded)}. Expected 'target' to be a TokenHolder`);
    }

    return decoded as TokenListUpdateEventDetails;
}

function decodeTokenPauseEventDetails(value: Cbor): TokenPauseEventDetails {
    const decoded = cborDecode(value.bytes);
    if (typeof decoded !== 'object' || decoded === null) {
        throw new Error(`Invalid event details: ${JSON.stringify(decoded)}. Expected an object.`);
    }
    if (!('paused' in decoded && typeof decoded.paused === 'boolean')) {
        throw new Error(`Invalid event details: ${JSON.stringify(decoded)}. Expected 'paused' to be a boolean`);
    }

    return decoded as TokenPauseEventDetails;
}

type DecodeTypeMap = {
    TokenModuleState: TokenModuleState;
    TokenModuleAccountState: TokenModuleAccountState;
    TokenListUpdateEventDetails: TokenListUpdateEventDetails;
    TokenPauseEventDetails: TokenPauseEventDetails;
};

export function decode<T extends keyof DecodeTypeMap>(cbor: Cbor, type: T): DecodeTypeMap[T];
export function decode(cbor: Cbor, type?: undefined): unknown;

/**
 * Decode CBOR encoded data into its original representation.
 * @param {Cbor} cbor - The CBOR encoded data.
 * @param {string | undefined} type - Optional type hint for decoding.
 * @returns {unknown} The decoded data.
 */
export function decode<T extends keyof DecodeTypeMap | undefined>(cbor: Cbor, type: T): unknown {
    switch (type) {
        case 'TokenModuleState':
            return decodeTokenModuleState(cbor);
        case 'TokenModuleAccountState':
            return decodeTokenModuleAccountState(cbor);
        case 'TokenListUpdateEventDetails':
            return decodeTokenListUpdateEventDetails(cbor);
        case 'TokenPauseEventDetails':
            return decodeTokenPauseEventDetails(cbor);
        default:
            return cborDecode(cbor.bytes);
    }
}

/**
 * Encode a value into CBOR format.
 * @param {unknown} value - The value to encode.
 * @returns {Cbor} The CBOR encoded data.
 */
export function encode(value: unknown): Cbor {
    return new Cbor(cborEncode(value));
}
