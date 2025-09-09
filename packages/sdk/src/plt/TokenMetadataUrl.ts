import { Buffer } from 'buffer/index.js';
import { registerEncoder } from 'cbor2/encoder';

import type { HexString } from '../types.js';
import { cborDecode, cborEncode } from '../types/cbor.js';
import { Cbor } from './index.js';

/** The JSON representation of a {@linkcode Type} */
export type JSON = {
    /** The inner url */
    url: string;
    /** The checksum SHA-256 of the URL */
    checksumSha256?: HexString;
    /** Any additional values. These are hex representations of CBOR encoded values. */
    _additional?: Record<string, HexString>;
};

/** The intermediary CBOR representation of a {@linkcode Type} */
export type CBOR = {
    /** The inner url */
    url: string;
    /** The checksum SHA-256 of the URL */
    checksumSha256?: Uint8Array;
    /**
     * Any additional values. These are CBOR intermediary representations of values and might include custom tags if
     * not handled by adding decoders for these.
     */
    [key: string]: unknown;
};

/**
 * Protocol level token (PLT) metadata URL.
 */
class TokenMetadataUrl {
    #nominal = true;

    /**
     * Constructs a new TokenMetadataUrl instance.
     */
    constructor(
        /** The inner url */
        public readonly url: string,
        /** The checksum SHA-256 of the URL */
        public readonly checksumSha256?: Uint8Array,
        /**
         * Additional metadata url fields. Any keys in this object must not collide with the explicit fields for the
         * type.
         */
        public readonly additional?: Record<string, unknown>
    ) {}

    /**
     * Get a string representation of the token metadata URL.
     * @returns {string} The string representation.
     */
    public toString(): string {
        return this.url;
    }

    /**
     * Get a JSON-serializable representation of the token metadata URL. This is called implicitly when serialized with JSON.stringify.
     * @returns {JSON} The JSON representation.
     */
    public toJSON(): JSON {
        let url: JSON = { url: this.url };
        if (this.checksumSha256 !== undefined) {
            url.checksumSha256 = Buffer.from(this.checksumSha256).toString('hex');
        }
        if (this.additional !== undefined) {
            const pairs = Object.entries(this.additional).map(([key, value]) => [key, Cbor.encode(value).toJSON()]);
            url._additional = Object.fromEntries(pairs);
        }
        return url;
    }
}

/**
 * Protocol level token (PLT) metadata URL.
 */
export type Type = TokenMetadataUrl;

/**
 * Create a protocol level token metadata URL.
 *
 * @param {string} url - The URL of the token metadata.
 * @param {Uint8Array} [checksumSha256] - The SHA-256 checksum of the URL.
 * @param {Record<string, unknown>} [additional] - Additional metadata fields.
 * @returns {TokenMetadataUrl} A new token metadata URL instance.
 */
export function create(
    url: string,
    checksumSha256?: Uint8Array,
    additional?: Record<string, unknown>
): TokenMetadataUrl {
    return new TokenMetadataUrl(url, checksumSha256, additional);
}

/**
 * Create a protocol level token metadata URL from a string value. If the url should be
 * accompanied by a checksum or any other additional values, use {@linkcode create} instead.
 *
 * @param {string} url - The string to create the token ID from.
 * @returns {TokenMetadataUrl} A new token metadata URL instance.
 */
export function fromString(url: string): TokenMetadataUrl {
    return new TokenMetadataUrl(url);
}

/**
 * Type predicate for {@linkcode Type}
 *
 * @param value value to check.
 * @returns whether `value` is of type {@linkcode Type}
 */
export function instanceOf(value: unknown): value is TokenMetadataUrl {
    return value instanceof TokenMetadataUrl;
}

/**
 * Converts {@linkcode JSON} to a token amount.
 *
 * @param {string} json The JSON representation of token metadata URL.
 * @returns {TokenMetadataUrl} The token metadata URL.
 */
