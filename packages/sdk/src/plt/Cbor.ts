import { Buffer } from 'buffer/index.js';

import * as Proto from '../grpc-api/v2/concordium/protocol-level-tokens.js';
import { HexString } from '../types.js';
import { cborEncode } from '../types/cbor.js';

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

export { decode } from './decode.js';

/**
 * Encode a value into CBOR format.
 * @param {unknown} value - The value to encode.
 * @returns {Cbor} The CBOR encoded data.
 */
export function encode(value: unknown): Cbor {
    return new Cbor(cborEncode(value));
}
