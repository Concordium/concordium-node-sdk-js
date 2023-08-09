import {
    GenericAtomicStatement,
    GenericRevealStatement,
    GenericMembershipStatement,
    GenericNonMembershipStatement,
    GenericRangeStatement,
    AtomicProof,
} from './commonProofTypes';
import { ContractAddress, CryptographicParameters } from './types';
import JSONBigInt from 'json-bigint';

export type AccountCommitmentInput = {
    type: 'account';
    issuer: number;
    values: Record<string, string>;
    randomness: Record<string, string>;
};

export type Web3IssuerCommitmentInput = {
    type: 'web3Issuer';
    signature: string;
    signer: string;
    values: Record<string, string | bigint | number>;
    randomness: Record<string, string>;
};

export type CommitmentInput =
    | AccountCommitmentInput
    | Web3IssuerCommitmentInput;

export type Web3IdProofRequest = {
    challenge: string;
    credentialStatements: RequestStatement[];
};

export type Web3IdProofInput = {
    request: Web3IdProofRequest;
    globalContext: CryptographicParameters;
    commitmentInputs: CommitmentInput[];
};

export type PropertyDetails = {
    title: string;
    description?: string;
    type: string;
    format?: string;
};

type IndexDetails = {
    title: 'id';
    description?: string;
    type: 'string';
};

export type VerifiableCredentialSubject = {
    type: 'object';
    properties:
        | {
              id: IndexDetails;
          }
        | Record<string, PropertyDetails>;
    required: string[];
};

export const IDENTITY_SUBJECT_SCHEMA: VerifiableCredentialSubject = {
    type: 'object',
    properties: {
        id: {
            title: 'id',
            type: 'string',
            description: 'Credential subject identifier',
        },
        firstName: {
            title: 'first name',
            type: 'string',
        },
        lastName: {
            title: 'last name',
            type: 'string',
        },
        sex: {
            title: 'sex',
            type: 'string',
        },
        dob: {
            title: 'date of birth',
            type: 'string',
        },
        countryOfResidence: {
            title: 'last name',
            type: 'string',
        },
        nationality: {
            title: 'last name',
            type: 'string',
        },
        idDocType: {
            title: 'last name',
            type: 'string',
        },
        idDocNo: {
            title: 'last name',
            type: 'string',
        },
        idDocIssuer: {
            title: 'last name',
            type: 'string',
        },
        idDocIssuedAt: {
            title: 'last name',
            type: 'string',
        },
        idDocExpiresAt: {
            title: 'last name',
            type: 'string',
        },
        nationalIdNo: {
            title: 'last name',
            type: 'string',
        },
        taxIdNo: {
            title: 'last name',
            type: 'string',
        },
    },
    required: [],
};

type DIDString = string;

export type ConcordiumWeakLinkingProofV1 = {
    created: string;
    proofValue: string[];
    type: 'ConcordiumWeakLinkingProofV1';
};

export type AtomicProofV2 = AtomicProof<string | bigint>;

export type StatementProof = {
    created: string;
    proofValue: AtomicProofV2[];
    type: 'ConcordiumZKProofV3';
};

export type CredentialSubjectProof = {
    id: DIDString;
    proof: StatementProof;
    statement: AtomicStatementV2[];
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
        // We allow all numbers to be parsed as bigints to avoid lossy conversion of attribute values. The only other numbers in the structure are the attributeTags.
        const parsed: VerifiablePresentation = JSONBigInt({
            alwaysParseAsBig: true,
            useNativeBigInt: true,
        }).parse(json);
        // Convert the attributeTags back to numbers
        return new VerifiablePresentation(
            parsed.presentationContext,
            parsed.proof,
            parsed.type,
            parsed.verifiableCredential
        );
    }
}

export type RangeStatementV2 = GenericRangeStatement<string, string | bigint>;
export type NonMembershipStatementV2 = GenericNonMembershipStatement<
    string,
    string | bigint
>;
export type MembershipStatementV2 = GenericMembershipStatement<
    string,
    string | bigint
>;
export type RevealStatementV2 = GenericRevealStatement<string>;

export type AtomicStatementV2 = GenericAtomicStatement<string, string | bigint>;

export type VerifiableCredentialQualifier = {
    type: 'sci';
    issuers: ContractAddress[];
};

type IdentityProviderIndex = number;

export type IdentityQualifier = {
    type: 'cred';
    issuers: IdentityProviderIndex[];
};

export type StatementProverQualifier =
    | VerifiableCredentialQualifier
    | IdentityQualifier;

export function isAccountCredentialStatement(
    statement: CredentialStatement
): statement is AccountCredentialStatement {
    return statement.idQualifier.type === 'cred';
}

export function isVerifiableCredentialStatement(
    statement: CredentialStatement
): statement is VerifiableCredentialStatement {
    return statement.idQualifier.type === 'sci';
}

export interface AccountCredentialStatement extends CredentialStatement {
    idQualifier: IdentityQualifier;
    statement: AtomicStatementV2[];
}

export interface VerifiableCredentialStatement extends CredentialStatement {
    idQualifier: VerifiableCredentialQualifier;
    statement: AtomicStatementV2[];
}

export type CredentialStatement = {
    idQualifier: StatementProverQualifier;
    statement: AtomicStatementV2[];
};

export type RequestStatement = {
    id: string;
    statement: AtomicStatementV2[];
    type?: string[];
};

export type CredentialStatements = CredentialStatement[];

export type CredentialSubject = {
    id: string;
    attributes: Record<string, string | bigint>;
};
