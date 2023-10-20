// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Buffer } from 'buffer/index.js';

declare module 'buffer/index.js' {
    export interface Buffer {
        readBigUInt64BE(offset: number): bigint;
    }
}
/* TODO: Find a way to have this typing without affecting dependencies using encodings
declare module "stream" {
    export interface Readable {
        read(size?: number): globalThis.Buffer;
    }
}
*/
