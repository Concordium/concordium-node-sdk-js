import { AttributeKey, AttributesKeys } from '.';
import { AgeProofInput } from './credentialDeploymentTransactions';

/**
 * Creates a credential for a new account, using the version 1 algorithm, which uses a seed to generate keys and commitments.
 */
export function createAgeProofV1(input: AgeProofInput): AgeProofOutput {
    const rawRequest = wasm.createAgeProof(JSON.stringify(input));
    let out: AgeProofOutput;
    try {
        out = JSON.parse(rawRequest);
    } catch (e) {
        throw new Error(rawRequest);
    }
    return out;
}

enum stateTypes {
    RevealAttribute = 'RevealAttribute',
    AttributeInSet = 'AttributeInSet',
    AttributeNotInSet = 'AttributeNotInSet',
    AttributeInRange = 'AttributeInRange',
}

type RevealStatement = {
    type: stateTypes.RevealAttribute;
    attributeTag: AttributeKey;
};

type MembershipStatement = {
    type: stateTypes.AttributeInSet;
    attributeTag: AttributeKey;
    set: string[];
};

type NonMembershipStatement = {
    type: stateTypes.AttributeNotInSet;
    attributeTag: AttributeKey;
    set: string[];
};

type RangeStatement = {
    type: stateTypes.AttributeInRange;
    attributeTag: AttributeKey;
    lower: string;
    upper: string;
};

type AtomicStatement =
    | RevealStatement
    | MembershipStatement
    | NonMembershipStatement
    | RangeStatement;
type IdStatement = AtomicStatement[];

const minYearMonth = '000001';

function getPastDate(yearsAgo: number) {
    const date = new Date();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = (date.getFullYear() - yearsAgo).toString();
    return year + month + day;
}

export class IdStatementBuilder {
    statements: IdStatement;

    constructor() {
        this.statements = [];
    }

    getStatement(): IdStatement {
        return statements;
    }

    addRangeProof(
        attribute: AttributesKeys,
        lower: string,
        upper: string
    ): IdStatementBuilder {
        this.statements.push({
            type: stateTypes.AttributeInRange,
            attributeTag: AttributesKeys[attribute],
            lower,
            upper,
        });
        return this;
    }

    addMembershipProof(
        attribute: AttributesKeys,
        set: string[]
    ): IdStatementBuilder {
        this.statements.push({
            type: stateTypes.AttributeInSet,
            attributeTag: AttributesKeys[attribute],
            set,
        });
        return this;
    }

    addNonMembershipProof(
        attribute: AttributesKeys,
        set: string[]
    ): IdStatementBuilder {
        this.statements.push({
            type: stateTypes.AttributeNotInSet,
            attributeTag: AttributesKeys[attribute],
            set,
        });
        return this;
    }

    revealAttribute(attribute: AttributesKeys): IdStatementBuilder {
        this.statements.push({
            type: stateTypes.RevealAttribute,
            attributeTag: AttributesKeys[attribute],
        });
        return this;
    }

    addMinimumAgeProof(age: number) {
        this.statements.push({
            type: stateTypes.AttributeInRange,
            attributeTag: AttributesKeys.dob,
            lower: minYearMonth,
            upper: getPastYearMonth(age),
        });
        return this;
    }
}

export type IdProofInput = {
    idObject: IdentityObjectV1;
    globalContext: CryptographicParameters;
    seedAsHex: string;
    net: Network;
    identityProviderIndex: number;
    identityIndex: number;
    credNumber: number;
    statement: IdStatement;
};

type RevealProof = {
    type: stateTypes.RevealAttribute;
    proof: string;
    attribute: string;
};

type ZKAtomicProof = {
    type: Exclude<stateTypes, stateTypes.RevealAttribute>;
    proof: string;
};

type AtomicProof = RevealProof | ZKAtomicProof;
type IdProof = AtomicProof[];

type IdProofOutput = {
    account: string;
    proofs: IdProof;
};

export function getIdProof(input: IdProofInput): IdProof {
    const rawRequest = wasm.createIdProof(JSON.stringify(input));
    let out: IdProof;
    try {
        out = JSON.parse(rawRequest);
    } catch (e) {
        throw new Error(rawRequest);
    }
    return out;
}
