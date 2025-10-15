import JSONBigInt from 'json-bigint';

import { AtomicProof, GenericAtomicStatement } from '../commonProofTypes.js';
import { HexString } from '../types.js';
import { AttributeType } from '../web3-id/types.js';

/**
 * The "Distributed Identifier" string.
 */
export type DIDString = string;

export type ConcordiumWeakLinkingProofV1 = {
    /** When the statement was created, serialized as an ISO string */
    created: string;
    /** The proof value */
    proofValue: string[];
    /** The proof type */
    type: 'ConcordiumWeakLinkingProofV1';
};

export type AtomicProofV2 = AtomicProof<AttributeType>;

type ZKProofV3Base = {
    /** When the statement was created, serialized as an ISO string */
    created: string;
    /** The proof value */
    proofValue: AtomicProofV2[];
    /** The proof type */
    type: 'ConcordiumZKProofV3';
};

export type StatementProofAccount = ZKProofV3Base;

/** The signed commitments of a Web3 ID credential proof */
export type SignedCommitments = {
    /** A signature of the commitments */
    signature: HexString;
    /** The commitments for each attribute included in the proof */
    commitments: Record<string, HexString>;
};

export type StatementProofWeb3Id = ZKProofV3Base & {
    /** The signed commitments of the proof needed to verify the proof */
    commitments: SignedCommitments;
};

export type StatementProofIdentity = ZKProofV3Base & {
    /** Commitments to attribute values and their proofs */
    // TODO: need to model this after
    // https://github.com/Concordium/concordium-base/blob/c4a5917309b168e4d69f883bc23f92ea62ec97df/rust-src/concordium_base/src/id/types.rs#L2812
    identityAttributesInfo: unknown;
};

export type CredentialSubjectProof<P extends ZKProofV3Base> = {
    /** The credential proof ID */
    id: DIDString;
    /** The credential proof data */
    proof: P;
    /** The statement used to request the proof */
    statement: GenericAtomicStatement<string, AttributeType>[];
};

/**
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

// TODO: not implemented in base yet... might need to revise
export type VerifiableCredentialProofIdentity = {
    /** The credential proof */
    credentialSubject: CredentialSubjectProof<StatementProofIdentity>;
    /** The issuer DID */
    issuer: DIDString;
    /** The credential type */
    type: ['VerifiableCredential', 'ConcordiumVerifiableCredential'];
};

/**
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
