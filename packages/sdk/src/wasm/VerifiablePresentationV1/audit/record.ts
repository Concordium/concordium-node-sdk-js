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
import { cborDecode, cborEncode } from '../../../types/cbor.js';
import { AccountAddress, DataBlob, TransactionExpiry, TransactionHash } from '../../../types/index.js';
import { UnfilledVerifiablePresentationRequestV1, VerifiablePresentationV1 } from '../index.js';
import { VERSION } from './common.js';

const JSONBig = _JB({ alwaysParseAsBig: true, useNativeBigInt: true });

/**
 * A verification audit record that contains the complete verifiable presentation
 * request and response data. This record maintains the full audit trail of a verification
 * interaction, including all sensitive data that should be kept private.
 *
 * Audit records are used internally by verifiers to maintain complete records
 * of verification interactions, while only publishing hash-based public records on-chain
 * to preserve privacy.
 */
class VerificationAuditRecordV1 {
    /**
     * Creates a new verification audit record.
     *
     * @param request - The verifiable presentation request that was made
     * @param presentation - The verifiable presentation that was provided in response
     * @param id - Unique identifier for this audit record
     */
    constructor(
        public readonly request: UnfilledVerifiablePresentationRequestV1.Type,
        public readonly presentation: VerifiablePresentationV1.Type,
        public readonly id: string
    ) {}

    /**
     * Serializes the audit record to a JSON representation.
     *
     * @returns The JSON representation of this audit record
     */
    public toJSON(): JSON {
        return {
            request: this.request.toJSON(),
            presentation: this.presentation.toJSON(),
            id: this.id,
            version: VERSION,
            type: 'ConcordiumVerificationAuditRecord',
        };
    }
}

/**
 * A verification audit record that contains the complete verifiable presentation
 * request and response data. This record maintains the full audit trail of a verification
 * interaction, including all sensitive data that should be kept private.
 *
 * Audit records are used internally by verifiers to maintain complete records
 * of verification interactions, while only publishing hash-based public records on-chain
 * to preserve privacy.
 */
export type Type = VerificationAuditRecordV1;

/**
 * JSON representation of a verification audit record.
 * Contains the serialized forms of the request and presentation data.
 */
export type JSON = Pick<Type, 'id'> & {
    /** The type identifier for the audit record */
    type: 'ConcordiumVerificationAuditRecord';
    /** The audit record version */
    version: 1;
    /** The serialized verifiable presentation request */
    request: UnfilledVerifiablePresentationRequestV1.JSON;
    /** The serialized verifiable presentation */
    presentation: VerifiablePresentationV1.JSON;
};

/**
 * Creates a new verification audit record.
 *
 * @param id - Unique identifier for the audit record
 * @param request - The verifiable presentation request
 * @param presentation - The corresponding verifiable presentation
 *
 * @returns A new verification audit record instance
 */
export function create(
    id: string,
    request: UnfilledVerifiablePresentationRequestV1.Type,
    presentation: VerifiablePresentationV1.Type
): VerificationAuditRecordV1 {
    return new VerificationAuditRecordV1(request, presentation, id);
}

/**
 * Deserializes a verification audit record from its JSON representation.
 *
 * @param json - The JSON representation to deserialize
 * @returns The deserialized verification audit record
 */
export function fromJSON(json: JSON): VerificationAuditRecordV1 {
    return new VerificationAuditRecordV1(
        UnfilledVerifiablePresentationRequestV1.fromJSON(json.request),
        VerifiablePresentationV1.fromJSON(json.presentation),
        json.id
    );
}

/**
 * Describes the verification audit anchor data registered on chain.
 */
export type AnchorData = {
    /** Type identifier for _Concordium Verification Audit Anchor_ */
    type: 'CCDVAA';
    /** Version of the anchor data format */
    version: number;
    /** The SHA-256 hash of the audit record, encoded as a hex string */
    hash: Uint8Array;
    /** Optional public information that can be included in the anchor */
    public?: Record<string, any>;
};

/**
 * Converts a verification audit record to its corresopnding anchor representation encoding.
 *
 * This function creates a privacy-preserving public record that contains only
 * a hash of the record data, suitable for publishing on-chain while
 * maintaining the privacy of the original verification interaction.
 *
 * @param record - The audit record to convert
 * @param info - Optional additional public information to include
 *
 * @returns The anchor encoding corresponding to the audit record
 */
export function createAnchor(record: VerificationAuditRecordV1, info?: Record<string, any>): Uint8Array {
    const message = Buffer.from(JSONBig.stringify(record)); // TODO: replace this with proper hashing.. properly from @concordium/rust-bindings
    const hash = Uint8Array.from(sha256([message]));
    let anchor: AnchorData = { hash: hash, version: VERSION, type: 'CCDVAA', public: info };
    return cborEncode(anchor);
}

/**
 * Decodes a CBOR-encoded verification audit anchor.
 *
 * This function parses and validates a CBOR-encoded anchor that was previously
 * created with `createAnchor`. It ensures the anchor has the correct format
 * and contains all required fields.
 *
 * @param cbor - The CBOR-encoded anchor data to decode
 * @returns The decoded anchor data structure
 * @throws Error if the CBOR data is invalid or doesn't match expected format
 */
export function decodeAnchor(cbor: Uint8Array): AnchorData {
    const value = cborDecode(cbor);
    if (typeof value !== 'object' || value === null) throw new Error('Expected a cbor encoded object');
    // required fields
    if (!('type' in value) || value.type !== 'CCDVAA') throw new Error('Expected "type" to be "CCDVAA"');
    if (!('version' in value) || value.version !== VERSION) throw new Error('Expected "version" to be 1');
    if (!('hash' in value) || !(value.hash instanceof Uint8Array))
        throw new Error('Expected "hash" to be a Uint8Array');
    // optional fields
    if ('public' in value && typeof value.public !== 'object') throw new Error('Expected "public" to be an object');
    return value as AnchorData;
}

/**
 * Registers a public verification audit record on the Concordium blockchain.
 *
 * This function converts a audit record to a public one and registers
 * it as transaction data on the blockchain. This provides a verifiable timestamp
 * and immutable record of the verification event while preserving privacy.
 *
 * @param record - The audit record to register publicly
 * @param grpc - The Concordium GRPC client for blockchain interaction
 * @param sender - The account address that will send the transaction
 * @param signer - The signer for the transaction
 * @param info - Optional additional public information to include
 *
 * @returns Promise resolving to the transaction hash
 * @throws Error if the transaction fails or network issues occur
 */
export async function registerAnchor(
    record: VerificationAuditRecordV1,
    grpc: ConcordiumGRPCClient,
    sender: AccountAddress.Type,
    signer: AccountSigner,
    info?: Record<string, any>
): Promise<TransactionHash.Type> {
    const nextNonce: NextAccountNonce = await grpc.getNextAccountNonce(sender);
    const header: AccountTransactionHeader = {
        expiry: TransactionExpiry.futureMinutes(60),
        nonce: nextNonce.nonce,
        sender,
    };

    const payload: RegisterDataPayload = { data: new DataBlob(createAnchor(record, info)) };
    const accountTransaction: AccountTransaction = {
        header: header,
        payload,
        type: AccountTransactionType.RegisterData,
    };
    const signature = await signTransaction(accountTransaction, signer);
    return grpc.sendAccountTransaction(accountTransaction, signature);
}
