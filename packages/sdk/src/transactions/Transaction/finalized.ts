import { AccountSigner } from '../../index.js';
import { AccountTransactionV0, AccountTransactionV1, Payload, Transaction } from '../index.js';
import { type Signable, type SignableV0, type SignableV1, sign } from './signable.js';

type PreFinalized = AccountTransactionV0.Unsigned | AccountTransactionV1.Unsigned;

export function preFinalized(transaction: SignableV1): AccountTransactionV1.Unsigned;
export function preFinalized(transaction: SignableV0): AccountTransactionV0.Unsigned;
export function preFinalized(transaction: Signable): PreFinalized;

export function preFinalized(transaction: Signable): PreFinalized {
    const { expiry, sender, nonce, numSignatures = 1n } = transaction.header;
    const energyAmount = Transaction.getEnergyCost({
        ...transaction,
        header: { ...transaction.header, numSignatures },
    });

    if (transaction.version === 1) {
        const v1Header: AccountTransactionV1.Header = {
            expiry,
            sender,
            nonce,
            payloadSize: Payload.sizeOf(transaction.payload),
            energyAmount,
            sponsor: transaction.header.sponsor?.account,
        };
        return {
            version: 1,
            header: v1Header,
            payload: transaction.payload,
        };
    }

    const v0Header: AccountTransactionV0.Header = {
        expiry,
        sender,
        nonce,
        payloadSize: Payload.sizeOf(transaction.payload),
        energyAmount,
    };
    return {
        version: 0,
        header: v0Header,
        payload: transaction.payload,
    };
}

/**
 * A finalized account transaction, which is ready for submission.
 */
export type Finalized = AccountTransactionV0.Type | AccountTransactionV1.Type;

/**
 * Signs a transaction using the provided signer, calculating total energy cost and creating a _finalized transaction.
 *
 * This is the same as doing `Transaction.finalize(await Transaction.sign(transaction))`
 *
 * @param transaction the unsigned transaction to sign
 * @param signer the account signer containing keys and signature logic
 *
 * @returns a promise resolving to the signed transaction
 * @throws if too many signatures are included in the transaction
 */
export async function signAndFinalize(transaction: Signable, signer: AccountSigner): Promise<Finalized> {
    const signed = await sign(transaction, signer);
    return finalize(signed);
}

/**
 * Finalizes a _pre-finalized transaction, creating a _finalized_ transaction which is ready for submission.
 *
 * @param transaction the signed transaction
 *
 * @returns a corresponding _finalized_ transaction
 * @throws if too many signatures are included in the transaction
 */
export function finalize(transaction: Signable): Finalized {
    switch (transaction.version) {
        case 0:
            return AccountTransactionV0.create(preFinalized(transaction), transaction.signature);
        case 1:
            return AccountTransactionV1.create(preFinalized(transaction), transaction.signatures);
    }
}

/**
 * Gets the transaction hash that is used to look up the status of a transaction.
 * @param transaction the transaction to hash
 * @returns the sha256 hash of the serialized block item kind, signatures, header, type and payload
 */
export function getAccountTransactionHash(transaction: Finalized): Uint8Array {
    switch (transaction.version) {
        case 0:
            return AccountTransactionV0.getAccountTransactionHash(transaction);
        case 1:
            return AccountTransactionV1.getAccountTransactionHash(transaction);
    }
}

/**
 * Serializes a _finalized_ transaction as a block item for submission to the chain.
 * @param transaction the signed transaction to serialize
 * @returns the serialized block item as a byte array
 */
export function serializeBlockItem(transaction: Finalized): Uint8Array {
    switch (transaction.version) {
        case 0:
            return AccountTransactionV0.serializeBlockItem(transaction);
        case 1:
            return AccountTransactionV1.serializeBlockItem(transaction);
    }
}
