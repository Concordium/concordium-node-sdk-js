import { AttributeKey, HexString } from '../../types.js';
import { AtomicStatementV2, DIDString } from '../../web3-id/index.js';
import { ZKProofV4 } from './types.js';

/**
 * A verifiable credential based on identity information from an identity provider.
 * This credential type contains zero-knowledge proofs about identity attributes
 * without revealing the actual identity information.
 */
type IdentityCredential = {
    /** Type identifiers for this credential format */
    type: ['VerifiableCredential', 'ConcordiumVerifiableCredentialV1', 'ConcordiumIDBasedCredential'];
    /** The credential subject containing identity-based statements */
    credentialSubject: {
        /** The identity disclosure information also acts as ephemeral ID */
        id: HexString;
        /** Statements about identity attributes (should match request) */
        statement: AtomicStatementV2<AttributeKey>[];
    };
    /** ISO formatted datetime specifying when the credential is valid from */
    validFrom: string;
    /** ISO formatted datetime specifying when the credential expires */
    validTo: string;
    /** The zero-knowledge proof for attestation */
    proof: ZKProofV4;
    /** Issuer of the original ID credential */
    issuer: DIDString;
};

/**
 * A verifiable credential based on identity information from an identity provider.
 * This credential type contains zero-knowledge proofs about identity attributes
 * without revealing the actual identity information.
 */
export type Identity = IdentityCredential;

/**
 * A verifiable credential based on an account credential on the Concordium blockchain.
 * This credential type contains zero-knowledge proofs about account credentials
 * and their associated identity attributes.
 */
type AccountCredential = {
    /** Type identifiers for this credential format */
    type: ['VerifiableCredential', 'ConcordiumVerifiableCredentialV1', 'ConcordiumAccountBasedCredential'];
    /** The credential subject containing account-based statements */
    credentialSubject: {
        /** The account credential identifier as a DID */
        id: DIDString;
        /** Statements about account attributes (should match request) */
        statement: AtomicStatementV2<AttributeKey>[];
    };
    /** The zero-knowledge proof for attestation */
    proof: ZKProofV4;
    /** The issuer of the ID credential used to open the account credential */
    issuer: DIDString;
};

/**
 * A verifiable credential based on an account credential on the Concordium blockchain.
 * This credential type contains zero-knowledge proofs about account credentials
 * and their associated identity attributes.
 */
export type Account = AccountCredential;

/**
 * Union type representing all supported verifiable credential formats
 * in Concordium verifiable presentations.
 *
 * The structure is reminiscent of a w3c verifiable credential
 */
type Credential = IdentityCredential | AccountCredential;

/**
 * Union type representing all supported verifiable credential formats
 * in Concordium verifiable presentations.
 *
 * The structure is reminiscent of a w3c verifiable credential
 */
export type Type = Credential;

export function isIdentityCredential(credential: Credential): credential is IdentityCredential {
    return (credential as IdentityCredential).type.includes('ConcordiumIDBasedCredential');
}

export function isAccountCredential(credential: Credential): credential is AccountCredential {
    return (credential as AccountCredential).type.includes('ConcordiumAccountBasedCredential');
}
