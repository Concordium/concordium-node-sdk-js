import { Buffer } from 'buffer/index.js';

import { deserializeAccountTransactionSignature } from '../deserialization.js';
import { Cursor } from '../deserializationHelpers.js';
import { constantA, constantB } from '../energyCost.js';
import { sha256 } from '../hash.js';
import { serializeAccountTransactionSignature } from '../serialization.js';
import { SerializationSpec, encodeWord8, encodeWord16, getBitmap, serializeFromSpec } from '../serializationHelpers.js';
import { AccountSigner, verifyAccountSignature } from '../signHelpers.js';
import { type AccountInfo, type AccountTransactionSignature, BlockItemKind } from '../types.js';
import { AccountAddress, Energy } from '../types/index.js';
import { orUndefined } from '../util.js';
import { AccountTransactionV0, Payload } from './index.js';

type HeaderOptionals = {
    /**
     * An optional sponsor account for the transaction, which will pay for the transaction fee
     * associated with the transaction execution.
     */
    sponsor?: AccountAddress.Type;
};

/**
 * Describes the V1 account transaction header, which is an extension of {@linkcode AccountTransactionV0}s header
 * defining extra optional fields.
 */
export type Header = AccountTransactionV0.Header & HeaderOptionals;

/**
 * The signatures for {@linkcode AccountTransactionV1}.
 */
export type Signatures = {
    /**
     * The signatures on the transaction for the sender credential(s)
     */
    sender: AccountTransactionSignature;
    /**
     * The (optional) signatures on the transaction for the sponsor credential(s). These
     * _must_ be specified if the `sponsor` field on {@linkcode Header} is set.
     */
    sponsor?: AccountTransactionSignature;
};

/**
 * Describes the V1 account transaction format, which compared to the original account transaction format
 * is an extensible format defining extra optional transaction header fields.
 *
 * NOTE: this transaction format is supported from protocol version 10.
 */
type AccountTransactionV1 = {
    /**
     * Transaction version discriminant;
     */
    readonly version: 1;
    /**
     * The signatures for V1 account transactions
     */
    readonly signatures: Signatures;
    /**
     * The transaction header for the transaction which includes metadata required for execution
     * of any account transaction of the v1 format.
     */
    readonly header: Header;
    /**
     * The transaction payload.
     */
    readonly payload: Payload.Type;
};

/**
 * Describes the V1 account transaction format, which compared to the original account transaction format
 * is an extensible format defining extra optional transaction header fields.
 */
export type Type = AccountTransactionV1;

const headerSerializationSpec: SerializationSpec<HeaderOptionals> = { sponsor: orUndefined(AccountAddress.toBuffer) };

/**
 * Serializes the V1 account transaction header, including any optional fields.
 *
 * @param header - The V1 account transaction header to serialize, including base v0 fields and optional extensions (e.g., sponsor).
 * @returns The serialized header as a Uint8Array, consisting of the bitmap, v0 header, and optional field extensions.
 */
export function serializeHeader({ sponsor, ...v0 }: Header): Uint8Array {
    const options: HeaderOptionals = { sponsor };

    const bitmap = encodeWord16(getBitmap(options, ['sponsor']));
    const v0Header = AccountTransactionV0.serializeHeader(v0);
    const extension = Uint8Array.from(serializeFromSpec(headerSerializationSpec)(options));

    return Uint8Array.from(Buffer.concat([bitmap, v0Header, extension]));
}

/**
 * Serializes the signatures for a V1 account transaction, including sender and optional sponsor signatures.
 *
 * @param signatures - The sender and optional sponsor signatures to serialize.
 * @returns The serialized signatures as a Uint8Array.
 */
export function serializeSignatures(signatures: Signatures): Uint8Array {
    const sender = serializeAccountTransactionSignature(signatures.sender);
    const sponsor =
        signatures.sponsor !== undefined ? serializeAccountTransactionSignature(signatures.sponsor) : encodeWord8(0);
    return Uint8Array.from(Buffer.concat([sender, sponsor]));
}

/**
 * Serializes a complete V1 account transaction, including both header and payload.
 *
 * @param transaction - The V1 account transaction to serialize.
 * @returns The fully serialized transaction as a Uint8Array.
 */
