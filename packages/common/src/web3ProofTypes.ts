import {
    GenericAtomicStatement,
    GenericRevealStatement,
    GenericMembershipStatement,
    GenericNonMembershipStatement,
    GenericRangeStatement,
} from './commonProofTypes';
import { ContractAddress, CryptographicParameters } from './types';

export type AttributeType = string | bigint | Date;

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
    values: Record<string, AttributeType>;
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
    properties: {
        id: IndexDetails;
        attributes: {
            properties: Record<string, PropertyDetails>;
        };
    };
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
        attributes: {
            properties: {
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
        },
    },
    required: [],
};

export type RangeStatementV2 = GenericRangeStatement<string, AttributeType>;
export type NonMembershipStatementV2 = GenericNonMembershipStatement<
    string,
    AttributeType
>;
export type MembershipStatementV2 = GenericMembershipStatement<
    string,
    AttributeType
>;
export type RevealStatementV2 = GenericRevealStatement<string>;

export type AtomicStatementV2 = GenericAtomicStatement<string, AttributeType>;

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
    /** The type field is present iff the request is for a verifiable credential */
    type?: string[];
};

export function isVerifiableCredentialRequestStatement(
    statement: RequestStatement
): boolean {
    return Boolean(statement.type);
}

export type CredentialStatements = CredentialStatement[];

export type CredentialSubject = {
    id: string;
    attributes: Record<string, AttributeType>;
};
