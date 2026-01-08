import { HexString } from '../../types.js';
import { BlockHash } from '../../types/index.js';

/**
 * Labels for different types of context information that can be provided
 * in verifiable presentation requests and proofs.
 */
export type CredentialContextLabel =
    | 'ContextString'
    | 'ResourceID'
    | 'BlockHash'
    | 'PaymentHash'
    | 'ConnectionID'
    | 'Nonce';

/**
 * Generic type for context information with a specific label and context data.
 *
 * @template L - The label type for this context
 * @template C - The context data type
 */
type GivenContextGen<L extends string, C> = {
    /** The label identifying the type of context */
    label: L;
    /** The actual context data */
    context: C; // TODO: make explicit variants with unknown represented as hex string.
};

/** Context information containing a string value for general purposes */
type GivenContextContextString = GivenContextGen<'ContextString', string>;

/** Context information containing a resource identifier */
type GivenContextResourceID = GivenContextGen<'ResourceID', string>;

/** Context information containing a Concordium block hash */
type GivenContextBlockHash = GivenContextGen<'BlockHash', BlockHash.Type>;

/** Context information containing a payment-related hash */
type GivenContextPaymentHash = GivenContextGen<'PaymentHash', Uint8Array>; // TODO: what's this hash?

/** Context information containing a connection identifier */
type GivenContextConnectionID = GivenContextGen<'ConnectionID', string>;

/** Context information containing a cryptographic nonce */
type GivenContextNonce = GivenContextGen<'Nonce', Uint8Array>; // TODO: we should probably enforce some specific length here, e.g. sha256.

/**
 * Union type representing all possible context information that can be provided
 * in verifiable presentation interactions. Each variant contains specific data
 * relevant to the verification process.
 */
export type GivenContext =
    | GivenContextContextString
    | GivenContextResourceID
    | GivenContextBlockHash
    | GivenContextPaymentHash
    | GivenContextConnectionID
    | GivenContextNonce;

/**
 * Zero-knowledge proof data structure for Concordium verifiable presentations.
 * Contains the cryptographic proof that validates the statements made in a
 * verifiable credential without revealing the underlying private information.
 */
export type ZKProofV4 = {
    /** The type identifier for this proof format */
    type: 'ConcordiumZKProofV4';
    /** ISO formatted datetime when the proof was created */
    created: string;
    /** Serialized cryptographic proof data as hex string */
    proofValue: HexString;
};
