import * as wasm from '@concordium/rust-bindings';
import {
    AttributeKey,
    AttributesKeys,
    CryptographicParameters,
    IdentityObjectV1,
    Network,
} from '.';

enum StatementTypes {
    RevealAttribute = 'RevealAttribute',
    AttributeInSet = 'AttributeInSet',
    AttributeNotInSet = 'AttributeNotInSet',
    AttributeInRange = 'AttributeInRange',
}

type RevealStatement = {
    type: StatementTypes.RevealAttribute;
    attributeTag: AttributeKey;
};

type MembershipStatement = {
    type: StatementTypes.AttributeInSet;
    attributeTag: AttributeKey;
    set: string[];
};

type NonMembershipStatement = {
    type: StatementTypes.AttributeNotInSet;
    attributeTag: AttributeKey;
    set: string[];
};

type RangeStatement = {
    type: StatementTypes.AttributeInRange;
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

const minYearMonth = '00000101';

function getPastDate(yearsAgo: number) {
    const date = new Date();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = (date.getFullYear() - yearsAgo).toString();
    return year + month + day;
}

const attributesWithRange: AttributeKey[] = [
    'dob',
    'idDocIssuedAt',
    'idDocExpiresAt',
];
const attributesWithSet: AttributeKey[] = [
    'countryOfResidence',
    'nationality',
    'idDocType',
    'idDocIssuer',
];

function getAttributeString(key: AttributesKeys): AttributeKey {
    if (!(key in AttributesKeys)) {
        throw new Error('invalid attribute key');
    }
    return AttributesKeys[key] as AttributeKey;
}

export class IdStatementBuilder {
    statements: IdStatement;
    checkConstraints: boolean;

    constructor(checkConstraints: boolean) {
        this.statements = [];
        this.checkConstraints = checkConstraints;
    }

    getStatement(): IdStatement {
        return this.statements;
    }

    check(statement: AtomicStatement) {
        if (
            this.statements.some(
                (v) => v.attributeTag === statement.attributeTag
            )
        ) {
            throw new Error('Only 1 statement is allowed for each attribute');
        }
        if (
            statement.type === StatementTypes.AttributeInRange &&
            attributesWithRange.includes(statement.attributeTag)
        ) {
            throw new Error(
                statement.attributeTag +
                    ' is not allowed to be used in range statements'
            );
        }
        if (
            statement.type === StatementTypes.AttributeInSet &&
            attributesWithSet.includes(statement.attributeTag)
        ) {
            throw new Error(
                statement.attributeTag +
                    ' is not allowed to be used in membership statements'
            );
        }
        if (
            statement.type === StatementTypes.AttributeNotInSet &&
            attributesWithSet.includes(statement.attributeTag)
        ) {
            throw new Error(
                statement.attributeTag +
                    ' is not allowed to be used in non-membership statements'
            );
        }
    }

    addRangeProof(
        attribute: AttributesKeys,
        lower: string,
        upper: string
    ): IdStatementBuilder {
        const statement: AtomicStatement = {
            type: StatementTypes.AttributeInRange,
            attributeTag: getAttributeString(attribute),
            lower,
            upper,
        };
        this.check(statement);
        this.statements.push(statement);
        return this;
    }

    addMembershipProof(
        attribute: AttributesKeys,
        set: string[]
    ): IdStatementBuilder {
        const statement: AtomicStatement = {
            type: StatementTypes.AttributeInSet,
            attributeTag: getAttributeString(attribute),
            set,
        };
        this.check(statement);
        this.statements.push(statement);
        return this;
    }

    addNonMembershipProof(
        attribute: AttributesKeys,
        set: string[]
    ): IdStatementBuilder {
        const statement: AtomicStatement = {
            type: StatementTypes.AttributeNotInSet,
            attributeTag: getAttributeString(attribute),
            set,
        };
        this.check(statement);
        this.statements.push(statement);
        return this;
    }

    revealAttribute(attribute: AttributesKeys): IdStatementBuilder {
        const statement: AtomicStatement = {
            type: StatementTypes.RevealAttribute,
            attributeTag: getAttributeString(attribute),
        };
        this.check(statement);
        this.statements.push(statement);
        return this;
    }

    addMinimumAgeProof(age: number) {
        return this.addRangeProof(
            AttributesKeys.dob,
            minYearMonth,
            getPastDate(age)
        );
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
    type: StatementTypes.RevealAttribute;
    proof: string;
    attribute: string;
};

type ZKAtomicProof = {
    type: Exclude<StatementTypes, StatementTypes.RevealAttribute>;
    proof: string;
};

type AtomicProof = RevealProof | ZKAtomicProof;
type IdProof = AtomicProof[];

type IdProofOutput = {
    account: string;
    proof: IdProof;
};

export function getIdProof(input: IdProofInput): IdProofOutput {
    const rawRequest = wasm.createIdProof(JSON.stringify(input));
    let out: IdProofOutput;
    try {
        out = JSON.parse(rawRequest);
    } catch (e) {
        throw new Error(rawRequest);
    }
    return out;
}
