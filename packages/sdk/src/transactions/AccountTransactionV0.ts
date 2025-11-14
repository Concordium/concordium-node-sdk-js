import { constantA, constantB } from '../energyCost.ts';
import { sha256 } from '../hash.ts';
import { serializeAccountTransactionPayload } from '../serialization.js';
import { encodeWord32, encodeWord64 } from '../serializationHelpers.ts';
import { AccountSigner } from '../signHelpers.ts';
import { AccountTransactionPayload, AccountTransactionSignature, AccountTransactionType } from '../types.js';
import { AccountAddress, Energy, SequenceNumber, TransactionExpiry } from '../types/index.js';

/**
 * Header metadata for a version 0 account transaction.
 */
export type Header = {
    /** account address that is source of this transaction */
    sender: AccountAddress.Type;
    /**
     * the nonce for the transaction, usually acquired by
     * getting the next account nonce from the node
     */
    nonce: SequenceNumber.Type;
    /** expiration of the transaction */
    expiry: TransactionExpiry.Type;
    /**
     * The energy limit for the transaction, including energy spent on signature verification, parsing
     * the header, and transaction execution.
     */
    energyAmount: Energy.Type;
    /** payload size */
    payloadSize: number;
};

/**
 * Signature type for account transactions.
 */
export type Signature = AccountTransactionSignature;

/**
 * A complete version 0 account transaction with header, type, payload, and signature.
 */
type Transaction = {
    /**
     * The transaction header containing metadata for the transaction
     */
    header: Header;
    /**
     * The transaction type to execute
     */
    type: AccountTransactionType;
    /**
     * The transaction payload corresponding to the `type` declared
     */
    payload: AccountTransactionPayload;
    /**
     * The signature by the transaction sender on the transaction
     */
    signature: Signature;
};

/**
 * A complete version 0 account transaction with header, type, payload, and signature.
 */
export type Type = Transaction;

/**
 * Serializes a version 0 transaction header to bytes.
 * @param header the transaction header to serialize
 * @returns the serialized header as a byte array
 */
function serializeHeader(header: Header): Uint8Array {
    const sender = AccountAddress.toBuffer(header.sender);
    const nonce = encodeWord64(header.nonce.value);
    const energyAmount = encodeWord64(header.energyAmount.value);
    const payloadSize = encodeWord32(header.payloadSize);
    const expiry = encodeWord64(header.expiry.expiryEpochSeconds);
    return Buffer.concat([sender, nonce, energyAmount, payloadSize, expiry]);
}

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
    payloadSize: bigint | number,
    transactionSpecificCost: Energy.Type
): Energy.Type {
    return Energy.create(
        constantA * signatureCount +
            constantB * (ACCOUNT_TRANSACTION_HEADER_SIZE + BigInt(payloadSize)) +
            transactionSpecificCost.value
    );
}

/**
 * An unsigned version 0 account transaction (without signature).
 */
export type Unsigned = Omit<Transaction, 'signature'>;

/**
 * Returns the digest of the transaction that has to be signed.
 * @param transaction the transaction to hash
 * @returns the sha256 hash on the serialized header, type and payload
 */
export function signDigest(transaction: Unsigned): Uint8Array {
    const serializedPayload = serializeAccountTransactionPayload(transaction);
    const serializedHeader = serializeHeader(transaction.header);
    return sha256([serializedHeader, serializedPayload]);
}

/**
 * Signs an unsigned version 0 account transaction using the provided signer.
 * @param transaction the unsigned transaction to sign
 * @param signer the account signer to use for signing
 * @returns a promise resolving to the signed transaction
 */
export async function sign(transaction: Unsigned, signer: AccountSigner): Promise<Transaction> {
    const signature = await signer.sign(signDigest(transaction));
    return { ...transaction, signature };
}
