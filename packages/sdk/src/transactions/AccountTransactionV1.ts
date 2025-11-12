import {
    type AccountTransactionHeader,
    type AccountTransactionPayload,
    type AccountTransactionSignature,
    type AccountTransactionType,
} from '../types.js';
import { type AccountAddress, type Energy } from '../types/index.js';

// Data that is currently missing on `AccountTransactionHeader`.
type MissingHeaderData = {
    payloadSize: number;
    energyAmount: Energy.Type;
};

/**
 * Describes the V1 account transaction header, which is an extension of {@linkcode AccountTransactionHeader}
 * defining extra optional fields.
 */
export type Header = AccountTransactionHeader &
    MissingHeaderData & {
        /**
         * An optional sponsor account for the transaction, which will pay for the transaction fee
         * associated with the transaction execution.
         */
        sponsor?: AccountAddress.Type;
    };

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
