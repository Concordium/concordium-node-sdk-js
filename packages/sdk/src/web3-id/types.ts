import {
    GenericAtomicStatement,
    GenericMembershipStatement,
    GenericNonMembershipStatement,
    GenericRangeStatement,
    GenericRevealStatement,
} from '../commonProofTypes.js';
import type {
    ArInfo,
    AttributeKey,
    CryptographicParameters,
    HexString,
    IdentityObjectV1,
    IdentityProvider,
    IpInfo,
    Network,
    Policy,
} from '../types.js';
import * as ContractAddress from '../types/ContractAddress.js';

/**
 * The "Distributed Identifier" string.
 */
export type DIDString = string;

/** Represents a timestamp attribute with type information. */
export type TimestampAttribute = {
    /** Identifies this as a date-time type attribute. */
    type: 'date-time';
    /** The timestamp value as a string. */
    timestamp: string;
};
/** Union type representing different attribute value types. */
export type AttributeType = string | bigint | TimestampAttribute;
/** Union type for statement attribute types, including Date objects. */
export type StatementAttributeType = AttributeType | Date;

/** Type guard to check if an attribute is a timestamp attribute. */
export function isTimestampAttribute(attribute: AttributeType): attribute is TimestampAttribute {
    return (
        (attribute as TimestampAttribute).type === 'date-time' &&
        typeof (attribute as TimestampAttribute).timestamp === 'string'
    );
}

/** Commitment input for account credentials containing issuer and attribute information. */
// NOTE: **MUST** match the serialiation of CommitmentInput::Account in concordium-base
export type AccountCommitmentInput = {
    /** Identifies this as an account commitment input. */
    type: 'account';
    /** The identity provider index that issued the credential. */
    issuer: number;
    /** Attribute values mapped by attribute name. */
    values: Record<string, string>;
    /** Randomness values used for commitments mapped by attribute name. */
    randomness: Record<string, string>;
};

/** Commitment input for Web3 issuer credentials containing signature and signer information. */
// NOTE: **MUST** match the serialiation of CommitmentInput::Web3Id in concordium-base
export type Web3IssuerCommitmentInput = {
    /** Identifies this as a Web3 issuer commitment input. */
    type: 'web3Issuer';
    /** The credential signature. */
    signature: string;
    /** The signer's identifier/key. */
    signer: string;
    /** Attribute values mapped by attribute name. */
    values: Record<string, AttributeType>;
    /** Randomness values used for commitments mapped by attribute name. */
    randomness: Record<string, string>;
};

/**
 * Can be computed with a seed phrase through the use of {@linkcode createIdentityCommitmentInputWithHdWallet}.
 * The seed phrase must be the once used during the identity issuance process with the identity provider.
 */
export type IdObjectUseData = {
    /** Account credential information including secrets and keys. */
    aci: {
        /** Information held by the credential holder. */
        credentialHolderInformation: {
            /** The identity credential secret. */
            idCredSecret: Uint8Array;
        };
        /** The pseudorandom function key. */
        prfKey: Uint8Array;
    };
    /** Randomness used for signature blinding. */
    randomness: Uint8Array;
};

/** Commitment input for identity credentials containing context and identity object data. */
// NOTE: **MUST** match the serialiation of CommitmentInput::Identity in concordium-base
export type IdentityCommitmentInput = {
    /** Identifies this as an identity credentials commitment input. */
    // TODO: make sure this aligns with the chosen representation in concordium-base
    type: 'identity';
    /** The identity provider context. */
    context: IdentityProvider;
    /** The identity object containing identity information. */
    idObject: IdentityObjectV1;
    /** Additional data required for using the identity object. */
    idObjectUseData: IdObjectUseData;
    /** The policy associated with the credential. */
    policy: Policy;
};

/**
 * The commitment input variants used for the original verifiable presentation version
 */
export type CommitmentInput = Web3IssuerCommitmentInput | AccountCommitmentInput;

