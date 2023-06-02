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
    issuanceDate: string;
    issuer: number;
    values: Record<number, string>;
    randomness: Record<number, string>;
};

export type Web3IssuerCommitmentInput = {
    type: 'web3Issuer';
    issuanceDate: string;
    signer: string;
    values: Record<number, string | bigint | number>;
    randomness: string;
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
    index: string;
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
            index: '0',
        },
        lastName: {
            title: 'last name',
            type: 'string',
            index: '1',
        },
        sex: {
            title: 'sex',
            type: 'string',
            index: '2',
        },
        dob: {
            title: 'date of birth',
            type: 'string',
            index: '3',
        },
        countryOfResidence: {
            title: 'last name',
            type: 'string',
            index: '4',
        },
        nationality: {
            title: 'last name',
            type: 'string',
            index: '5',
        },
        idDocType: {
            title: 'last name',
            type: 'string',
            index: '6',
        },
        idDocNo: {
            title: 'last name',
            type: 'string',
            index: '7',
        },
        idDocIssuer: {
            title: 'last name',
            type: 'string',
            index: '8',
        },
        idDocIssuedAt: {
            title: 'last name',
            type: 'string',
            index: '9',
        },
        idDocExpiresAt: {
            title: 'last name',
            type: 'string',
            index: '10',
        },
        nationalIdNo: {
            title: 'last name',
            type: 'string',
            index: '11',
        },
        taxIdNo: {
            title: 'last name',
            type: 'string',
            index: '12',
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
    issuanceDate: string;
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

    toString() {
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
        const verifiableCredential = parsed.verifiableCredential.map(
            ({
                credentialSubject: { statement, ...credentialSubject },
                ...proof
            }) => ({
                ...proof,
                credentialSubject: {
                    ...credentialSubject,
                    statement: statement.map(
                        ({ attributeTag, ...statement }) => ({
                            ...statement,
                            attributeTag: Number(attributeTag),
                        })
                    ),
                },
            })
        );
        return new VerifiablePresentation(
            parsed.presentationContext,
            parsed.proof,
            parsed.type,
            verifiableCredential
        );
    }
}

export type RangeStatementV2 = GenericRangeStatement<number, string | bigint>;
export type NonMembershipStatementV2 = GenericNonMembershipStatement<
    number,
    string | bigint
>;
export type MembershipStatementV2 = GenericMembershipStatement<
    number,
    string | bigint
>;
export type RevealStatementV2 = GenericRevealStatement<number>;

export type AtomicStatementV2 = GenericAtomicStatement<number, string | bigint>;

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
