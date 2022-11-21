import * as wasm from '@concordium/rust-bindings';
import { AttributeKey, AttributesKeys } from '.';
import {
    AtomicStatement,
    IdProofInput,
    IdProofOutput,
    IdStatement,
    StatementTypes,
} from './idProofTypes';

const MIN_DATE = '00000101';
const EU_MEMBERS = [
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

interface StatementBuilder {
    addRangeProof(
        attribute: AttributesKeys,
        lower: string,
        upper: string
    ): IdStatementBuilder;

    addMembershipProof(
        attribute: AttributesKeys,
        set: string[]
    ): IdStatementBuilder;

    addNonMembershipProof(
        attribute: AttributesKeys,
        set: string[]
    ): IdStatementBuilder;
    revealAttribute(attribute: AttributesKeys): IdStatementBuilder;
    getStatement(): IdStatement;
}

function getAttributeString(key: AttributesKeys): AttributeKey {
    if (!(key in AttributesKeys)) {
        throw new Error('invalid attribute key');
    }
    return AttributesKeys[key] as AttributeKey;
}

export class IdStatementBuilder implements StatementBuilder {
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
            !attributesWithRange.includes(statement.attributeTag)
        ) {
            throw new Error(
                statement.attributeTag +
                    ' is not allowed to be used in range statements'
            );
        }
        if (
            statement.type === StatementTypes.AttributeInSet &&
            !attributesWithSet.includes(statement.attributeTag)
        ) {
            throw new Error(
                statement.attributeTag +
                    ' is not allowed to be used in membership statements'
            );
        }
        if (
            statement.type === StatementTypes.AttributeNotInSet &&
            !attributesWithSet.includes(statement.attributeTag)
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

    addMinimumAge(age: number) {
        return this.addRangeProof(
            AttributesKeys.dob,
            MIN_DATE,
            getPastDate(age)
        );
    }

    addEUResidency() {
        return this.addMembershipProof(
            AttributesKeys.countryOfResidence,
            EU_MEMBERS
        );
    }

    addEUNationality() {
        return this.addMembershipProof(AttributesKeys.nationality, EU_MEMBERS);
    }

    addEUDocumentIssuer() {
        return this.addMembershipProof(AttributesKeys.idDocIssuer, EU_MEMBERS);
    }
}

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