/** Represents timestamp property schema for credential attributes. */
export type TimestampProperty = {
    /** The title of the property. */
    title: string;
    /** Indicates this is an object type property. */
    type: 'object';
    /** Schema properties for the timestamp object. */
    properties: {
        /** Schema for the type field. */
        type: {
            /** The type field is a string. */
            type: 'string';
            /** The type field must be 'date-time'. */
            const: 'date-time';
        };
        /** Schema for the timestamp field. */
        timestamp: {
            /** The timestamp field is a string. */
            type: 'string';
            /** Optional format specification. */
            format?: 'date-time';
        };
    };
    /** Required fields for the timestamp property. */
    required: ['type', 'timestamp'];
    /** Optional description of the property. */
    description?: string;
};

/** Represents simple property schema for string or integer credential attributes. */
export type SimpleProperty = {
    /** The title of the property. */
    title: string;
    /** Optional description of the property. */
    description?: string;
    /** The type of the property value. */
    type: 'string' | 'integer';
    /** Optional format specification for the property. */
    format?: string;
};

/** Union type for credential schema property types. */
export type CredentialSchemaProperty = SimpleProperty | TimestampProperty;

/** Schema for credential subject identifier details. */
type IdDetails = {
    /** The title of the identifier field. */
    title: string;
    /** Optional description of the identifier field. */
    description?: string;
    /** The identifier field is a string. */
    type: 'string';
};

/** Schema for credential attributes collection. */
type CredentialSchemaAttributes = {
    /** Optional title for the attributes collection. */
    title?: string;
    /** Optional description of the attributes collection. */
    description?: string;
    /** Attributes are represented as an object. */
    type: 'object';
    /** Schema properties for individual attributes mapped by attribute name. */
    properties: Record<string, CredentialSchemaProperty | TimestampProperty>;
    /** List of required attribute names. */
    required: string[];
};

