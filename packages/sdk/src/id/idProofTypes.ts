import type {
    AtomicProof,
    GenericAtomicStatement,
    GenericMembershipStatement,
    GenericNonMembershipStatement,
    GenericRangeStatement,
    GenericRevealStatement,
} from '../commonProofTypes.js';
import type { AttributeKey, CryptographicParameters, IdentityObjectV1, Network, Versioned } from '../types.js';

export type RangeStatement = GenericRangeStatement<AttributeKey, string>;
export type NonMembershipStatement = GenericNonMembershipStatement<AttributeKey, string>;
export type MembershipStatement = GenericMembershipStatement<AttributeKey, string>;
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

export type IdProof = {
    proofs: AtomicProof<string>[];
};

export type IdProofOutput = {
    credential: string;
    proof: Versioned<IdProof>;
};

/**
 * The attributes that can be used for range statements
 */
export const attributesWithRange: AttributeKey[] = ['dob', 'idDocIssuedAt', 'idDocExpiresAt'];

/**
 * The attributes that can be used for (non)membership statements
 */
export const attributesWithSet: AttributeKey[] = [
    'countryOfResidence',
    'nationality',
    'idDocType',
    'idDocIssuer',
    'legalCountry',
];
