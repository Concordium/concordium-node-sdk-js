import { Buffer } from 'buffer/index.js';
import { packBufferWithWord16Length } from '../serializationHelpers.js';
import {
    TypeBase,
    TypedJsonDiscriminator,
    TypedJsonParseError,
    TypedJsonParseErrorType,
    fromTypedJson,
} from './util.js';
import type { HexString } from '../types.js';
import { Cursor, deserializeUInt16BE } from '../deserializationHelpers.js';

/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 */
export const JSON_TYPE = TypedJsonDiscriminator.DataBlob;
type Json = HexString;

/**
 * Representation of a transfer's memo or a registerData transaction's data, which enforces that:
 * - the byte length is <= 256
 */
export class DataBlob extends TypeBase<Json> {
    protected jsonType = JSON_TYPE;
    protected get jsonValue(): string {
        // TODO: why is this prefixed with length of data?
        return packBufferWithWord16Length(this.data).toString('hex');
    }
    public readonly data: Buffer;

    constructor(data: ArrayBuffer) {
        if (data.byteLength > 256) {
            throw new Error("A data blob's size cannot exceed 256 bytes");
        }

        super();
        this.data = Buffer.from(data);
    }

    /**
     * Takes a JSON string and converts it to instance of type {@linkcode DataBlob}.
     *
     * @param {JsonString} json - The JSON string to convert.
     * @throws {TypedJsonParseError} - If unexpected JSON string is passed.
     * @returns {DataBlob} The parsed instance.
     */
    public static fromJSON = fromTypedJson(JSON_TYPE, (v: Json) => {
        const cursor = Cursor.fromHex(v);
        const len = deserializeUInt16BE(cursor);
        const data = cursor.remainingBytes;

        if (data.length !== len) {
            throw new TypedJsonParseError(
                TypedJsonParseErrorType.Malformed,
                `Expected byte length of data to be ${len}, had actual length of ${data.length}`
            );
        }

        return new DataBlob(data);
    });
}
