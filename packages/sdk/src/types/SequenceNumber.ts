import type * as Proto from '../grpc-api/v2/concordium/types.js';
import { TypeBase, TypedJsonDiscriminator, makeFromTypedJson } from './util.js';

/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 */
export const JSON_TYPE = TypedJsonDiscriminator.SequenceNumber;
type Serializable = string;

/** Transaction sequence number. (Formerly refered as Nonce) */
class SequenceNumber extends TypeBase<Serializable> {
    protected typedJsonType = JSON_TYPE;
    protected get serializable(): Serializable {
        return this.value.toString();
    }

    constructor(
        /** Internal value representing the sequence number. */
        public readonly value: bigint
    ) {
        super();
    }
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

/**
 * Takes a JSON string and converts it to instance of type {@linkcode Type}.
 *
 * @param {TypedJson} json - The typed JSON to convert.
 * @throws {TypedJsonParseError} - If unexpected JSON string is passed.
 * @returns {Type} The parsed instance.
 */
export const fromTypedJSON = makeFromTypedJson(JSON_TYPE, (v: string) => {
    create(BigInt(v));
});
