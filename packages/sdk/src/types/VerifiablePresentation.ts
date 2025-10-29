import JSONBigInt from 'json-bigint';

import { AtomicProof, GenericAtomicStatement } from '../commonProofTypes.js';
import { HexString } from '../types.js';
import {
    AccountCommitmentInput,
    AttributeType,
    CredentialsInputsAccount,
    CredentialsInputsWeb3,
    DIDString,
    Web3IssuerCommitmentInput,
} from '../web3-id/types.js';

/**
 * A proof that establishes that the owner of the credential has indeed created
 * the presentation. At present this is a list of signatures.
 */
export type ConcordiumWeakLinkingProofV1 = {
    /** When the statement was created, serialized as an ISO string */
    created: string;
    /** The proof value */
    proofValue: string[];
    /** The proof type */
    type: 'ConcordiumWeakLinkingProofV1';
};

/**
 * A proof corresponding to a {@linkcode GenericAtomicStatement}
 */
export type AtomicProofV2 = AtomicProof<AttributeType>;

type ZKProofV3Base = {
    /** When the statement was created, serialized as an ISO string */
    created: string;
    /** The proof value */
    proofValue: AtomicProofV2[];
    /** The proof type */
    type: 'ConcordiumZKProofV3';
};

/**
 * A zero-knowledge proof for an account credential
 */
export type StatementProofAccount = ZKProofV3Base;

/** The signed commitments of a Web3 ID credential proof */
export type SignedCommitments = {
    /** A signature of the commitments */
    signature: HexString;
    /** The commitments for each attribute included in the proof */
    commitments: Record<string, HexString>;
};

/**
 * A zero-knowledge proof for a Web3 ID credential
 */
export type StatementProofWeb3Id = ZKProofV3Base & {
    /** The signed commitments of the proof needed to verify the proof */
    commitments: SignedCommitments;
};

/**
 * Describes a credential subject of verifiable credential
 */
export type CredentialSubjectProof<P extends ZKProofV3Base> = {
    /** The credential proof ID */
    id: DIDString;
    /** The credential proof data */
    proof: P;
    /** The statement used to request the proof */
    statement: GenericAtomicStatement<string, AttributeType>[];
};

/**
 * A proof corresponding to one account credential statement. This contains almost
 * all the information needed to verify it, except the public commitments.
 *
 * Matches the serialization of `CredentialProof::Account` from concordium-base
 */
export type VerifiableCredentialProofAccount = {
    /** The credential proof */
    credentialSubject: CredentialSubjectProof<StatementProofAccount>;
    /** The issuer DID */
    issuer: DIDString;
    /** The credential type */
    type: ['VerifiableCredential', 'ConcordiumVerifiableCredential'];
};

/**
 * A proof corresponding to one Web3 ID credential statement. This contains almost
 * all the information needed to verify it, except the issuer's public key.
 *
 * Matches the serialization of `CredentialProof::Web3Id` from concordium-base
 */
export type VerifiableCredentialProofWeb3Id = {
    /** The credential proof */
    credentialSubject: CredentialSubjectProof<StatementProofWeb3Id>;
    /** The issuer DID */
    issuer: DIDString;
    /** The credential type */
    type: ['VerifiableCredential', 'ConcordiumVerifiableCredential', ...string[]];
};

/**
 * A proof corresponding to one credential statement. This contains almost
 * all the information needed to verify it, except the issuer's public key in
 * case of the `Web3Id` proof, and the public commitments in case of the
 * `Account` proof.
 *
 * Matches the serialization of `CredentialProof` enum from concordium-base.
 */
export type VerifiableCredentialProof = VerifiableCredentialProofAccount | VerifiableCredentialProofWeb3Id;

/**
 * Type predicate to check if the proof is a {@linkcode VerifiableCredentialProofWeb3Id}, or consequently a {@linkcode VerifiableCredentialProofAccount}
 */
export function isWeb3IdProof(proof: VerifiableCredentialProof): proof is VerifiableCredentialProofWeb3Id {
    return (proof as VerifiableCredentialProofWeb3Id).credentialSubject.proof.commitments !== undefined;
}

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */

/**
 * Replacer to ensure dates are stringified to the timestamp attribute format.
 */
export function replaceDateWithTimeStampAttribute(this: any, k: string, value: any): any {
    const rawValue = this[k];
    if (rawValue instanceof Date) {
        return { type: 'date-time', timestamp: rawValue.toISOString() };
    }
    return value;
}

/**
 * Reviver to ensure dates are parsed from the timestamp attribute format.
 */
export function reviveDateFromTimeStampAttribute(this: any, _key: string, value: any) {
    if (value.type === 'date-time' && typeof value.timestamp === 'string' && Object.keys(value).length === 2) {
        return new Date(Date.parse(value.timestamp));
    }
    return value;
}

/**
 * The commitment input variants used for the original verifiable presentation version
 */
export type CommitmentInput = Web3IssuerCommitmentInput | AccountCommitmentInput;
/**
 * The credentials inputs variants used for the original verifiable presentation version
 */
export type CredentialsInputs = CredentialsInputsWeb3 | CredentialsInputsAccount;

/**
 * A presentation is the response to a corresponding request containing a set of statements about an identity.
 * It contains proofs for statements, ownership proof for all credentials, and a context. The
 * only missing part to verify the proof are the public commitments.
 */
export class VerifiablePresentation {
    presentationContext: string;
    proof: ConcordiumWeakLinkingProofV1;
    type: string;
    verifiableCredential: VerifiableCredentialProof[];

    constructor(
        presentationContext: string,
        proof: ConcordiumWeakLinkingProofV1,
        type: string,
        verifiableCredential: VerifiableCredentialProof[]
    ) {
        this.presentationContext = presentationContext;
        this.proof = proof;
        this.type = type;
        this.verifiableCredential = verifiableCredential;
    }

    toString(): string {
        return JSONBigInt({
            alwaysParseAsBig: true,
            useNativeBigInt: true,
        }).stringify(this);
    }

    static fromString(json: string): VerifiablePresentation {
        // We allow all numbers to be parsed as bigints to avoid lossy conversion of attribute values. The structure does not contain any other numbers.
        const parsed: VerifiablePresentation = JSONBigInt({
            alwaysParseAsBig: true,
            useNativeBigInt: true,
        }).parse(json);
        return new VerifiablePresentation(
            parsed.presentationContext,
            parsed.proof,
            parsed.type,
            parsed.verifiableCredential
        );
    }
}
