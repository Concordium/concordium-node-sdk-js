/** Account transaction sequence number. (Formerly refered as Nonce) */
class AccountSequenceNumber {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __nominal = true;
    constructor(
        /** Internal value representing the sequence number. */
        public readonly value: bigint
    ) {}
}

/** Account transaction sequence number. (Formerly refered as Nonce) */
export type Type = AccountSequenceNumber;

/**
 * Construct an AccountSequenceNumber type.
 * @param {bigint | number} sequenceNumber The account sequence number.
 * @throws If `sequenceNumber` is not at least 1.
 * @returns {AccountSequenceNumber}
 */
export function create(sequenceNumber: bigint | number): AccountSequenceNumber {
    if (sequenceNumber < 1) {
        throw new Error(
            'Invalid account sequence number: Must be 1 or higher.'
        );
    }
    return new AccountSequenceNumber(BigInt(sequenceNumber));
}
