import type * as Proto from '../grpc-api/v2/concordium/types.js';
import {
    TypedJson,
    TypedJsonDiscriminator,
    makeFromTypedJson,
} from './util.js';

// IMPORTANT:
// When adding functionality to this module, it is important to not change the wrapper class, as changing this might break compatibility
// between different versions of the SDK, e.g. if a dependency exposes an API that depends on the class and a class from a different version
// of the SDK is passed.

/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 */
export const JSON_DISCRIMINATOR = TypedJsonDiscriminator.SequenceNumber;
export type Serializable = string;

/** Transaction sequence number. (Formerly refered as Nonce) */
class SequenceNumber {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __type = JSON_DISCRIMINATOR;
    constructor(
        /** Internal value representing the sequence number. */
        public readonly value: bigint
    ) {}
}

/**
 * Unwraps {@linkcode Type} value
 *
 * @param value value to unwrap.
 * @returns the unwrapped {@linkcode bigint} value
 */
export function toUnwrappedJSON(value: Type): bigint {
    return value.value;
}

/** A transaction sequence number. (Formerly refered as Nonce) */
export type Type = SequenceNumber;

/**
 * Type predicate for {@linkcode Type}
 *
 * @param value value to check.
 * @returns whether `value` is of type {@linkcode Type}
 */
export function instanceOf(value: unknown): value is SequenceNumber {
    return value instanceof SequenceNumber;
}

/**
 * Construct an SequenceNumber type.
 * @param {bigint | number} sequenceNumber The account sequence number.
 * @throws If `sequenceNumber` is not at least 1.
 * @returns {SequenceNumber}
 */
export function create(sequenceNumber: bigint | number): SequenceNumber {
    if (sequenceNumber < 1) {
        throw new Error(
            'Invalid account sequence number: Must be 1 or higher.'
        );
    }
    return new SequenceNumber(BigInt(sequenceNumber));
}

/**
 * Convert a SequenceNumber from its protobuf encoding.
 * @param {Proto.SequenceNumber} sequenceNumber The sequence number in protobuf.
 * @returns {SequenceNumber} The sequence number.
 */
export function fromProto(
    sequenceNumber: Proto.SequenceNumber
): SequenceNumber {
    return create(sequenceNumber.value);
}

/**
 * Convert a sequence number into its protobuf encoding.
 * @param {SequenceNumber} sequenceNumber The duration.
 * @returns {Proto.SequenceNumber} The protobuf encoding.
 */
export function toProto(sequenceNumber: SequenceNumber): Proto.SequenceNumber {
    return {
        value: sequenceNumber.value,
    };
}

/**
 * Constructs a {@linkcode Type} from {@linkcode Serializable}.
 * @param {Serializable} value
 * @returns {Type} The duration.
 */
export function fromSerializable(value: Serializable): Type {
    return create(BigInt(value));
}

/**
 * Converts {@linkcode Type} into {@linkcode Serializable}
 * @param {Type} value
 * @returns {Serializable} The serializable value
 */
export function toSerializable(value: Type): Serializable {
    return value.value.toString();
}

/**
 * Takes an {@linkcode Type} and transforms it to a {@linkcode TypedJson} format.
 *
 * @param {Type} value - The account address instance to transform.
 * @returns {TypedJson} The transformed object.
 */
export function toTypedJSON(value: SequenceNumber): TypedJson<Serializable> {
    return {
        ['@type']: JSON_DISCRIMINATOR,
        value: toSerializable(value),
    };
}

/**
 * Takes a {@linkcode TypedJson} object and converts it to instance of type {@linkcode Type}.
 *
 * @param {TypedJson} json - The typed JSON to convert.
 * @throws {TypedJsonParseError} - If unexpected JSON string is passed.
 * @returns {Type} The parsed instance.
 */
export const fromTypedJSON = /*#__PURE__*/ makeFromTypedJson(
    JSON_DISCRIMINATOR,
    fromSerializable
);
