import {
    AttributeKey,
    ContractAddress,
    CryptographicParameters,
    IdentityObjectV1,
    Network,
    Versioned,
} from '.';

export enum StatementTypes {
    RevealAttribute = 'RevealAttribute',
    AttributeInSet = 'AttributeInSet',
    AttributeNotInSet = 'AttributeNotInSet',
    AttributeInRange = 'AttributeInRange',
}

type LaxStringEnum<E extends string> = `${E}`;

type GenericRevealStatement<TagType> = {
    type: LaxStringEnum<StatementTypes.RevealAttribute>;
    attributeTag: TagType;
};

type GenericMembershipStatement<TagType, ValueType> = {
    type: LaxStringEnum<StatementTypes.AttributeInSet>;
    attributeTag: TagType;
    set: ValueType[];
};

type GenericNonMembershipStatement<TagType, ValueType> = {
    type: LaxStringEnum<StatementTypes.AttributeNotInSet>;
    attributeTag: TagType;
    set: ValueType[];
};

type GenericRangeStatement<TagType, ValueType> = {
    type: LaxStringEnum<StatementTypes.AttributeInRange>;
    attributeTag: TagType;
    lower: ValueType;
    upper: ValueType;
};

export type RangeStatement = GenericRangeStatement<AttributeKey, string>;
export type NonMembershipStatement = GenericNonMembershipStatement<
    AttributeKey,
    string
>;
export type MembershipStatement = GenericMembershipStatement<
    AttributeKey,
    string
>;
export type RevealStatement = GenericRevealStatement<AttributeKey>;

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

type GenericAtomicStatement<TagType, ValueType> =
    | GenericRevealStatement<TagType>
    | GenericMembershipStatement<TagType, ValueType>
    | GenericNonMembershipStatement<TagType, ValueType>
    | GenericRangeStatement<TagType, ValueType>;

export type AtomicStatement = GenericAtomicStatement<AttributeKey, string>;
export type AtomicStatementV2 = GenericAtomicStatement<number, string | bigint>;

export type IdStatement = AtomicStatement[];

export type IdProofInput = {
    idObject: IdentityObjectV1;
    globalContext: CryptographicParameters;
    seedAsHex: string;
    net: Network;
    identityProviderIndex: number;
    identityIndex: number;
    credNumber: number;
    statement: IdStatement;
    challenge: string; // Hex
};

export type RevealProof = {
    type: StatementTypes.RevealAttribute;
    proof: string;
    attribute: string;
};

// Type for proofs that do not have additional fields
export type GenericAtomicProof = {
    type: Exclude<StatementTypes, StatementTypes.RevealAttribute>;
    proof: string;
};

export type AtomicProof = RevealProof | GenericAtomicProof;
export type IdProof = {
    proofs: AtomicProof[];
};

export type IdProofOutput = {
    credential: string;
    proof: Versioned<IdProof>;
};

/**
 * The attributes that can be used for range statements
 */
export const attributesWithRange: AttributeKey[] = [
    'dob',
    'idDocIssuedAt',
    'idDocExpiresAt',
];

/**
 * The attributes that can be used for (non)membership statements
 */
export const attributesWithSet: AttributeKey[] = [
    'countryOfResidence',
    'nationality',
    'idDocType',
    'idDocIssuer',
];

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

type DiscriminatedStatement = {
    id: StatementProverQualifier;
    statement: AtomicStatementV2[];
};

export type IdStatementV2 = DiscriminatedStatement[];

export interface StatementBuilder<
    ValueType,
    AttributeType extends number,
    TagType = AttributeType
> {
    addRange(
        attribute: AttributeType,
        lower: ValueType,
        upper: ValueType
    ): this;

    addMembership(attribute: AttributeType, set: ValueType[]): this;

    addNonMembership(attribute: AttributeType, set: ValueType[]): this;
    revealAttribute(attribute: AttributeType): this;
    getStatement(): GenericAtomicStatement<TagType, ValueType>[];
}

export const MIN_DATE = '18000101';
export const MAX_DATE = '99990101';
export const EU_MEMBERS = [
    'AT',
    'BE',
    'BG',
    'CY',
    'CZ',
    'DK',
    'EE',
    'FI',
    'FR',
    'DE',
    'GR',
    'HU',
    'IE',
    'IT',
    'LV',
    'LT',
    'LU',
    'MT',
    'NL',
    'PL',
    'PT',
    'RO',
    'SK',
    'SI',
    'ES',
    'SE',
    'HR',
];

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