export function serialize(transaction: AccountTransactionV1): Uint8Array {
    const signatures = serializeSignatures(transaction.signatures);
    const header = serializeHeader(transaction.header);
    const payload = Payload.serialize(transaction.payload);
    return Uint8Array.from(Buffer.concat([signatures, header, payload]));
}

const SPONSOR_MASK = 0x0001;
const VALIDATION_MASK = 0xffff - SPONSOR_MASK;

function deserializeBitmap(cursor: Cursor): number {
    const bitmap = cursor.read(2).readUInt16BE(0);
    if ((bitmap & VALIDATION_MASK) !== 0) throw new Error('Found unsupported bits in bitmap');
    return bitmap;
}

function deserializeHeaderOptions(cursor: Cursor, bitmap: number): HeaderOptionals {
    const optionals: HeaderOptionals = {};

    const hasSponsor = (bitmap & SPONSOR_MASK) !== 0;
    if (hasSponsor) optionals.sponsor = AccountAddress.fromBuffer(cursor.read(32));

    return optionals;
}

/**
 * Deserializes a V1 account transaction header from a buffer or cursor.
 *
 * @param value - The buffer or cursor containing the serialized header data.
 * @returns The deserialized V1 transaction header, including base fields and optional extensions.
 * @throws {Error} If the invoked with a buffer which is not fully consumed during deserialization.
 */
export function deserializeHeader(value: Cursor | ArrayBuffer): Header {
    const isRawBuffer = !(value instanceof Cursor);
    const cursor = isRawBuffer ? Cursor.fromBuffer(value) : value;

    const bitmap = deserializeBitmap(cursor);
    const v0Header = AccountTransactionV0.deserializeHeader(cursor);
    const options = deserializeHeaderOptions(cursor, bitmap);

    if (isRawBuffer && cursor.remainingBytes.length !== 0)
        throw new Error('Deserializing the transaction header did not exhaust the buffer');

    return { ...v0Header, ...options };
}

/**
 * Deserializes the signatures for a V1 account transaction from a buffer or cursor.
 *
 * @param value - The buffer or cursor containing the serialized signatures data.
 * @returns The deserialized sender and optional sponsor signatures.
 * @throws {Error} If the invoked with a buffer which is not fully consumed during deserialization.
 */
export function deserializeSignatures(value: Cursor | ArrayBuffer): Signatures {
    const isRawBuffer = !(value instanceof Cursor);
    const cursor = isRawBuffer ? Cursor.fromBuffer(value) : value;

    const sender = deserializeAccountTransactionSignature(cursor);
    const hasSponsor = Boolean(cursor.peek(1).readUInt8(0));

    let sponsor: AccountTransactionSignature | undefined;
    if (hasSponsor) {
        sponsor = deserializeAccountTransactionSignature(cursor);
    } else {
        cursor.skip(1);
    }

    if (isRawBuffer && cursor.remainingBytes.length !== 0)
        throw new Error('Deserializing the transaction signature did not exhaust the buffer');

    return { sender, sponsor };
}

/**
 * Deserializes a complete V1 account transaction from a buffer or cursor.
 *
 * @param value - The buffer or cursor containing the serialized transaction data.
 * @returns An object containing the deserialized signatures and transaction.
 * @throws {Error} If the invoked with a buffer which is not fully consumed during deserialization.
 */
export function deserialize(value: Cursor | ArrayBuffer): AccountTransactionV1 {
    const isRawBuffer = !(value instanceof Cursor);
    const cursor = isRawBuffer ? Cursor.fromBuffer(value) : value;

    const signatures = deserializeSignatures(cursor);
    const header = deserializeHeader(cursor);
    const payload = Payload.deserialize(cursor);

    if (isRawBuffer && cursor.remainingBytes.length !== 0)
        throw new Error('Deserializing the transaction did not exhaust the buffer');

    return { version: 1, signatures, header, payload };
}

/**
 * Serializes a version 1 account transaction as a block item for submission to the chain.
 *
 * @param transaction the transaction to serialize
 * @returns the serialized block item as a byte array with block item kind prefix
 */
