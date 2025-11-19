import { deserializeAccountTransactionSignature } from '../deserialization.js';
import { Cursor } from '../deserializationHelpers.js';
import { constantA, constantB } from '../energyCost.js';
import { sha256 } from '../hash.js';
import { Base58String } from '../index.js';
import * as JSONBig from '../json-bigint.js';
import { serializeAccountTransactionSignature } from '../serialization.js';
import { encodeWord8, encodeWord32, encodeWord64 } from '../serializationHelpers.js';
import { AccountSigner } from '../signHelpers.js';
import { AccountTransactionSignature, BlockItemKind } from '../types.js';
import { AccountAddress, Energy, SequenceNumber, TransactionExpiry } from '../types/index.js';
import { Payload } from './index.js';

/**
 * Header metadata for a version 0 account transaction.
 */
export type Header = {
    /** account address that is source of this transaction */
    readonly sender: AccountAddress.Type;
    /**
     * the nonce for the transaction, usually acquired by
     * getting the next account nonce from the node
     */
    readonly nonce: SequenceNumber.Type;
    /** expiration of the transaction */
    readonly expiry: TransactionExpiry.Type;
    /**
     * The energy limit for the transaction, including energy spent on signature verification, parsing
     * the header, and transaction execution.
     */
    readonly energyAmount: Energy.Type;
    /** payload size */
    readonly payloadSize: number;
};

type HeaderJSON = {
    readonly sender: Base58String;
    readonly nonce: bigint;
    readonly expiry: number;
    readonly energyAmount: bigint;
    readonly payloadSize: number;
};

function headerToJSON(header: Header): HeaderJSON {
    return {
        sender: header.sender.toJSON(),
        nonce: header.nonce.toJSON(),
        expiry: header.expiry.toJSON(),
        energyAmount: header.energyAmount.value,
        payloadSize: header.payloadSize,
    };
}

function headerFromJSON(json: HeaderJSON): Header {
    return {
        sender: AccountAddress.fromBase58(json.sender),
        nonce: SequenceNumber.fromJSON(json.nonce),
        expiry: TransactionExpiry.fromJSON(json.expiry),
        energyAmount: Energy.create(json.energyAmount),
        payloadSize: json.payloadSize,
    };
}

/**
 * Signature type for account transactions.
 */
export type Signature = AccountTransactionSignature;

/**
 * A complete version 0 account transaction with header, type, payload, and signature.
 */
type AccountTransactionV0 = {
    /**
     * Transaction version discriminant;
     */
    readonly version: 0;
    /**
     * The transaction header containing metadata for the transaction
     */
    readonly header: Header;
    /**
     * The transaction payload.
     */
    readonly payload: Payload.Type;
    /**
     * The signature by the transaction sender on the transaction
     */
    readonly signature: Signature;
};

/**
 * A complete version 0 account transaction with header, type, payload, and signature.
 */
export type Type = AccountTransactionV0;

export type JSON = {
    readonly version: 0;
    readonly header: HeaderJSON;
    readonly payload: Payload.JSON;
    readonly signature: Signature;
};

export type UnsignedJSON = {
    readonly version: 0;
    readonly header: HeaderJSON;
    readonly payload: Payload.JSON;
};

/**
 * Converts a _signed_ version 0 account transaction to its intermediary JSON serializable representation.
 *
 * @param transaction the transaction to convert
 * @returns the JSON representation of the transaction
 */
export function toJSON(transaction: AccountTransactionV0): JSON {
    return {
        version: 0 as const,
        header: headerToJSON(transaction.header),
        payload: Payload.toJSON(transaction.payload),
        signature: transaction.signature,
    };
}

/**
 * Converts an _unsigned_ version 0 account transaction to its intermediary JSON serializable representation.
 *
 * @param transaction the transaction to convert
 * @returns the JSON representation of the transaction
 */
export function unsignedToJSON(transaction: Unsigned): UnsignedJSON {
    return {
        version: 0 as const,
        header: headerToJSON(transaction.header),
        payload: Payload.toJSON(transaction.payload),
    };
}

/**
 * Converts a intermediary JSON serializable representation created with {@linkcode toJSON} back to a
 * _signed_ version 0 account transaction.
 *
 * @param json the JSON to convert
 * @returns the transaction
 */
export function fromJSON(json: JSON): AccountTransactionV0 {
    return {
        version: 0 as const,
        header: headerFromJSON(json.header),
        payload: Payload.fromJSON(json.payload),
        signature: json.signature,
    };
}

/**
 * Converts a intermediary JSON serializable representation created with {@linkcode unsignedToJSON} back to an
 * _unsigned_ version 0 account transaction.
 *
 * @param json the JSON to convert
 * @returns the unsigned transaction
 */
export function unsignedFromJSON(json: UnsignedJSON): Unsigned {
    return { version: 0 as const, header: headerFromJSON(json.header), payload: Payload.fromJSON(json.payload) };
}

/**
 * Converts a {@linkcode AccountTransactionV0} to a JSON string.
 *
 * @param transaction - the transaction to convert
 * @returns the JSON string
 */
export function toJSONString(transaction: AccountTransactionV0): string {
    return JSONBig.stringify(toJSON(transaction));
}

/**
 * Converts an {@linkcode Unsigned} to a JSON string.
 *
 * @param transaction - the transaction to convert
 * @returns the JSON string
 */
export function unsignedToJSONString(transaction: Unsigned): string {
    return JSONBig.stringify(unsignedToJSON(transaction));
}

/**
 * Converts a JSON string transaction representation to a {@linkcode AccountTransactionV0}.
 *
 * @param jsonString - the json string to convert
 * @returns the parsed transaction
 */
