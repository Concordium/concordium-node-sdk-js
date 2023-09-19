import { Buffer } from 'buffer/index.js';
import { packBufferWithWord16Length } from '../serializationHelpers.js';

/**
 * Representation of a transfer's memo or a registerData transaction's data, which enforces that:
 * - the byte length is <= 256
 */
export class DataBlob {
    data: Buffer;

    constructor(data: Buffer) {
        if (data.length > 256) {
            throw new Error("A data blob's size cannot exceed 256 bytes");
        }
        this.data = data;
    }

    toJSON(): string {
        return packBufferWithWord16Length(this.data).toString('hex');
    }
}
