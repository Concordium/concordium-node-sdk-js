import { Buffer } from 'buffer/index.js';
import { packBufferWithWord16Length } from '../serializationHelpers.js';
import { TypeBase, TypedJsonDiscriminator, makeFromTypedJson } from './util.js';
import type { HexString } from '../types.js';

/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 */
export const JSON_DISCRIMINATOR = TypedJsonDiscriminator.DataBlob;
type Serializable = HexString;

/**
 * Representation of a transfer's memo or a registerData transaction's data, which enforces that:
 * - the byte length is <= 256
 */
export class DataBlob extends TypeBase<Serializable> {
    protected typedJsonType = JSON_DISCRIMINATOR;
    protected get serializable(): string {
        return this.data.toString('hex');
    }
    public readonly data: Buffer;

    constructor(data: ArrayBuffer) {
        if (data.byteLength > 256) {
            throw new Error("A data blob's size cannot exceed 256 bytes");
        }

        super();
        this.data = Buffer.from(data);
    }

    toJSON(): string {
        return packBufferWithWord16Length(this.data).toString('hex');
    }

    /**
     * Takes a JSON string and converts it to instance of type {@linkcode DataBlob}.
     *
     * @param {TypedJson} json - The typed JSON to convert.
     * @throws {TypedJsonParseError} - If unexpected JSON string is passed.
     * @returns {DataBlob} The parsed instance.
     */
    public static fromTypedJSON = makeFromTypedJson(
        JSON_DISCRIMINATOR,
        (v: Serializable) => {
            const data = Buffer.from(v, 'hex');
            return new DataBlob(data);
        }
    );
}
