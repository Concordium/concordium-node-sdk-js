import {
    AttributeKey,
    CryptographicParameters,
    IdentityObjectV1,
    Network,
    Versioned,
} from '.';
import {
    GenericAtomicStatement,
    GenericMembershipStatement,
    GenericNonMembershipStatement,
    GenericRangeStatement,
    GenericRevealStatement,
    StatementTypes,
} from './CommonProofTypes';

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

export type AtomicStatement = GenericAtomicStatement<AttributeKey, string>;
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
