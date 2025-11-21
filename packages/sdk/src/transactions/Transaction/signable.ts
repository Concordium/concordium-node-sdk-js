import { AccountInfo, AccountSigner, AccountTransactionSignature, MakeRequired } from '../../index.js';
import { assert, assertIn, assertInteger, assertObject, countSignatures, isDefined } from '../../util.js';
import { AccountTransactionV0, AccountTransactionV1, Payload, Transaction } from '../index.js';
import { preFinalized } from './finalized.js';
import { Header, HeaderJSON, headerFromJSON, headerToJSON } from './shared.js';

export type Signable<P extends Payload.Type = Payload.Type> = SignableV0<P> | SignableV1<P>;

export type SignableV0<P extends Payload.Type = Payload.Type> = {
    version: 0;
    /**
     * The transaction input header of the v0 _signable_ transaction stage, i.e. with everything required to finalize the
     * transaction.
     */
    header: Required<Pick<Header, 'sender' | 'nonce' | 'expiry' | 'executionEnergyAmount' | 'numSignatures'>>;
    /**
     * The transaction payload, defining the transaction type and type specific data.
     */
    payload: P;
    /**
     * The map of signatures for the credentials associated with the account.
     */
    signature: AccountTransactionV0.Signature;
};

export type SignableV1<P extends Payload.Type = Payload.Type> = {
    version: 1;
    /**
     * The transaction input header of the v1 _signable_ transaction stage, i.e. with everything required to finalize the
     * transaction.
     */
    header: MakeRequired<Header, keyof SignableV0['header']>;
    /**
     * The transaction payload, defining the transaction type and type specific data.
     */
    payload: P;
    /**
     * The signatures for both `sender` and `sponsor`.
     */
    signatures: AccountTransactionV1.Signatures;
};

type V0JSON = {
    version: 0;
    header: HeaderJSON;
    payload: Payload.JSON;
    signature: AccountTransactionSignature;
};

type V1JSON = {
    version: 1;
    header: HeaderJSON;
    payload: Payload.JSON;
    signatures: AccountTransactionV1.Signatures;
};

export type SignableJSON = V0JSON | V1JSON;

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

export function isSignable(transaction: Transaction.Type): transaction is Signable {
    const hasVersion =
        'version' in transaction && typeof transaction.version === 'number' && [0, 1].includes(transaction.version);
    const hasSigs = 'signature' in transaction || 'signatures' in transaction;
    return hasVersion && hasSigs;
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
    switch (transaction.version) {
        case 0: {
            const signed: SignableV0<P> = {
                ...transaction,
                signature,
            };
            return mergeSignaturesInto(transaction, signed);
        }
        case 1: {
            const signed: SignableV1<P> = {
                ...transaction,
                signatures: { sender: signature },
            };
            return mergeSignaturesInto(transaction, signed);
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
    switch (transaction.version) {
        case 0: {
            signature = await AccountTransactionV0.createSignature(preFinalized(transaction), signer);
            break;
        }
        case 1: {
            signature = await AccountTransactionV1.createSignature(preFinalized(transaction), signer);
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
    return mergeSignaturesInto(transaction, signed);
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
    let signature = await AccountTransactionV1.createSignature(preFinalized(transaction), signer);
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
 * Verify an account signature on a transaction.
 *
 * @param transaction the transaction to verify the signature for.
 * @param signature the signature on the transaction, from a specific account.
 * @param accountInfo the address and credentials of the account.
 *
 * @returns whether the signature is valid.
 */
export async function verifySignature(
    transaction: Signable,
    signature: AccountTransactionSignature,
    accountInfo: Pick<AccountInfo, 'accountThreshold' | 'accountCredentials' | 'accountAddress'>
): Promise<boolean> {
    switch (transaction.version) {
        case 0:
            return AccountTransactionV0.verifySignature(preFinalized(transaction), signature, accountInfo);
        case 1:
            return AccountTransactionV1.verifySignature(preFinalized(transaction), signature, accountInfo);
    }
}

/**
 * Merges signatures from _signable_ transaction `other` into _signable_ transaction `target`.
 * Used for multi-signature scenarios where multiple parties sign the same transaction.
 *
 * @template P - the payload type
 * @template T - the signed transaction type
 *
 * @param target - the signed transaction to merge signatures into
 * @param other - the signed transaction from which the signatures are merged into `target`
 *
 * @returns `target` with the signatures from `other` added into it.
 * @throws Error if duplicate signatures are found for the same credential and key index
 * @throws Error if the number of signatures exceeds the allowed number specified in the transaction header
 */
export function mergeSignaturesInto<P extends Payload.Type, T extends Signable<P> = Signable<P>>(
    target: T,
    other: T
): T {
    if (target.version !== other.version) throw new Error('"a" is incompatible with "b"');

    switch (target.version) {
        case 0: {
            const signature: AccountTransactionSignature = mergeSignature(
                target.signature,
                (other as SignableV0).signature
            );
            validateSignatureAmount(signature, target.header.numSignatures);
            target.signature = signature;
            return target;
        }
        case 1: {
            const bv1 = other as SignableV1;
            const sender = mergeSignature(target.signatures.sender, bv1.signatures.sender);
            const sponsor = mergeSignature(target.signatures.sponsor, bv1.signatures.sponsor);

            validateSignatureAmount(sender, target.header.numSignatures);
            validateSignatureAmount(sponsor ?? {}, target.header.sponsor?.numSignatures ?? 0n);

            target.signatures = { sender, sponsor };
            return target;
        }
    }
}

export function signableToJSON(transaction: Signable): SignableJSON {
    const json = {
        header: headerToJSON(transaction.header),
        payload: Payload.toJSON(transaction.payload),
    };

    if (transaction.version === 0) {
        return { version: 0, signature: transaction.signature, ...json };
    }
    return { version: 1, signatures: transaction.signatures, ...json };
}

function signableHeaderFromJSON(json: unknown): Signable['header'] {
    const { sender, nonce, expiry, numSignatures, ...header } = headerFromJSON(json);

    assert(isDefined(sender));
    assert(isDefined(nonce));
    assert(isDefined(expiry));
    assert(isDefined(numSignatures));

    return { ...header, sender, nonce, expiry, numSignatures };
}

export function signableFromJSON(json: unknown): Signable {
    assertIn<SignableJSON>(json, 'header', 'payload', 'version');

    assertInteger(json.version);

    const header = signableHeaderFromJSON(json.header);
    const payload = Payload.fromJSON(json.payload);

    if (Number(json.version) === 0) {
        assertIn<V0JSON>(json, 'signature');
        assertObject(json.signature);
        return { version: 0, header, payload, signature: json.signature as AccountTransactionV0.Signature };
    }
    if (Number(json.version) === 1) {
        assertIn<V1JSON>(json, 'signatures');
        assertObject(json.signatures);
        return { version: 1, header, payload, signatures: json.signatures as AccountTransactionV1.Signatures };
    }

    throw new Error('Failed to parse "Signable" from value');
}
