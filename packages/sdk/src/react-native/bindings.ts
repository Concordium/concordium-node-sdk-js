export async function loadBindings() {
    return (await import('./nativeBridge.js')).bindings;
}

/** Validates indices before UniFFI converts JS numbers to fixed-width Rust integers. */
export function indexInRange(value: number, label: string, max = 0x7fff_ffff): number {
    if (!Number.isInteger(value) || value < 0 || value > max) {
        throw new RangeError(`${label} must be an integer between 0 and ${max}`);
    }
    return value;
}

/** Convert views without passing unrelated bytes from their backing buffer. */
export function asArrayBuffer(bytes: ArrayBuffer | Uint8Array): ArrayBuffer {
    return bytes instanceof ArrayBuffer ? bytes : Uint8Array.from(bytes).buffer;
}
