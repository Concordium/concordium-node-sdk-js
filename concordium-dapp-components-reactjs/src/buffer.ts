import { Buffer } from 'buffer/';

export function decodeByte(buffer: Buffer, offset: number) {
    return [buffer.readUInt8(offset), offset + 1];
}

export function decodeAmount(buffer: Buffer, offset: number) {
    return [buffer.readBigUInt64LE(offset), offset + 8];
}
