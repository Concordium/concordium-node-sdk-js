import { getAccountTransactionHandler } from './accountTransactions';
import { collapseRatio, multiplyRatio } from './ratioHelpers';
import {
    AccountTransactionPayload,
    AccountTransactionType,
    ChainParameters,
    Ratio,
} from './types';

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

/**
 * Given a transaction type and the payload of that transaction type, return the corresponding energy cost.
 * Note that the given type and the payload type should match, otherwise the behaviour is undefined (could throw or give incorrect result).
 * @param signatureCount the number of signatures that will be used for the transaction, defaults to 1.
 */
export function getEnergyCost(
    transactionType: AccountTransactionType,
    payload: AccountTransactionPayload,
    signatureCount = 1n
): bigint {
    const handler = getAccountTransactionHandler(transactionType);
    const size = handler.serialize(payload).length;
    return calculateEnergyCost(
        signatureCount,
        BigInt(size),
        handler.getBaseEnergyCost(payload)
    );
}

/**
 * Given the current blockchain parameters, return the microCCD per NRG exchange rate of the chain.
 * @returns the microCCD per NRG exchange rate as a ratio.
 */
export function getExchangeRate({
    euroPerEnergy,
    microCCDPerEuro: microGTUPerEuro,
}: ChainParameters): Ratio {
    const denominator = BigInt(
        euroPerEnergy.denominator * microGTUPerEuro.denominator
    );
    const numerator = BigInt(
        euroPerEnergy.numerator * microGTUPerEuro.numerator
    );
    return { numerator, denominator };
}

/**
 * Given an NRG amount and the current blockchain parameters, this returns the corresponding amount in microCcd.
 */
export function convertEnergyToMicroCcd(
    cost: bigint,
    chainParameters: ChainParameters
): bigint {
    const rate = getExchangeRate(chainParameters);
    return collapseRatio(multiplyRatio(rate, cost));
}
