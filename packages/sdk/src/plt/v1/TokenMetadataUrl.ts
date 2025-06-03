import { HexString } from '../../index.js';
import { Cbor } from '../index.js';

export type JSON = { url: string; checksumSha256?: string; [key: string]: HexString | undefined };

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
        public readonly checksumSha256?: HexString,
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
        const additional: Record<string, HexString> = {};
        Object.entries(this.additional ?? {}).forEach(([key, value]) => {
            additional[key] = Cbor.encode(value).toJSON();
        });

        return {
            ...additional,
            url: this.url,
            checksumSha256: this.checksumSha256,
        };
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
 * @param {HexString} [checksumSha256] - The SHA-256 checksum of the URL.
 * @param {Record<string, unknown>} [additional] - Additional metadata fields.
 * @returns {TokenMetadataUrl} A new token metadata URL instance.
 */
export function create(
    url: string,
    checksumSha256?: HexString,
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
export function fromJSON({ url, checksumSha256, ...other }: JSON): TokenMetadataUrl {
    const additional: Record<string, unknown> = {};
    Object.entries(other).forEach(([key, value]) => {
        if (value !== undefined) {
            additional[key] = Cbor.decode(Cbor.fromJSON(value));
        }
    });

    return create(url, checksumSha256, additional);
}
