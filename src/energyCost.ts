/**
 * These constants must be consistent with constA and constB in:
 * https://github.com/Concordium/concordium-base/blob/main/haskell-src/Concordium/Cost.hs
 */
export const constantA = 100n;
export const constantB = 1n;

// Account address (32 bytes), nonce (8 bytes), energy (8 bytes), payload size (4 bytes), expiry (8 bytes);
const accountTransactionHeaderSize = BigInt(32 + 8 + 8 + 4 + 8);

/**
 * The energy cost is assigned according to the formula:
 * A * signatureCount + B * size + C_t, where C_t is a transaction specific cost.
 *
 * The transaction specific cost can be found at https://github.com/Concordium/concordium-base/blob/main/haskell-src/Concordium/Cost.hs.
 * @param signatureCount number of signatures for the transaction
 * @param payloadSize size of the payload in bytes
 * @param transactionSpecificCost a transaction specific cost
 * @returns the energy cost for the transaction, to be set in the transaction header
 */
export function calculateEnergyCost(
    signatureCount: bigint,
    payloadSize: bigint,
    transactionSpecificCost: bigint
): bigint {
    return (
        constantA * signatureCount +
        constantB * (accountTransactionHeaderSize + payloadSize) +
        transactionSpecificCost
    );
}