export function serializeBlockItem(transaction: AccountTransactionV1): Uint8Array {
    const blockItemKind = encodeWord8(BlockItemKind.AccountTransactionV1Kind);
    return Uint8Array.from(Buffer.concat([blockItemKind, serialize(transaction)]));
}

type Configuration = { [p in keyof HeaderOptionals]: boolean };

function headerSize({ sponsor = false }: Configuration): bigint {
    // (AccountAddress | 0)
    const optionsSize = sponsor ? 32n : 0n;
    // bitmap + v0 header + options
    return 2n + AccountTransactionV0.HEADER_SIZE + optionsSize;
}

/**
 * The energy cost is assigned according to the formula:
 * A * signatureCount + B * size + C_t, where C_t is a transaction specific cost.
 *
 * The transaction specific cost can be found at https://github.com/Concordium/concordium-base/blob/main/haskell-src/Concordium/Cost.hs.
 *
 * @param signatureCount number of signatures for the transaction, including sponsor signatures
 * @param payload the transaction payload
 * @param transactionSpecificCost a transaction specific cost
 *
 * @returns the energy cost for the transaction, to be set in the transaction header
 */
export function calculateEnergyCost(
    signatureCount: bigint,
    payload: Payload.Type,
    transactionSpecificCost: Energy.Type,
    configuration: Configuration
): Energy.Type {
    return Energy.create(
        constantA * signatureCount +
            constantB * (headerSize(configuration) + BigInt(Payload.sizeOf(payload))) +
            transactionSpecificCost.value
    );
}

const PREFIX = Buffer.from('00'.repeat(31) + '01', 'hex');

/**
 * Gets the transaction hash that is used to look up the status of a transaction.
 *
 * @param transaction the transaction to hash
 * @returns the sha256 hash of the serialized block item kind, signatures, header and payload
 */
export function getAccountTransactionHash(transaction: AccountTransactionV1): Uint8Array {
    const serializedAccountTransaction = serialize(transaction);
    return Uint8Array.from(sha256([serializedAccountTransaction]));
}

/**
 * An unsigned version 1 account transaction (without signatures).
 */
export type Unsigned = Omit<AccountTransactionV1, 'signatures'>;

/**
 * Creates a v1 transaction from an unsigned transaction and the associated signature on the transaction.
 *
 * @param transaction the unsigned transaction
 * @param signature the signature on the transaction
 *
 * @returns a complete v1 transaction.
 */
export function create(unsigned: Unsigned, signatures: Signatures): AccountTransactionV1 {
    return { ...unsigned, signatures };
}

/**
 * Returns the digest of the transaction that has to be signed.
 *
 * @param transaction the transaction to hash
 * @returns the sha256 hash on the serialized header and payload
 */
export function signDigest(transaction: Unsigned): Uint8Array {
    const serializedHeader = serializeHeader(transaction.header);
    const serializedPayload = Payload.serialize(transaction.payload);
    return Uint8Array.from(sha256([PREFIX, serializedHeader, serializedPayload]));
}

/**
 * Creates a signature on an unsigned version 1 account transaction using the provided signer.
 *
 * @param transaction the unsigned transaction to sign
 * @param signer the account signer to use for signing
 *
 * @returns a promise resolving to the signature
 */
export async function createSignature(
    transaction: Unsigned,
    signer: AccountSigner
): Promise<AccountTransactionSignature> {
    return await signer.sign(signDigest(transaction));
}

/**
 * Signs an unsigned version 1 account transaction using the provided signer.
 *
 * @param transaction the unsigned transaction to sign
 * @param signer the account signer to use for signing
 *
 * @returns a promise resolving to the signed transaction
 */
export async function sign(
    transaction: Unsigned | AccountTransactionV1,
    signer: AccountSigner
): Promise<AccountTransactionV1> {
    return {
        ...transaction,
        signatures: { sender: await createSignature(transaction, signer) },
    };
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
    transaction: Unsigned,
    signature: AccountTransactionSignature,
    accountInfo: Pick<AccountInfo, 'accountThreshold' | 'accountCredentials' | 'accountAddress'>
): Promise<boolean> {
    const digest = signDigest(transaction);
    return verifyAccountSignature(digest, signature, accountInfo);
}
