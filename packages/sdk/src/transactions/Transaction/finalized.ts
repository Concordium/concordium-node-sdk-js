import { deserializeUint8 } from '../../deserialization.js';
import { Cursor } from '../../deserializationHelpers.js';
import { Upward } from '../../grpc/upward.js';
import { AccountSigner } from '../../signHelpers.js';
import { BlockItem, BlockItemKind } from '../../types.js';
import { deserializeCredentialDeployment } from '../../wasm/deserialization.js';
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

    const v0Header: AccountTransactionV0.Header = {
        expiry,
        sender,
        nonce,
        payloadSize: Payload.sizeOf(transaction.payload),
        energyAmount,
    };

    if (transaction.version === 0) {
        return {
            version: 0,
            header: v0Header,
            payload: transaction.payload,
        };
    }

    const v1Header: AccountTransactionV1.Header = {
        ...v0Header,
        sponsor: transaction.header.sponsor?.account,
    };
    return {
        version: 1,
        header: v1Header,
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

/**
 * Deserializes a transaction from the block item encoding used to send it to a node.
 *
 * @param buffer A buffer containing transaction encoding. It is expected to start the _block item kind_.
 * @returns a block item.
 **/
export function deserializeBlockItem(buffer: ArrayBuffer): Upward<BlockItem> {
    const cursor = Cursor.fromBuffer(buffer);

    const blockItemKind = deserializeUint8(cursor);
    let blockItem: BlockItem;
    switch (blockItemKind) {
        case BlockItemKind.AccountTransactionKind:
            blockItem = {
                kind: BlockItemKind.AccountTransactionKind,
                transaction: AccountTransactionV0.deserialize(cursor),
            };
            break;
        case BlockItemKind.CredentialDeploymentKind:
            blockItem = {
                kind: BlockItemKind.CredentialDeploymentKind,
                transaction: deserializeCredentialDeployment(cursor),
            };
            break;
        case BlockItemKind.UpdateInstructionKind:
            throw new Error('deserialization of UpdateInstructions is not supported');
        case BlockItemKind.AccountTransactionV1Kind:
            blockItem = {
                kind: BlockItemKind.AccountTransactionV1Kind,
                transaction: AccountTransactionV1.deserialize(cursor),
            };
            break;
        default:
            return null;
    }

    if (cursor.remainingBytes.length !== 0) throw new Error('Deserializing the transaction did not exhaust the buffer');
    return blockItem;
}
