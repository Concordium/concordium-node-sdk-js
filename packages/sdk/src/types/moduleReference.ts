import { Buffer } from 'buffer/index.js';
import { packBufferWithWord32Length } from '../serializationHelpers.js';

/**
 * Representation of a module reference, which enforces that it:
 * - Hash length exactly 64
 * - Is a valid 64 length hex string
 */
export class ModuleReference {
    moduleRef: string;

    decodedModuleRef: Uint8Array;

    constructor(moduleRef: string) {
        if (moduleRef.length !== 64) {
            throw new Error(
                'The provided moduleRef ' +
                    moduleRef +
                    ' is invalid as its length was not 64'
            );
        }
        try {
            this.decodedModuleRef = Buffer.from(moduleRef, 'hex');
            this.moduleRef = moduleRef;
        } catch (error) {
            throw error;
        }
    }

    static fromBytes(bytes: ArrayBuffer): ModuleReference {
        return new ModuleReference(Buffer.from(bytes).toString('hex'));
    }

    toJSON(): string {
        return packBufferWithWord32Length(
            Buffer.from(this.decodedModuleRef)
        ).toString('hex');
    }
}
