declare module 'leb128/unsigned' {
    export function decode(buffer: import('buffer/').Buffer): string;
    export function encode(value: string): import('buffer/').Buffer;
}