/** Complete schema definition for credential subjects. */
export type CredentialSchemaSubject = {
    /** The credential subject is represented as an object. */
    type: 'object';
    /** Schema properties for the credential subject. */
    properties: {
        /** Schema for the identifier field. */
        id: IdDetails;
        /** Schema for the attributes collection. */
        attributes: CredentialSchemaAttributes;
    };
    /** List of required fields in the credential subject. */
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

/** Type aliases for different statement types with specific attribute key constraints. */
export type RangeStatementV2<AttributeKey = string> = GenericRangeStatement<AttributeKey, AttributeType>;
export type NonMembershipStatementV2<AttributeKey = string> = GenericNonMembershipStatement<
    AttributeKey,
    AttributeType
>;
export type MembershipStatementV2<AttributeKey = string> = GenericMembershipStatement<AttributeKey, AttributeType>;
export type RevealStatementV2<AttributeKey = string> = GenericRevealStatement<AttributeKey>;

export type AtomicStatementV2<AttributeKey = string> = GenericAtomicStatement<AttributeKey, AttributeType>;

/** Qualifier for Web3 ID credentials issued by smart contracts. */
// TODO: (breaking) rename to Web3IdQualifier.
export type VerifiableCredentialQualifier = {
    /** Identifies this as a smart contract issuer qualifier. */
    type: 'sci';
    /** Array of valid contract addresses that can issue these credentials. */
    issuers: ContractAddress.Type[];
};

/** Index type for identity providers. */
type IdentityProviderIndex = number;

/** Qualifier for account credentials issued by identity providers. */
export type IdentityQualifier = {
    /** Identifies this as an account credential issuer qualifier. */
    type: 'cred';
    /** Array of valid identity provider indices that can issue these credentials. */
    issuers: IdentityProviderIndex[];
};

/** Union type for all statement prover qualifiers. */
export type StatementProverQualifier = VerifiableCredentialQualifier | IdentityQualifier;

/**
 * Type predicate to identifying {@linkcode AccountCredentialStatement}s from a {@linkcode CredentialStatement}
 */
export function isAccountCredentialStatement(statement: CredentialStatement): statement is AccountCredentialStatement {
    return statement.idQualifier.type === 'cred';
}

/**
 * Type predicate to identifying {@linkcode VerifiableCredentialStatement}s from a {@linkcode CredentialStatement}
 */
// TODO: (breaking) rename to isWeb3IdCredentialStatement.
export function isVerifiableCredentialStatement(
    statement: CredentialStatement
): statement is VerifiableCredentialStatement {
    return statement.idQualifier.type === 'sci';
}

/** Statement type for account credentials with attribute key constraints. */
export type AccountCredentialStatement = {
    /** Qualifier specifying which account credential issuers are valid. */
    idQualifier: IdentityQualifier;
    /** Array of atomic statements to prove about the account credential. */
    statement: AtomicStatementV2<AttributeKey>[];
};

/** Statement type for Web3 ID credentials with string attribute keys. */
// TODO: (breaking) rename to Web3IdCredentialStatement.
export type VerifiableCredentialStatement = {
    /** Qualifier specifying which Web3 ID credential issuers are valid. */
    idQualifier: VerifiableCredentialQualifier;
    /** Array of atomic statements to prove about the Web3 ID credential. */
    statement: AtomicStatementV2<string>[];
};

/** Union type for all credential statement types. */
export type CredentialStatement = AccountCredentialStatement | VerifiableCredentialStatement;

/** Array type for credential statements. */
export type CredentialStatements = CredentialStatement[];

export type RequestStatement<AttributeKey = string> = {
    id: DIDString;
    statement: AtomicStatementV2<AttributeKey>[];
    /** The type field is present iff the request is for a verifiable credential */
    type?: string[];
};

export function isVerifiableCredentialRequestStatement(statement: RequestStatement): boolean {
    return Boolean(statement.type);
}

/**
 * Describes a proof request which is at the core of computing the corresponding proof.
 */
export type Web3IdProofRequest = {
    /** The challenge of the proof */
    challenge: string;
    /** The statements paired with the credential IDs to prove them for */
    credentialStatements: RequestStatement[];
};

/**
 * The input to {@linkcode getVerifiablePresentation}
 */
export type Web3IdProofInput = {
    request: Web3IdProofRequest;
    globalContext: CryptographicParameters;
    commitmentInputs: CommitmentInput[];
};

/** Represents a credential subject with identifier and attributes. */
export type CredentialSubject = {
    /** The identifier of the credential subject. */
    id: string;
    /** Attributes of the credential subject mapped by attribute name. */
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
/**
 * The credentials inputs variants used for the original verifiable presentation version
 */
export type CredentialsInputs = CredentialsInputsWeb3 | CredentialsInputsAccount;

/** Credentials inputs for identity credential proofs. */
export type CredentialsInputsIdentity = {
    /** Identifies this as identity credentials input. */
    type: 'identityCredentials'; // TODO: or maybe just 'id'?
    /** Information about the identity provider. */
    ipInfo: IpInfo;
    /** Known anonymity revokers mapped by their index. */
    knownArs: Record<number, ArInfo>;
};

export class IdentityProviderDID {
    constructor(
        public network: Network,
        public index: number
    ) {}

    public toJSON(): DIDString {
        return `ccd:${this.network.toLowerCase()}:idp:${this.index}`;
    }

    public static fromJSON(did: DIDString): IdentityProviderDID {
        const parts = did.split(':');
        if (parts.length !== 4 || parts[0] !== 'ccd' || parts[2] !== 'idp') {
            throw new Error(`Invalid IdentityQualifierDID format: ${did}`);
        }
        const network = (parts[1].charAt(0).toUpperCase() + parts[1].slice(1)) as Network;
        const index = parseInt(parts[3], 10);
        if (isNaN(index)) {
            throw new Error(`Invalid index in IdentityProviderDID: ${parts[3]}`);
        }
        return new IdentityProviderDID(network, index);
    }
}

export class ContractInstanceDID {
    constructor(
        public network: Network,
        public address: ContractAddress.Type
    ) {}

    public toJSON(): DIDString {
        return `ccd:${this.network.toLowerCase()}:sci:${this.address.index}:${this.address.subindex}`;
    }

    public static fromJSON(did: DIDString): ContractInstanceDID {
        const parts = did.split(':');
        if (parts.length !== 5 || parts[0] !== 'ccd' || parts[2] !== 'sci') {
            throw new Error(`Invalid ContractInstanceDID format: ${did}`);
        }
        const network = (parts[1].charAt(0).toUpperCase() + parts[1].slice(1)) as Network;
        const index = BigInt(parts[3]);
        const subindex = BigInt(parts[4]);
        return new ContractInstanceDID(network, ContractAddress.create(index, subindex));
    }
}
