import { AccountSigner, AccountTransactionSignature, MakeRequired } from '../../index.js';
import { countSignatures } from '../../util.js';
import { AccountTransactionV0, AccountTransactionV1, Payload, Transaction } from '../index.js';

type Unsigned = AccountTransactionV0.Unsigned | AccountTransactionV1.Unsigned;

function toUnsigned(transaction: SignableV1): AccountTransactionV1.Unsigned;
function toUnsigned(transaction: SignableV0): AccountTransactionV0.Unsigned;
function toUnsigned(transaction: Signable): Unsigned;

function toUnsigned(transaction: Signable): Unsigned {
    const { expiry, sender, nonce, numSignatures = 1n } = transaction.header;
    const energyAmount = Transaction.getEnergyCost({
        ...transaction,
        header: { ...transaction.header, numSignatures },
    });

    if (transaction.preVersion === 1) {
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

export type Signable<P extends Payload.Type = Payload.Type> = SignableV0<P> | SignableV1<P>;

type SignableV0<P extends Payload.Type = Payload.Type> = {
    preVersion: 0;
    /**
     * The transaction input header of the v0 _signable_ transaction stage, i.e. with everything required to finalize the
     * transaction.
     */
    readonly header: Required<
        Pick<Transaction.Header, 'sender' | 'nonce' | 'expiry' | 'executionEnergyAmount' | 'numSignatures'>
    >;
    /**
     * The transaction payload, defining the transaction type and type specific data.
     */
    readonly payload: P;
    /**
     * The map of signatures for the credentials associated with the account.
     */
    readonly signature: AccountTransactionSignature;
};

type SignableV1<P extends Payload.Type = Payload.Type> = {
    preVersion: 1;
    /**
     * The transaction input header of the v1 _signable_ transaction stage, i.e. with everything required to finalize the
     * transaction.
     */
    readonly header: MakeRequired<Transaction.Header, keyof SignableV0['header']>;
    /**
     * The transaction payload, defining the transaction type and type specific data.
     */
    readonly payload: P;
    /**
     * The signatures for both `sender` and `sponsor`.
     */
    readonly signatures: AccountTransactionV1.Signatures;
};

function validateSignatureAmount(
    signature: AccountTransactionSignature,
    numAllowed: bigint,
    role: 'sender' | 'sponsor' = 'sender'
): void {
    const sigs = countSignatures(signature);
    if (sigs > numAllowed)
        throw new Error(
            `Too many ${role} signatures added to the transaction. Counted ${sigs}, but transaction specifies ${numAllowed} allowed number of signatures.`
        );
}

/**
 * Adds a pre-computed signature to a _signable_ transaction.
 *
 * @template P - the payload type
 * @template T - the transaction type
 *
 * @param transaction - the transaction to add a signature to
 * @param signature - the sender signature on the transaction to add
 *
 * @returns the signed transaction with the signature attached
 * @throws Error if the number of signatures exceeds the allowed number specified in the transaction header
 */
export function addSignature<P extends Payload.Type = Payload.Type>(
    transaction: Signable<P>,
    signature: AccountTransactionSignature
): Signable<P> {
    switch (transaction.preVersion) {
        case 0: {
            const signed: SignableV0<P> = {
                ...transaction,
                signature,
            };
            return mergeSignatures(transaction, signed);
        }
        case 1: {
            const signed: SignableV1<P> = {
                ...transaction,
                signatures: { sender: signature },
            };
            return mergeSignatures(transaction, signed);
        }
    }
}

/**
 * Signs a _signable_ transaction using the provided account signer.
 *
 * @template P - the payload type
 * @template T - the transaction type
 *
 * @param transaction - the signable transaction to sign
 * @param signer - the account signer to use for signing
 *
 * @returns a promise that resolves to the signed transaction
 * @throws Error if the number of signatures exceeds the allowed number specified in the transaction header
 */
export async function sign<P extends Payload.Type = Payload.Type>(
    transaction: Signable<P>,
    signer: AccountSigner
): Promise<Signable<P>> {
    let signature: AccountTransactionSignature;
    switch (transaction.preVersion) {
        case 0: {
            signature = await AccountTransactionV0.createSignature(toUnsigned(transaction), signer);
            break;
        }
        case 1: {
            signature = await AccountTransactionV1.createSignature(toUnsigned(transaction), signer);
            break;
        }
    }

    return addSignature(transaction, signature);
}

/**
 * Adds a pre-computed sponsor signature to a _signable_ transaction.
 *
 * @template P - the payload type
 * @template T - the transaction type
 *
 * @param transaction - the transaction to add a sponsor signature to
 * @param signature - the sponsor signature on the transaction to add
 *
 * @returns the signed transaction with the sponsor signature attached
 * @throws Error if the number of signatures exceeds the allowed number specified in the transaction header
 */
export function addSponsorSignature<P extends Payload.Type = Payload.Type>(
    transaction: SignableV1<P>,
    signature: AccountTransactionSignature
): Signable<P> {
    const signed: SignableV1<P> = {
        ...transaction,
        signatures: { sponsor: signature, sender: {} },
    };
    return mergeSignatures(transaction, signed);
}

/**
 * Signs a _signable_ transaction as a sponsor using the provided account signer.
 *
 * @template P - the payload type
 * @template T - the transaction type
 *
 * @param transaction - the signable transaction to sign
 * @param signer - the account signer to use for signing
 *
 * @returns a promise that resolves to the signed transaction
 * @throws Error if the number of signatures exceeds the allowed number specified in the transaction header
 */
export async function sponsor<P extends Payload.Type = Payload.Type>(
    transaction: SignableV1<P>,
    signer: AccountSigner
): Promise<Signable<P>> {
    let signature = await AccountTransactionV1.createSignature(toUnsigned(transaction), signer);
    return addSponsorSignature(transaction, signature);
}

function mergeSignature(a: AccountTransactionSignature, b: AccountTransactionSignature): AccountTransactionSignature;
function mergeSignature(
    a: AccountTransactionSignature | undefined,
    b: AccountTransactionSignature | undefined
): AccountTransactionSignature | undefined;

function mergeSignature(
    a: AccountTransactionSignature | undefined,
    b: AccountTransactionSignature | undefined
): AccountTransactionSignature | undefined {
    if (a === undefined) return b;
    if (b === undefined) return a;

    const signature: AccountTransactionSignature = {};
    // First, we copy all the signatures from `a`.
    for (const credIndex in a) {
        signature[credIndex] = { ...a[credIndex] };
    }

    for (const credIndex in b) {
        if (signature[credIndex] === undefined) {
            // If signatures don't exist for this credential index, we copy everything and move on.
            signature[credIndex] = { ...b[credIndex] };
            continue;
        }

        // Otherwise, check all key indices of the credential signature
        for (const keyIndex in b[credIndex]) {
            const sig = signature[credIndex][keyIndex];
            if (sig !== undefined)
                throw new Error(`Duplicate signature found for credential index ${credIndex} at key index ${keyIndex}`);

            // Copy the signature found, as it does not already exist
            signature[credIndex][keyIndex] = b[credIndex][keyIndex];
        }
    }

    return signature;
}

/**
 * Merges signatures from two _signable_ transactions into a single _signable_ transaction.
 * Used for multi-signature scenarios where multiple parties sign the same transaction.
 *
 * @template P - the payload type
 * @template T - the signed transaction type
 *
 * @param a - the first signed transaction
 * @param b - the second signed transaction
 *
 * @returns a new _signable_ transaction containing all signatures from both transactions
 * @throws Error if duplicate signatures are found for the same credential and key index
 * @throws Error if the number of signatures exceeds the allowed number specified in the transaction header
 */
export function mergeSignatures<P extends Payload.Type, T extends Signable<P> = Signable<P>>(a: T, b: T): T {
    if (a.preVersion !== b.preVersion) throw new Error('"a" is incompatible with "b"');

    switch (a.preVersion) {
        case 0: {
            const signature: AccountTransactionSignature = mergeSignature(a.signature, (b as SignableV0).signature);
            validateSignatureAmount(signature, a.header.numSignatures);
            return { ...a, signature: signature };
        }
        case 1: {
            const bv1 = b as SignableV1;
            const sender = mergeSignature(a.signatures.sender, bv1.signatures.sender);
            const sponsor = mergeSignature(a.signatures.sponsor, bv1.signatures.sponsor);

            validateSignatureAmount(sender, a.header.numSignatures);
            validateSignatureAmount(sponsor ?? {}, a.header.sponsor?.numSignatures ?? 0n);

            return { ...a, signatures: { sender, sponsor } };
        }
    }
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
    switch (transaction.preVersion) {
        case 0:
            return AccountTransactionV0.create(toUnsigned(transaction), transaction.signature);
        case 1:
            return AccountTransactionV1.create(toUnsigned(transaction), transaction.signatures);
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
