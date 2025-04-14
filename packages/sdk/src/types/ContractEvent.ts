import { Buffer } from 'buffer/index.js';

import type * as Proto from '../grpc-api/v2/concordium/types.js';
import { deserializeTypeValue } from '../schema.js';
import { SchemaType, serializeSchemaType } from '../schemaTypes.js';
import type { Base64String, HexString, SmartContractTypeValues } from '../types.js';

/**
 * @deprecated
 */
export type Serializable = HexString;

/**
 * An event logged by a smart contract instance.
 */
class ContractEvent {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __nominal = true;
    constructor(
        /** The internal buffer of bytes representing the event. */
        public readonly buffer: Uint8Array
    ) {}

    /**
     * Get a string representation of the contract event.
     * @returns {string} The string representation.
     */
    public toString(): string {
        return toHexString(this);
    }

    /**
     * Get a JSON-serializable representation of the contract event.
     * @returns {HexString} The JSON-serializable representation.
     */
    public toJSON(): HexString {
        return toHexString(this);
    }
}

/**
 * Converts a {@linkcode HexString} to a contract event.
 * @param {HexString} json The JSON representation of the contract event.
 * @returns {ContractEvent} The contract event.
 */
export function fromJSON(json: HexString): ContractEvent {
    return fromHexString(json);
}

/**
 * Unwraps {@linkcode Type} value
 * @deprecated Use the {@linkcode ContractEvent.toJSON} method instead.
 * @param value value to unwrap.
 * @returns the unwrapped {@linkcode Serializable} value
 */
export function toUnwrappedJSON(value: Type): Serializable {
    return toHexString(value);
}

/**
 * An event logged by a smart contract instance.
 */
export type Type = ContractEvent;

export function fromBuffer(buffer: ArrayBuffer): ContractEvent {
    return new ContractEvent(new Uint8Array(buffer));
}

/**
 * Create a ContractEvent from a hex string.
 * @param {HexString} hex Hex encoding of the event.
 * @returns {ContractEvent}
 */
export function fromHexString(hex: HexString): ContractEvent {
    return fromBuffer(Buffer.from(hex, 'hex'));
}

/**
 * Hex encode a ContractEvent.
 * @param {ContractEvent} event The event to encode.
 * @returns {HexString} String containing the hex encoding.
 */
export function toHexString(event: ContractEvent): HexString {
    return Buffer.from(event.buffer).toString('hex');
}

/**
 * Get byte representation of a ContractEvent.
 * @param {ContractEvent} event The event.
 * @returns {ArrayBuffer} Hash represented as bytes.
 */
export function toBuffer(event: ContractEvent): Uint8Array {
    return event.buffer;
}

/**
 * Convert a contract event from its protobuf encoding.
 * @param {Proto.ContractEvent} event The protobuf encoding.
 * @returns {ContractEvent}
 */
export function fromProto(event: Proto.ContractEvent): ContractEvent {
    return fromBuffer(event.value);
}

/**
 * Convert a contract event into its protobuf encoding.
 * @param {ContractEvent} event The block hash.
 * @returns {Proto.ContractEvent} The protobuf encoding.
 */
export function toProto(event: ContractEvent): Proto.ContractEvent {
    return {
        value: event.buffer,
    };
}

/**
 * Parse a contract event using a schema type.
 * @param {ContractEvent} event The event.
 * @param {SchemaType} schemaType The schema type for the event.
 * @returns {SmartContractTypeValues}
 */
export function parseWithSchemaType(event: ContractEvent, schemaType: SchemaType): SmartContractTypeValues {
    const schemaBytes = serializeSchemaType(schemaType);
    return deserializeTypeValue(toBuffer(event), schemaBytes);
}

/**
 * Parse a contract event using a schema type.
 * @param {ContractEvent} event The event.
 * @param {Base64String} schemaBase64 The schema type for the event encoded as Base64.
 * @returns {SmartContractTypeValues}
 */
export function parseWithSchemaTypeBase64(event: ContractEvent, schemaBase64: Base64String): SmartContractTypeValues {
    const schemaBytes = Buffer.from(schemaBase64, 'base64');
    return deserializeTypeValue(toBuffer(event), schemaBytes);
}
