import { Buffer } from 'buffer/index.js';
import _JB from 'json-bigint';

import { ConcordiumGRPCClient } from '../../../grpc/index.js';
import { sha256 } from '../../../hash.js';
import { AccountSigner, signTransaction } from '../../../signHelpers.js';
import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionType,
    NextAccountNonce,
    RegisterDataPayload,
} from '../../../types.js';
import { AccountAddress, DataBlob, TransactionExpiry, TransactionHash } from '../../../types/index.js';
import { VerifiablePresentationRequestV1, VerifiablePresentationV1, VerificationAuditRecord } from '../index.js';

const JSONBig = _JB({ alwaysParseAsBig: true, useNativeBigInt: true });

/**
 * A private verification audit record that contains the complete verifiable presentation
 * request and response data. This record maintains the full audit trail of a verification
 * interaction, including all sensitive data that should be kept private.
 *
 * Private audit records are used internally by verifiers to maintain complete records
 * of verification interactions, while only publishing hash-based public records on-chain
 * to preserve privacy.
 */
class PrivateVerificationAuditRecord {
    /** The type identifier for this audit record */
    public readonly type = 'ConcordiumVerificationAuditRecord';
    /** The version of the audit record format */
    public readonly version = 1;

    /**
     * Creates a new private verification audit record.
     *
     * @param id - Unique identifier for this audit record
     * @param request - The verifiable presentation request that was made
     * @param presentation - The verifiable presentation that was provided in response
     */
    constructor(
        public readonly id: string,
        public request: VerifiablePresentationRequestV1.Type,
        public presentation: VerifiablePresentationV1.Type
    ) {}

    /**
     * Serializes the private audit record to a JSON representation.
     *
     * @returns The JSON representation of this audit record
     */
    public toJSON(): JSON {
        return { ...this, request: this.request.toJSON(), presentation: this.presentation.toJSON() };
    }
}

/**
 * A private verification audit record that contains the complete verifiable presentation
 * request and response data. This record maintains the full audit trail of a verification
 * interaction, including all sensitive data that should be kept private.
 *
 * Private audit records are used internally by verifiers to maintain complete records
 * of verification interactions, while only publishing hash-based public records on-chain
 * to preserve privacy.
 */
export type Type = PrivateVerificationAuditRecord;

/**
 * JSON representation of a private verification audit record.
 * Contains the serialized forms of the request and presentation data.
 */
export type JSON = Pick<Type, 'id' | 'type' | 'version'> & {
    /** The serialized verifiable presentation request */
    request: VerifiablePresentationRequestV1.JSON;
    /** The serialized verifiable presentation */
    presentation: VerifiablePresentationV1.JSON;
};

/**
 * Creates a new private verification audit record.
 *
 * @param id - Unique identifier for the audit record
 * @param request - The verifiable presentation request
 * @param presentation - The verifiable presentation response
 *
 * @returns A new private verification audit record instance
 */
export function create(
    id: string,
    request: VerifiablePresentationRequestV1.Type,
    presentation: VerifiablePresentationV1.Type
): PrivateVerificationAuditRecord {
    return new PrivateVerificationAuditRecord(id, request, presentation);
}

/**
 * Deserializes a private verification audit record from its JSON representation.
 *
 * @param json - The JSON representation to deserialize
 * @returns The deserialized private verification audit record
 */
export function fromJSON(json: JSON): PrivateVerificationAuditRecord {
    return new PrivateVerificationAuditRecord(
        json.id,
        VerifiablePresentationRequestV1.fromJSON(json.request),
        VerifiablePresentationV1.fromJSON(json.presentation)
    );
}

/**
 * Converts a private verification audit record to a public audit record.
 *
 * This function creates a privacy-preserving public record that contains only
 * a hash of the private record data, suitable for publishing on-chain while
 * maintaining the privacy of the original verification interaction.
 *
 * @param record - The private audit record to convert
 * @param info - Optional additional public information to include
 *
 * @returns A public verification audit record containing only the hash
 */
export function toPublic(record: PrivateVerificationAuditRecord, info?: string): VerificationAuditRecord.Type {
    const message = Buffer.from(JSONBig.stringify(record)); // TODO: replace this with proper hashing.. properly from @concordium/rust-bindings
    const hash = Uint8Array.from(sha256([message]));
    return VerificationAuditRecord.create(hash, info);
}

/**
 * Registers a public verification audit record on the Concordium blockchain.
 *
 * This function converts a private audit record to a public one and registers
 * it as transaction data on the blockchain. This provides a verifiable timestamp
 * and immutable record of the verification event while preserving privacy.
 *
 * @param privateRecord - The private audit record to register publicly
 * @param grpc - The Concordium GRPC client for blockchain interaction
 * @param sender - The account address that will send the transaction
 * @param signer - The signer for the transaction
 * @param info - Optional additional public information to include
 *
 * @returns Promise resolving to the public record and transaction hash
 * @throws Error if the transaction fails or network issues occur
 */
export async function registerPublicRecord(
    privateRecord: PrivateVerificationAuditRecord,
    grpc: ConcordiumGRPCClient,
    sender: AccountAddress.Type,
    signer: AccountSigner,
    info?: string
): Promise<{ publicRecord: VerificationAuditRecord.Type; transactionHash: TransactionHash.Type }> {
    const nextNonce: NextAccountNonce = await grpc.getNextAccountNonce(sender);
    const header: AccountTransactionHeader = {
        expiry: TransactionExpiry.futureMinutes(60),
        nonce: nextNonce.nonce,
        sender,
    };

    const publicRecord = toPublic(privateRecord, info);
    const payload: RegisterDataPayload = { data: new DataBlob(VerificationAuditRecord.createAnchor(publicRecord)) };
    const accountTransaction: AccountTransaction = {
        header: header,
        payload,
        type: AccountTransactionType.RegisterData,
    };
    const signature = await signTransaction(accountTransaction, signer);
    const transactionHash = await grpc.sendAccountTransaction(accountTransaction, signature);

    return { publicRecord, transactionHash };
}
