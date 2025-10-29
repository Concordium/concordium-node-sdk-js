export interface StatementBuilder<ValueType, AttributeType> {
    addRange(attribute: AttributeType, lower: ValueType, upper: ValueType): this;

    addMembership(attribute: AttributeType, set: ValueType[]): this;

    addNonMembership(attribute: AttributeType, set: ValueType[]): this;
    revealAttribute(attribute: AttributeType): this;
    getStatement(): GenericAtomicStatement<AttributeType, ValueType>[];
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

export enum StatementTypes {
    RevealAttribute = 'RevealAttribute',
    AttributeInSet = 'AttributeInSet',
    AttributeNotInSet = 'AttributeNotInSet',
    AttributeInRange = 'AttributeInRange',
}

type LaxStringEnum<E extends string> = `${E}`;

export type GenericRevealStatement<TagType> = {
    type: LaxStringEnum<StatementTypes.RevealAttribute>;
    attributeTag: TagType;
};

export type GenericMembershipStatement<TagType, ValueType> = {
    type: LaxStringEnum<StatementTypes.AttributeInSet>;
    attributeTag: TagType;
    set: ValueType[];
};

export type GenericNonMembershipStatement<TagType, ValueType> = {
    type: LaxStringEnum<StatementTypes.AttributeNotInSet>;
    attributeTag: TagType;
    set: ValueType[];
};

export type GenericRangeStatement<TagType, ValueType> = {
    type: LaxStringEnum<StatementTypes.AttributeInRange>;
    attributeTag: TagType;
    lower: ValueType;
    upper: ValueType;
};

export type GenericAtomicStatement<TagType, ValueType> =
    | GenericRevealStatement<TagType>
    | GenericMembershipStatement<TagType, ValueType>
    | GenericNonMembershipStatement<TagType, ValueType>
    | GenericRangeStatement<TagType, ValueType>;

export type RevealProof<ValueType> = {
    type: StatementTypes.RevealAttribute;
    proof: string;
    attribute: ValueType;
};

// Type for proofs that do not have additional fields
export type GenericAtomicProof = {
    type: Exclude<StatementTypes, StatementTypes.RevealAttribute>;
    proof: string;
};

export type AtomicProof<ValueType> = RevealProof<ValueType> | GenericAtomicProof;
