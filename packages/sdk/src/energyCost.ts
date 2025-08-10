import { getAccountTransactionHandler } from './accountTransactions.js';
import { getUpdatePayloadSize } from './contractHelpers.js';
import { ConcordiumGRPCClient } from './grpc/GRPCClient.js';
import { AccountAddress, ContractAddress, Parameter, ReceiveName } from './pub/types.js';
import { collapseRatio, multiplyRatio } from './ratioHelpers.js';
import { serializeAccountTransactionPayload } from './serialization.js';
import { AccountTransactionPayload, AccountTransactionType, ChainParameters, Ratio } from './types.js';
import * as BlockHash from './types/BlockHash.js';
import * as CcdAmount from './types/CcdAmount.js';
import * as Energy from './types/Energy.js';

/**
 * These constants must be consistent with constA and constB in:
 * https://github.com/Concordium/concordium-base/blob/main/haskell-src/Concordium/Cost.hs
 */
export const constantA = 100n;
export const constantB = 1n;

// Account address (32 bytes), nonce (8 bytes), energy (8 bytes), payload size (4 bytes), expiry (8 bytes);
const ACCOUNT_TRANSACTION_HEADER_SIZE = BigInt(32 + 8 + 8 + 4 + 8);

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
): Energy.Type {
    return Energy.create(
        constantA * signatureCount +
            constantB * (ACCOUNT_TRANSACTION_HEADER_SIZE + payloadSize) +
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
): Energy.Type {
    const size = serializeAccountTransactionPayload({ payload, type: transactionType }).length;
    const handler = getAccountTransactionHandler(transactionType);
    return calculateEnergyCost(signatureCount, BigInt(size), handler.getBaseEnergyCost(payload));
}

/**
 * Get contract update energy cost
 * Estimated by calculateEnergyCost, where transactionSpecificCost received from invokeContract used energy
 * @param {ConcordiumGRPCClient} grpcClient - The client to be used for the query
 * @param {ContractAddress.Type} contractAddress - The address of the contract to query
 * @param {AccountAddress.Type} invoker - Representation of an account address
 * @param {Parameter.Type} parameter - Input for contract function
 * @param {ReceiveName.Type} method - Represents a receive-function in a smart contract module
 * @param {bigint} signatureCount - Number of expected signatures
 * @param {BlockHash.Type} [blockHash] - Optional block hash allowing for dry-running the contract update at the end of a specific block.
 *
 * @throws {Error} 'no response' if either the block does not exist, or then node fails to parse any of the inputs
 * If the response tag is `failure`, then error contains a response message
 *
 * @returns {Energy} estimated amount of energy for the last finalized block according to the node,
 * this means that the actual energy cost might be different depending on the implementation of the smart contract
 * and the interaction with the instance, since this was estimated
 */
export async function getContractUpdateEnergyCost(
    grpcClient: ConcordiumGRPCClient,
    contractAddress: ContractAddress.Type,
    invoker: AccountAddress.Type,
    parameter: Parameter.Type,
    method: ReceiveName.Type,
    signatureCount: bigint,
    blockHash?: BlockHash.Type
): Promise<Energy.Type> {
    const res = await grpcClient.invokeContract(
        {
            contract: contractAddress,
            invoker,
            parameter,
            method,
        },
        blockHash
    );

    if (!res || res.tag === 'failure') {
        throw new Error(res?.reason?.tag || 'no response');
    }

    return calculateEnergyCost(
        signatureCount,
        getUpdatePayloadSize(parameter.buffer.length, method.toString().length),
        res.usedEnergy.value
    );
}

/**
 * Given the current blockchain parameters, return the microCCD per NRG exchange rate of the chain.
 * @returns the microCCD per NRG exchange rate as a ratio.
 */
export function getExchangeRate({ euroPerEnergy, microGTUPerEuro }: ChainParameters): Ratio {
    const denominator = BigInt(euroPerEnergy.denominator * microGTUPerEuro.denominator);
    const numerator = BigInt(euroPerEnergy.numerator * microGTUPerEuro.numerator);
    return { numerator, denominator };
}

/**
 * Given an NRG amount and the current blockchain parameters, this returns the corresponding amount in microCcd.
 */
export function convertEnergyToMicroCcd(cost: Energy.Type, chainParameters: ChainParameters): CcdAmount.Type {
    const rate = getExchangeRate(chainParameters);
    return CcdAmount.fromMicroCcd(collapseRatio(multiplyRatio(rate, cost.value)));
}
