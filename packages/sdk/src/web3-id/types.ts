import { CIS4 } from '../cis4/util.js';
import {
    GenericAtomicStatement,
    GenericMembershipStatement,
    GenericNonMembershipStatement,
    GenericRangeStatement,
    GenericRevealStatement,
} from '../commonProofTypes.js';
import type { ArInfo, AttributeKey, HexString, IdentityObjectV1, IdentityProvider, IpInfo, Policy } from '../types.js';
import type * as ContractAddress from '../types/ContractAddress.js';

/**
 * The "Distributed Identifier" string.
 */
export type DIDString = string;

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

/**
 * Can be computed with a seed phrase through the use of {@linkcode createIdentityCommitmentInputWithHdWallet}
 */
export type IdObjectUseData = {
    aci: {
        credentialHolderInformation: {
            idCredSecret: Uint8Array;
        };
        prfKey: Uint8Array;
    };
    randomness: Uint8Array;
};

// similar info as for account opening proofs - check `CredentialInputCommon`
// matches CommitmentInputs::IdentityCredentials in concordium-base
// TODO: verify that this is correct...
export type IdentityCommitmentInput = {
    type: 'identityCredentials'; // TODO: can we just use 'id' instead?
    context: IdentityProvider;
    idObject: IdentityObjectV1;
    idObjectUseData: IdObjectUseData;
    policy: Policy;
};

export type CommitmentInput = AccountCommitmentInput | Web3IssuerCommitmentInput | IdentityCommitmentInput;

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

export type RangeStatementV2<AttributeKey = string> = GenericRangeStatement<AttributeKey, AttributeType>;
export type NonMembershipStatementV2<AttributeKey = string> = GenericNonMembershipStatement<
    AttributeKey,
    AttributeType
>;
export type MembershipStatementV2<AttributeKey = string> = GenericMembershipStatement<AttributeKey, AttributeType>;
export type RevealStatementV2<AttributeKey = string> = GenericRevealStatement<AttributeKey>;

export type AtomicStatementV2<AttributeKey = string> = GenericAtomicStatement<AttributeKey, AttributeType>;

export type Web3IdCredentialQualifier = {
    type: 'sci';
    issuers: ContractAddress.Type[];
};

type IdentityProviderIndex = number;

export type AccountCredentialQualifier = {
    type: 'cred';
    issuers: IdentityProviderIndex[];
};

export type IdentityCredentialQualifier = {
    type: 'id'; // TODO: align with the corresponding DID defined in concordium-base
    issuers: IdentityProviderIndex[];
};

export type StatementProverQualifier =
    | Web3IdCredentialQualifier
    | AccountCredentialQualifier
    | IdentityCredentialQualifier;

export function isAccountCredentialStatement(statement: CredentialStatement): statement is AccountCredentialStatement {
    return statement.idQualifier.type === 'cred';
}

export function isVerifiableCredentialStatement(
    statement: CredentialStatement
): statement is Web3IdCredentialStatement {
    return statement.idQualifier.type === 'sci';
}

export type AccountCredentialStatement = {
    idQualifier: AccountCredentialQualifier;
    statement: AtomicStatementV2<AttributeKey>[];
};

export type Web3IdCredentialStatement = {
    idQualifier: Web3IdCredentialQualifier;
    statement: AtomicStatementV2<string>[];
};

export type IdentityCredentialStatement = {
    idQualifier: IdentityCredentialQualifier;
    statement: AtomicStatementV2<AttributeKey>[];
};

export type CredentialStatement = AccountCredentialStatement | Web3IdCredentialStatement | IdentityCredentialStatement;

export type AccountCredentialRequestStatement = {
    id: DIDString;
    statement: AtomicStatementV2<AttributeKey>[];
};

export type Web3IdCredentialRequestStatement = {
    id: DIDString;
    statement: AtomicStatementV2<string>[];
    type: string[];
};

export type IdentityCredentialRequestStatement = {
    id: DIDString;
    statement: AtomicStatementV2<AttributeKey>[];
};

export type CredentialRequestStatement =
    | AccountCredentialRequestStatement
    | Web3IdCredentialRequestStatement
    | IdentityCredentialRequestStatement;

export function isAccountCredentialRequestStatement(
    statement: CredentialRequestStatement
): statement is AccountCredentialRequestStatement {
    return statement.id.includes(':cred:');
}

export function isWeb3IdCredentialRequestStatement(
    statement: CredentialRequestStatement
): statement is AccountCredentialRequestStatement {
    return statement.id.includes(':sci:');
}

export function isIdentityCredentialRequestStatement(
    statement: CredentialRequestStatement
): statement is AccountCredentialRequestStatement {
    return statement.id.includes(':id:'); // TODO: figure out if this matches the identifier.
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

export type CredentialsInputsIdentity = {
    type: 'identityCredentials'; // TODO: or maybe just 'id'?
    ipInfo: IpInfo;
    knownArs: Record<number, ArInfo>;
};

/** Union of the different inputs required to verify corresponding proofs */
export type CredentialsInputs = CredentialsInputsAccount | CredentialsInputsWeb3 | CredentialsInputsIdentity;

/** Contains the credential status and inputs required to verify a corresponding credential proof */
export type CredentialWithMetadata = {
    /** The credential status */
    status: CIS4.CredentialStatus;
    /** The public data required to verify a corresponding credential proof */
    inputs: CredentialsInputs;
};
