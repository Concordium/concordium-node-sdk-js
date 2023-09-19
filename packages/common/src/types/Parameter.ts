import { checkParameterLength } from '../contractHelpers.js';
import type { HexString } from '../types.js';

/** Parameter for a smart contract entrypoint. */
class Parameter {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __nominal = true;
    constructor(
        /** Internal buffer of bytes representing the parameter. */
        public readonly buffer: ArrayBuffer
    ) {}
}

/** Parameter for a smart contract entrypoint. */
export type Type = Parameter;

/**
 * Create a parameter for a smart contract entrypoint.
 * Ensuring the buffer does not exceed the maximum number of bytes supported for a smart contract parameter.
 * @param {ArrayBuffer} buffer The buffer of bytes representing the parameter.
 * @throws If the provided buffer exceed the supported number of bytes for a smart contract.
 * @returns {Parameter}
 */
export function fromBuffer(buffer: ArrayBuffer): Parameter {
    checkParameterLength(buffer);
    return new Parameter(buffer);
}

/**
 * Create an unchecked parameter for a smart contract entrypoint.
 * It is up to the caller to ensure the buffer does not exceed the maximum number of bytes supported for a smart contract parameter.
 * @param {ArrayBuffer} buffer The buffer of bytes representing the parameter.
 * @returns {Parameter}
 */
export function fromBufferUnchecked(buffer: ArrayBuffer): Parameter {
    return new Parameter(buffer);
}

/**
 * Create a parameter for a smart contract entrypoint from a hex string.
 * Ensuring the parameter does not exceed the maximum number of bytes supported for a smart contract parameter.
 * @param {HexString} hex String with hex encoding of the parameter.
 * @throws If the provided parameter exceed the supported number of bytes for a smart contract.
 * @returns {Parameter}
 */
export function fromHexString(hex: HexString): Parameter {
    return fromBuffer(Buffer.from(hex, 'hex'));
}

/**
 * Convert a parameter into a hex string.
 * @param {Parameter} parameter The parameter to encode in a hex string.
 * @returns {HexString}
 */
export function toHexString(parameter: Parameter): HexString {
    return Buffer.from(parameter.buffer).toString('hex');
}
