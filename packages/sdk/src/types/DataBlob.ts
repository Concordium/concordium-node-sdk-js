import { Buffer } from 'buffer/index.js';

import { encodeHexString, packBufferWithWord16Length } from '../serializationHelpers.js';
import type { HexString } from '../types.js';
import { TypedJson, TypedJsonDiscriminator, makeFromTypedJson } from './util.js';

/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 */
export const JSON_DISCRIMINATOR = TypedJsonDiscriminator.DataBlob;
export type Serializable = HexString;

/**
 * Representation of a transfer's memo or a registerData transaction's data, which enforces that:
 * - the byte length is <= 256
 */
export class DataBlob {
    public readonly data: Buffer;

    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __type = JSON_DISCRIMINATOR;
    constructor(data: ArrayBuffer) {
        if (data.byteLength > 256) {
            throw new Error("A data blob's size cannot exceed 256 bytes");
        }

        this.data = Buffer.from(data);
    }

    /**
     * Encodes the data to a JSON-serializable hex-string.
     *
     * @returns The hex-string representation of the data.
     */
    public toJSON(): HexString {
        return packBufferWithWord16Length(this.data).toString('hex');
    }

    /**
     * Takes a hex-string and converts it to an instance of type {@linkcode DataBlob}.
     * The method expects the string to be prefixed with a 2-byte length like the one returned by {@linkcode toJSON}.
     *
     * @param value Hex-string to be converted to a DataBlob.
     * @returns The parsed instance.
     */
    public static fromJSON(value: HexString): DataBlob {
        // The first 2 bytes are the length of the data buffer, so we need to remove them.
        return new DataBlob(encodeHexString(value.substring(4)));
    }

    /**
     * Takes an {@linkcode Type} and transforms it to a {@linkcode TypedJson} format.
     *
     * @returns {TypedJson} The transformed object.
     */
    public toTypedJSON(): TypedJson<Serializable> {
        return {
            ['@type']: JSON_DISCRIMINATOR,
            value: this.data.toString('hex'),
        };
    }

    /**
     * Takes a {@linkcode TypedJson} object and converts it to instance of type {@linkcode DataBlob}.
     *
     * @param {TypedJson} json - The typed JSON to convert.
     * @throws {TypedJsonParseError} - If unexpected JSON string is passed.
     * @returns {DataBlob} The parsed instance.
     */
    public static fromTypedJSON = /*#__PURE__*/ makeFromTypedJson(JSON_DISCRIMINATOR, (v: Serializable) => {
        const data = Buffer.from(v, 'hex');
        return new DataBlob(data);
    });
}