export function fromJSONString(jsonString: string): AccountTransactionV0 {
    return fromJSON(JSONBig.parse(jsonString));
}

/**
 * Converts a JSON string _unsigned_ transaction representation to an {@linkcode Unsigned}.
 *
 * @param jsonString - the json string to convert
 * @returns the parsed unsigned transaction
 */
export function unsignedFromJSONString(jsonString: string): Unsigned {
    return unsignedFromJSON(JSONBig.parse(jsonString));
}

/**
 * Serializes a version 0 transaction header to the encoding expected by concordium nodes.
 *
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

    const sender = AccountAddress.fromBuffer(cursor.read(32));
    const nonce = SequenceNumber.create(cursor.read(8).readBigUInt64BE(0));
    const energyAmount = Energy.create(cursor.read(8).readBigUInt64BE(0));
    const payloadSize = cursor.read(4).readUInt32BE(0);
    const expiry = TransactionExpiry.fromEpochSeconds(cursor.read(8).readBigUInt64BE(0));

    if (isRawBuffer && cursor.remainingBytes.length !== 0)
        throw new Error('Deserializing the transaction did not exhaust the buffer');

    return {
        sender,
        nonce,
        expiry,
        energyAmount,
        payloadSize,
    };
}

/**
 * Serializes a version 0 account transaction to the encoding expected by concordium nodes.
 *
 * @param transaction the transaction to serialize
 * @returns the serialized transaction as a byte array
 */
export function serialize(transaction: AccountTransactionV0): Uint8Array {
    const signature = serializeAccountTransactionSignature(transaction.signature);
    const payload = Payload.serialize(transaction.payload);
    const header = serializeHeader(transaction.header);
    return Uint8Array.from(Buffer.concat([signature, header, payload]));
}

/**
 * Deserializes a version 0 account transaction from the encoding expected by concordium nodes.
 *
 * @param value the bytes to deserialize, either as a Cursor or ArrayBuffer
 *
 * @returns the deserialized transaction
 * @throws if the buffer is not fully consumed during deserialization
 */
export function deserialize(value: Cursor | ArrayBuffer): AccountTransactionV0 {
    const isRawBuffer = !(value instanceof Cursor);
    const cursor = isRawBuffer ? Cursor.fromBuffer(value) : value;

    const signature = deserializeAccountTransactionSignature(cursor);
    const header = deserializeHeader(cursor);
    const payload = Payload.deserialize(cursor);

    if (isRawBuffer && cursor.remainingBytes.length !== 0)
        throw new Error('Deserializing the transaction did not exhaust the buffer');

    return { version: 0, signature, header, payload };
}

/**
 * Serializes a version 0 account transaction as a block item for submission to the chain.
 *
 * @param transaction the transaction to serialize
 * @returns the serialized block item as a byte array with block item kind prefix
 */
export function serializeBlockItem(transaction: AccountTransactionV0): Uint8Array {
    const blockItemKind = encodeWord8(BlockItemKind.AccountTransactionKind);
    return Uint8Array.from(Buffer.concat([blockItemKind, serialize(transaction)]));
}

// Account address (32 bytes), nonce (8 bytes), energy (8 bytes), payload size (4 bytes), expiry (8 bytes);
const ACCOUNT_TRANSACTION_HEADER_SIZE = BigInt(32 + 8 + 8 + 4 + 8);

/**
 * The energy cost is assigned according to the formula:
 * A * signatureCount + B * size + C_t, where C_t is a transaction specific cost.
 *
 * The transaction specific cost can be found at https://github.com/Concordium/concordium-base/blob/main/haskell-src/Concordium/Cost.hs.
 *
 * @param signatureCount number of signatures for the transaction
 * @param payload the transaction payload
 * @param transactionSpecificCost a transaction specific cost
 *
 * @returns the energy cost for the transaction, to be set in the transaction header
 */
export function calculateEnergyCost(
    signatureCount: bigint,
    payload: Payload.Type,
    transactionSpecificCost: Energy.Type
): Energy.Type {
    return Energy.create(
        constantA * signatureCount +
            constantB * (ACCOUNT_TRANSACTION_HEADER_SIZE + BigInt(Payload.sizeOf(payload))) +
            transactionSpecificCost.value
    );
}

/**
 * Gets the transaction hash that is used to look up the status of a transaction.
 *
 * @param transaction the transaction to hash
 * @returns the sha256 hash of the serialized block item kind, signatures, header, type and payload
 */
export function getAccountTransactionHash(transaction: AccountTransactionV0): Uint8Array {
    const serializedAccountTransaction = serialize(transaction);
    return Uint8Array.from(sha256([serializedAccountTransaction]));
}

/**
 * An unsigned version 0 account transaction (without signature).
 */
export type Unsigned = Omit<AccountTransactionV0, 'signature'>;

/**
 * Returns the digest of the transaction that has to be signed.
 *
 * @param transaction the transaction to hash
 * @returns the sha256 hash on the serialized header, type and payload
 */
export function signDigest(transaction: Unsigned): Uint8Array {
    const serializedHeader = serializeHeader(transaction.header);
    const serializedPayload = Payload.serialize(transaction.payload);
    return Uint8Array.from(sha256([serializedHeader, serializedPayload]));
}

/**
 * Signs an unsigned version 0 account transaction using the provided signer.
 * @param transaction the unsigned transaction to sign
 * @param signer the account signer to use for signing
 *
 * @returns a promise resolving to the signed transaction
 */
export async function sign(transaction: Unsigned, signer: AccountSigner): Promise<AccountTransactionV0> {
    const signature = await signer.sign(signDigest(transaction));
    return { ...transaction, signature };
}
