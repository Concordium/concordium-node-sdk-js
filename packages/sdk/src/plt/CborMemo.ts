import { Buffer } from 'buffer/index.js';
import { decode } from 'cbor2/decoder';
import { encode, registerEncoder } from 'cbor2/encoder';
import { Tag } from 'cbor2/tag';

import * as Proto from '../grpc-api/v2/concordium/kernel.js';
import type { HexString } from '../types.js';
import { cborDecode } from '../types/cbor.js';

const TAGGED_MEMO = 24;

/**
 * The JSON representation of a {@linkcode Type} cbor memo
 */
export type JSON = HexString;

/**
 * Representation of a Memo, which enforces that it:
 * - Is a valid byte array with a maximum length of 256 bytes.
 */
class CborMemo {
    #nominal = true;

    constructor(public readonly content: Uint8Array) {
        if (content.length > 256) {
            throw new Error(`Memo content exceeds the maximum allowed length of 256 bytes.`);
        }
    }

    /**
     * Get a string representation of the memo.
     *
     * @returns {string} The string representation.
     */
    public toString(): string {
        return Buffer.from(this.content).toString('hex');
    }

    /**
     * Get a JSON-serializable representation of the memo.
     * @returns {JSON} The JSON-serializable representation.
     */
    public toJSON(): JSON {
        return this.toString();
    }
}

/**
 * Representation of a Memo, which enforces that it:
 * - Is a valid byte array with a maximum length of 256 bytes.
 */
export type Type = CborMemo;

/**
 * Type predicate for {@linkcode Type}
 *
 * @param value value to check.
 * @returns whether `value` is of type {@linkcode Type}
 */
export function instanceOf(value: unknown): value is CborMemo {
    return value instanceof CborMemo;
}

/**
 * Converts a string into a CborMemo object.
 *
 * @param value - The string to be encoded.
 * @returns A new CborMemo object containing the encoded string.
 */
export function fromString(value: string): CborMemo {
    return new CborMemo(encode(value));
}

/**
 * Converts any value to a CborMemo instance.
 *
 * @param value - The value to be encoded and wrapped in a CborMemo.
 * @returns A new CborMemo instance containing the encoded value.
 */
export function fromAny(value: unknown): CborMemo {
    return new CborMemo(encode(value));
}

/**
 * Convert CBOR memo from its protobuf encoding.
 * @param {Proto.Memo} memo The protobuf encoding.
 * @returns {CborMemo}
 */
export function fromProto(memo: Proto.Memo): CborMemo {
    return new CborMemo(memo.value);
}

/**
 * Convert CBOR memo into its protobuf encoding.
 * @param {CborMemo} memo module event.
 * @returns {Proto.Memo}
 */
export function toProto(memo: CborMemo): Proto.Memo {
    return {
        value: memo.content,
    };
}

/**
 * Parses a CBOR-encoded memo and returns the decoded value.
 *
 * @param {CborMemo} value - The CBOR memo to parse.
 * @returns {unknown} The decoded value.
 */
export function parse(value: CborMemo): unknown {
    return cborDecode(value.content);
}

/**
 * Converts a Memo to its CBOR (Concise Binary Object Representation) encoding.
 * This encodes the memo as a CBOR tagged value with tag 24.
 *
 * @param {CborMemo} value - The memo to convert to CBOR format.
 * @returns {Uint8Array} The CBOR encoded representation of the memo.
 */
export function toCBOR(value: CborMemo): Uint8Array {
    const tagged = new Tag(TAGGED_MEMO, value.content);
    return new Uint8Array(encode(tagged));
}

function fromCBORValue(decoded: unknown): CborMemo {
    if (!(decoded instanceof Tag) || decoded.tag !== TAGGED_MEMO) {
        throw new Error('Invalid CBOR tag for Memo.');
    }

    const content = decoded.contents;
    if (!(content instanceof Uint8Array)) {
        throw new Error('Invalid CBOR value: expected UInt8Array');
    }

    return new CborMemo(new Uint8Array(content));
}

/**
 * Decodes a CBOR-encoded memo into a CborMemo instance.
 *
 * @param {Uint8Array} bytes - The CBOR encoded representation of a memo.

/**
 * Decodes a CBOR-encoded memo into a CborMemo instance.
 *
 * @param {Uint8Array} bytes - The CBOR encoded representation of a memo.
 * @returns {CborMemo} The decoded CborMemo instance.
 */
export function fromCBOR(bytes: Uint8Array): CborMemo {
    return fromCBORValue(decode(bytes));
}

/**
 * Registers a CBOR encoder for the Memo type with the `cbor2` library.
 * This allows CborMemo instances to be automatically encoded when used with
 * the `cbor2` library's encode function.
 *
 * @returns {void}
 * @example
 * // Register the encoder
 * registerCBOREncoder();
 * // Now CborMemo instances can be encoded directly
 * const encoded = encode(memo);
 */
export function registerCBOREncoder(): void {
    registerEncoder(CborMemo, (value) => [TAGGED_MEMO, value.content]);
}

/**
 * Registers a CBOR decoder for tag 24 (encoded-cbor-data-item) with the `cbor2` library.
 * This enables automatic decoding of CBOR data containing a Memo
 * when using the `cbor2` library's decode function.
 *
 * @returns {() => void} A cleanup function that, when called, will restore the previous
 * decoder (if any) that was registered for the tagged-address format. This is useful
 * when used in an existing `cbor2` use-case.
 *
 * @example
 * // Register the decoder
 * const cleanup = registerCBORDecoder();
 * // Use the decoder
 * const memo = decode(cborBytes); // Returns Memo if format matches
 * // Later, unregister the decoder
 * cleanup();
 */
export function registerCBORDecoder(): () => void {
    const old = Tag.registerDecoder(TAGGED_MEMO, fromCBORValue);

    // return cleanup function to restore the old decoder
    return () => {
        if (old) {
            Tag.registerDecoder(TAGGED_MEMO, old);
        } else {
            Tag.clearDecoder(TAGGED_MEMO);
        }
    };
}
