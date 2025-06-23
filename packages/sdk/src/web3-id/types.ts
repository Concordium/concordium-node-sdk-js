import { CIS4 } from '../cis4/util.js';
import {
    GenericAtomicStatement,
    GenericMembershipStatement,
    GenericNonMembershipStatement,
    GenericRangeStatement,
    GenericRevealStatement,
} from '../commonProofTypes.js';
import type { AttributeKey, CryptographicParameters, HexString } from '../types.js';
import type * as ContractAddress from '../types/ContractAddress.js';

export type TimestampAttribute = {
    type: 'date-time';
    timestamp: string;
};
export type AttributeType = string | bigint | TimestampAttribute;
export type StatementAttributeType = AttributeType | Date;

export function isTimestampAttribute(attribute: AttributeType): attribute is TimestampAttribute {
    return (
        (attribute as TimestampAttribute).type === 'date-time' &&
        typeof (attribute as TimestampAttribute).timestamp === 'string'
    );
}

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

export type CommitmentInput = AccountCommitmentInput | Web3IssuerCommitmentInput;

export type Web3IdProofRequest = {
    challenge: string;
    credentialStatements: RequestStatement[];
};

export type Web3IdProofInput = {
    request: Web3IdProofRequest;
    globalContext: CryptographicParameters;
    commitmentInputs: CommitmentInput[];
};

export type TimestampProperty = {
    title: string;
    type: 'object';
    properties: {
        type: {
            type: 'string';
            const: 'date-time';
        };
        timestamp: {
            type: 'string';
            format?: 'date-time';
        };
    };
    required: ['type', 'timestamp'];
    description?: string;
};

export type SimpleProperty = {
    title: string;
    description?: string;
    type: 'string' | 'integer';
    format?: string;
};

export type CredentialSchemaProperty = SimpleProperty | TimestampProperty;

type IdDetails = {
    title: string;
    description?: string;
    type: 'string';
};

type CredentialSchemaAttributes = {
    title?: string;
    description?: string;
    type: 'object';
    properties: Record<string, CredentialSchemaProperty | TimestampProperty>;
    required: string[];
};

export type CredentialSchemaSubject = {
    type: 'object';
    properties: {
        id: IdDetails;
        attributes: CredentialSchemaAttributes;
    };
    required: string[];
};

export const IDENTITY_SUBJECT_SCHEMA: CredentialSchemaSubject = {
    type: 'object',
    properties: {
        id: {
            title: 'id',
            type: 'string',
            description: 'Credential subject identifier',
        },
        attributes: {
            type: 'object',
            properties: {
                firstName: {
                    title: 'First name',
                    type: 'string',
                },
                lastName: {
                    title: 'Last name',
                    type: 'string',
                },
                sex: {
                    title: 'Sex',
                    type: 'string',
                },
                dob: {
                    title: 'Date of birth',
                    type: 'string',
                },
                countryOfResidence: {
                    title: 'Country of residence',
                    type: 'string',
                },
                nationality: {
                    title: 'Nationality',
                    type: 'string',
                },
                idDocType: {
                    title: 'ID Document Type',
                    type: 'string',
                },
                idDocNo: {
                    title: 'ID Document Number',
                    type: 'string',
                },
                idDocIssuer: {
                    title: 'ID Document Issuer',
                    type: 'string',
                },
                idDocIssuedAt: {
                    title: 'ID Document Issued At',
                    type: 'string',
                },
                idDocExpiresAt: {
                    title: 'ID Document Expires At',
                    type: 'string',
                },
                nationalIdNo: {
                    title: 'National ID Number',
                    type: 'string',
                },
                taxIdNo: {
                    title: 'Tax ID Number',
                    type: 'string',
                },
                lei: {
                    title: 'Legal Entity Identifier (LEI)',
                    type: 'string',
                },
                legalName: {
                    title: 'Legal Name',
                    type: 'string',
                },
                legalCountry: {
                    title: 'Legal Country',
                    type: 'string',
                },
                businessNumber: {
                    title: 'Business Number',
                    type: 'string',
                },
                registrationAuth: {
                    title: 'Registration Authority',
                    type: 'string',
                },
            },
            required: [],
        },
    },
    required: [],
};

export type RangeStatementV2 = GenericRangeStatement<string, AttributeType>;
export type NonMembershipStatementV2 = GenericNonMembershipStatement<string, AttributeType>;
export type MembershipStatementV2 = GenericMembershipStatement<string, AttributeType>;
export type RevealStatementV2 = GenericRevealStatement<string>;

export type AtomicStatementV2 = GenericAtomicStatement<string, AttributeType>;

export type VerifiableCredentialQualifier = {
    type: 'sci';
    issuers: ContractAddress.Type[];
};

type IdentityProviderIndex = number;

export type IdentityQualifier = {
    type: 'cred';
    issuers: IdentityProviderIndex[];
};

export type StatementProverQualifier = VerifiableCredentialQualifier | IdentityQualifier;

export function isAccountCredentialStatement(statement: CredentialStatement): statement is AccountCredentialStatement {
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

export function isVerifiableCredentialRequestStatement(statement: RequestStatement): boolean {
    return Boolean(statement.type);
}

export type CredentialStatements = CredentialStatement[];

export type CredentialSubject = {
    id: string;
    attributes: Record<string, AttributeType>;
};

/** The credentials inputs required to verify the proof of account proofs */
export type CredentialsInputsAccount = {
    /** Union tag */
    type: 'account';
    /** Commitments for the ID attributes of the account */
    commitments: Partial<Record<AttributeKey, HexString>>;
};

/** The credentials inputs required to verify the proof of Web3 ID proofs */
export type CredentialsInputsWeb3 = {
    /** Union tag */
    type: 'web3';
    /** The public key of the Web3 ID issuer */
    issuerPk: HexString;
};

/** Union of the different inputs required to verify corresponding proofs */
export type CredentialsInputs = CredentialsInputsAccount | CredentialsInputsWeb3;

/** Contains the credential status and inputs required to verify a corresponding credential proof */
export type CredentialWithMetadata = {
    /** The credential status */
    status: CIS4.CredentialStatus;
    /** The public data required to verify a corresponding credential proof */
    inputs: CredentialsInputs;
};
