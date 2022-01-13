import { deserialModule, Module } from '../src/deserializeSchema';
import { PassThrough } from 'stream';

export function deserialModuleFromBuffer(buffer: Buffer | undefined): Module {
    const bufferStream = new PassThrough();
    bufferStream.end(buffer);
    return deserialModule(bufferStream);
}
