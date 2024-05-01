import { GenericAtomicStatement, AtomicProof } from '../commonProofTypes.ts';
import JSONBigInt from 'json-bigint';
import { AttributeType } from '../web3-id/types.ts';

type DIDString = string;

export type ConcordiumWeakLinkingProofV1 = {
    created: string;
    proofValue: string[];
    type: 'ConcordiumWeakLinkingProofV1';
};

export type AtomicProofV2 = AtomicProof<AttributeType>;

export type StatementProof = {
    created: string;
    proofValue: AtomicProofV2[];
    type: 'ConcordiumZKProofV3';
};

export type CredentialSubjectProof = {
    id: DIDString;
    proof: StatementProof;
    statement: GenericAtomicStatement<string, AttributeType>[];
};

export type VerifiableCredentialProof = {
    credentialSubject: CredentialSubjectProof;
    issuer: DIDString;
    type: [
        'VerifiableCredential',
        'ConcordiumVerifiableCredential',
        ...string[]
    ];
};

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */

/**
 * Replacer to ensure dates are stringified to the timestamp attribute format.
 */
export function replaceDateWithTimeStampAttribute(
    this: any,
    k: string,
    value: any
): any {
    const rawValue = this[k];
    if (rawValue instanceof Date) {
        return { type: 'date-time', timestamp: rawValue.toISOString() };
    }
    return value;
}

/**
 * Reviver to ensure dates are parsed from the timestamp attribute format.
 */
export function reviveDateFromTimeStampAttribute(
    this: any,
    _key: string,
    value: any
) {
    if (
        value.type === 'date-time' &&
        typeof value.timestamp === 'string' &&
        Object.keys(value).length === 2
    ) {
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