export function fromJSON({ url, checksumSha256, _additional }: JSON): TokenMetadataUrl {
    let additional: Record<string, unknown> | undefined;
    if (_additional !== undefined) {
        const pairs = Object.entries(_additional).map(([key, value]) => [key, Cbor.decode(Cbor.fromJSON(value))]);
        additional = Object.fromEntries(pairs);
    }

    const checksumSha256Parsed =
        checksumSha256 !== undefined ? Uint8Array.from(Buffer.from(checksumSha256, 'hex')) : undefined;
    return create(url, checksumSha256Parsed, additional);
}

/**
 * Converts a TokenMetadataUrl object to it's intermediary {@linkcode CBOR} representation.
 *
 * @param tokenMetadataUrl - The TokenMetadataUrl object to convert.
 * @returns A CBOR-compatible value representation of the TokenMetadataUrl.
 */
export function toCBORValue(tokenMetadataUrl: TokenMetadataUrl): CBOR {
    let cbor: CBOR = { url: tokenMetadataUrl.url };
    if (tokenMetadataUrl.checksumSha256 !== undefined) {
        cbor.checksumSha256 = tokenMetadataUrl.checksumSha256;
    }
    if (tokenMetadataUrl.additional) {
        cbor = { ...cbor, ...tokenMetadataUrl.additional };
    }
    return cbor;
}

/**
 * Encodes a TokenMetadataUrl object into a CBOR-formatted Uint8Array.
 *
 * @param tokenMetadataUrl - The TokenMetadataUrl object to encode.
 * @returns A Uint8Array containing the CBOR encoding of the TokenMetadataUrl.
 */
export function toCBOR(tokenMetadataUrl: TokenMetadataUrl): Uint8Array {
    return cborEncode(toCBORValue(tokenMetadataUrl));
}

/**
 * Constructs a TokenMetadataUrl object from it's {@linkcode CBOR}.
 *
 * @param value - The CBOR-compatible value to decode. The expected format is {@linkcode CBOR}.
 * @returns The decoded TokenMetadataUrl object.
 * @throws Will throw an error if the value is not a valid CBOR representation of TokenMetadataUrl.
 */
export function fromCBORValue(value: unknown): TokenMetadataUrl {
    if (typeof value !== 'object' || value === null) {
        throw new Error('Invalid CBOR value for TokenMetadataUrl');
    }
    if (!('url' in value) || typeof value.url !== 'string') {
        throw new Error('Missing or invalid "url" field in TokenMetadataUrl');
    }
    // check that checksumSha256 is either undefined or a Uint8Array of length 32
    if (
        'checksumSha256' in value &&
        (!(value.checksumSha256 instanceof Uint8Array) || value.checksumSha256.length !== 32)
    ) {
        throw new Error('Invalid "checksumSha256" field in TokenMetadataUrl');
    }

    const { url, checksumSha256, ...other } = value as CBOR;
    let additional: Record<string, unknown> | undefined;
    if (Object.keys(other).some((key) => typeof key !== 'string')) {
        throw new Error('Invalid additional fields in TokenMetadataUrl. Can only contain string keys.');
    }
    if (Object.keys(other).length > 0) {
        additional = other;
    }
    return create(url, checksumSha256, additional);
}

/**
 * Decodes a CBOR-encoded Uint8Array into a TokenMetadataUrl object.
 *
 * @param cbor - The CBOR-encoded Uint8Array to decode.
 * @returns The decoded TokenMetadataUrl object.
 * @throws Will throw an error if the CBOR data is not a valid representation of TokenMetadataUrl.
 */
export function fromCBOR(cbor: Uint8Array): TokenMetadataUrl {
    return fromCBORValue(cborDecode(cbor));
}

/**
 * Registers a CBOR encoder for the TokenMetadataUrl type with the `cbor2` library.
 * This allows TokenMetadataUrl instances to be automatically encoded when used with
 * the `cbor2` library's encode function.
 *
 * @returns {void}
 * @example
 * // Register the encoder
 * registerCBOREncoder();
 * // Now TokenMetadataUrl instances can be encoded directly
 * const encoded = encode(myTokenMetadataUrl);
 */
export function registerCBOREncoder(): void {
    registerEncoder(TokenMetadataUrl, (value) => [NaN, toCBORValue(value)]);
}
