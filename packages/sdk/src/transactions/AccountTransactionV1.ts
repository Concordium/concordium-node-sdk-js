import { Buffer } from 'buffer/index.js';

import { serializeAccountTransactionHeader, serializeAccountTransactionPayload } from '../serialization.js';
import { SerializationSpec, encodeWord16, getBitmap, orUndefined, serializeFromSpec } from '../serializationHelpers.js';
import {
    type AccountTransactionHeader,
    type AccountTransactionPayload,
    type AccountTransactionSignature,
    type AccountTransactionType,
} from '../types.js';
import { AccountAddress, type Energy } from '../types/index.js';

// Data that is currently missing on `AccountTransactionHeader`.
type MissingHeaderData = {
    payloadSize: number;
    energyAmount: Energy.Type;
};

type HeaderOptionals = {
    /**
     * An optional sponsor account for the transaction, which will pay for the transaction fee
     * associated with the transaction execution.
     */
    sponsor?: AccountAddress.Type;
};

/**
 * Describes the V1 account transaction header, which is an extension of {@linkcode AccountTransactionHeader}
 * defining extra optional fields.
 */
export type Header = AccountTransactionHeader & MissingHeaderData & HeaderOptionals;

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
 */
type AccountTransactionV1 = {
    /**
     * The transaction header for the transaction which includes metadata required for execution
     * of any account transaction of the v1 format.
     */
    header: Header;
    /**
     * The transaction type of the account transaction.
     */
    type: AccountTransactionType;
    /**
     * The payload corresponding to the transaction `type`.
     */
    payload: AccountTransactionPayload;
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
    const v0Header = serializeAccountTransactionHeader(v0, v0.payloadSize, v0.energyAmount);
    const extension = serializeFromSpec(headerSerializationSpec)(options);

    return Buffer.concat([bitmap, v0Header, extension]);
}

/**
 * Serializes the payload of a V1 account transaction.
 */
export const serializePayload = serializeAccountTransactionPayload;

/**
 * Serializes a complete V1 account transaction, including both header and payload.
 *
 * @param transaction - The V1 account transaction to serialize.
 * @returns The fully serialized transaction as a Uint8Array.
 */
export function serialize(transaction: AccountTransactionV1): Uint8Array {
    const header = serializeHeader(transaction.header);
    const payload = serializePayload(transaction);
    return Buffer.concat([header, payload]);
}
