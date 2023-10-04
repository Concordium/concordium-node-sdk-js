import type * as Proto from '../grpc-api/v2/concordium/types.js';

/** Transaction sequence number. (Formerly refered as Nonce) */
class SequenceNumber {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __nominal = true;
    constructor(
        /** Internal value representing the sequence number. */
        public readonly value: bigint
    ) {}
}

/** A transaction sequence number. (Formerly refered as Nonce) */
export type Type = SequenceNumber;

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
