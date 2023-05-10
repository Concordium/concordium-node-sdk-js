import { AttributesKeys, ContractAddress } from './types';
import {
    AtomicStatementV2,
    EU_MEMBERS,
    IdentityQualifier,
    IDENTITY_SUBJECT_SCHEMA,
    IdStatementV2,
    MAX_DATE,
    MembershipStatementV2,
    MIN_DATE,
    NonMembershipStatementV2,
    PropertyDetails,
    RangeStatementV2,
    StatementProverQualifier,
    StatementTypes,
    VerifiableCredentialQualifier,
    VerifiableCredentialSubject,
    StatementBuilder,
} from './idProofTypes';
import { getPastDate } from './idProofs';

function verifyRangeStatement(
    statement: RangeStatementV2,
    properties: PropertyDetails
) {
    if (statement.lower === undefined) {
        throw new Error('Range statements must contain a lower field');
    }
    if (statement.upper === undefined) {
        throw new Error('Range statements must contain an upper field');
    }
    if (properties.type === 'string') {
        if (typeof statement.lower != 'string') {
            throw new Error(
                properties.title +
                    ' is a string property and such the lower end of a range statements must be a string'
            );
        }
        if (typeof statement.upper != 'string') {
            throw new Error(
                properties.title +
                    ' is a string property and such the upper end of a range statements must be a string'
            );
        }
    }
    // TODO Check in case of number values

    if (statement.upper < statement.lower) {
        throw new Error('Upper bound must be greater than lower bound');
    }
}

function verifySetStatement(
    statement: MembershipStatementV2 | NonMembershipStatementV2,
    typeName: string,
    properties: PropertyDetails
) {
    if (statement.set === undefined) {
        throw new Error(typeName + 'statements must contain a lower field');
    }
    if (statement.set.length === 0) {
        throw new Error(typeName + ' statements may not use empty sets');
    }

    if (
        properties.type === 'string' &&
        !statement.set.every((value) => typeof value == 'string')
    ) {
        throw new Error(
            properties.title +
                ' is a string property and such the lower end of a range statements must be a string'
        );
    }
    // TODO Check in case of number values
}

function verifyAtomicStatement(
    statement: AtomicStatementV2,
    existingStatements: AtomicStatementV2[],
    schema: VerifiableCredentialSubject
) {
    if (statement.type === undefined) {
        throw new Error('Statements must contain a type field');
    }
    if (statement.attributeTag === undefined) {
        throw new Error('Statements must contain an attributeTag field');
    }
    if (
        existingStatements.some(
            (v) => v.attributeTag === statement.attributeTag
        )
    ) {
        throw new Error('Only 1 statement is allowed for each attribute');
    }

    if (
        !Object.values(schema.properties).some(
            (p) => Number(p.index) === statement.attributeTag
        )
    ) {
        throw new Error('Unknown attributeTag: ' + statement.attributeTag);
    }

    const properties = Object.values(schema.properties).find(
        (p) => Number(p.index) === statement.attributeTag
    );

    switch (statement.type) {
        case StatementTypes.AttributeInRange:
            return verifyRangeStatement(statement, properties);
        case StatementTypes.AttributeInSet:
            return verifySetStatement(statement, 'membership', properties);
        case StatementTypes.AttributeNotInSet:
            return verifySetStatement(statement, 'non-membership', properties);
        case StatementTypes.RevealAttribute:
            return;
        default:
            throw new Error(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                'Unknown statement type: ' + (statement as any).type
            );
    }
}

/**
 * Check that the Id statement is well formed and do not break any rules.
 * If it does not verify, this throw an error.
 */
export function verifyAtomicStatements(
    statements: AtomicStatementV2[],
    schema: VerifiableCredentialSubject
): boolean {
    if (statements.length === 0) {
        throw new Error('Empty statements are not allowed');
    }
    const checkedStatements = [];
    for (const s of statements) {
        verifyAtomicStatement(s, checkedStatements, schema);
        checkedStatements.push(s);
    }
    return true;
}

function getVerifiableCredentialQualifier(
    validContractAddresses: ContractAddress[]
): VerifiableCredentialQualifier {
    return {
        type: 'sci',
        issuers: validContractAddresses,
    };
}

function getIdentityQualifiervalidIdentityProviders(
    validIdentityProviders: number[]
): IdentityQualifier {
    return {
        type: 'cred',
        issuers: validIdentityProviders,
    };
}

export class AtomicStatementBuilder implements InternalBuilder {
    statements: AtomicStatementV2[];
    schema: VerifiableCredentialSubject | undefined;

    constructor(schema?: VerifiableCredentialSubject) {
        this.statements = [];
        this.schema = schema;
    }

    /**
     * Outputs the built statement.
     */
    getStatement(): AtomicStatementV2[] {
        return this.statements;
    }

    /**
     * If checkConstraints is true, this checks whether the given statement may be added to the statement being built.
     * If the statement breaks any rules, this will throw an error.
     */
    private check(statement: AtomicStatementV2) {
        if (this.schema) {
            verifyAtomicStatement(statement, this.statements, this.schema);
        }
    }

    /**
     * Add to the statement, that the given attribute should be in the given range, i.e. that lower <= attribute < upper.
     * @param attribute the attribute that should be checked
     * @param lower: the lower end of the range, inclusive.
     * @param upper: the upper end of the range, exclusive.
     * @returns the updated builder
     */
    addRange(attribute: number, lower: string, upper: string): this {
        const statement: AtomicStatementV2 = {
            type: StatementTypes.AttributeInRange,
            attributeTag: attribute,
            lower,
            upper,
        };
        this.check(statement);
        this.statements.push(statement);
        return this;
    }

    /**
     * Add to the statement, that the given attribute should be one of the values in the given set.
     * @param attribute the attribute that should be checked
     * @param set: the set of values that the attribute must be included in.
     * @returns the updated builder
     */
    addMembership(attribute: number, set: string[]): this {
        const statement: AtomicStatementV2 = {
            type: StatementTypes.AttributeInSet,
            attributeTag: attribute,
            set,
        };
        this.check(statement);
        this.statements.push(statement);
        return this;
    }

    /**
     * Add to the statement, that the given attribute should be one of the values in the given set.
     * @param attribute the attribute that should be checked
     * @param set: the set of values that the attribute must be included in.
     * @returns the updated builder
     */
    addNonMembership(attribute: number, set: string[]): this {
        const statement: AtomicStatementV2 = {
            type: StatementTypes.AttributeNotInSet,
            attributeTag: attribute,
            set,
        };
        this.check(statement);
        this.statements.push(statement);
        return this;
    }

    /**
     * Add to the statement, that the given attribute should be revealed.
     * The proof will contain the value.
     * @param attribute the attribute that should be revealed
     * @returns the updated builder
     */
    revealAttribute(attribute: number): this {
        const statement: AtomicStatementV2 = {
            type: StatementTypes.RevealAttribute,
            attributeTag: attribute,
        };
        this.check(statement);
        this.statements.push(statement);
        return this;
    }
}

export class IdentityStatementBuild extends AtomicStatementBuilder {
    /**
     * Add to the statement that the age is at minimum the given value.
     * This adds a range statement that the date of birth is between 1st of january 1800 and <age> years ago.
     * @param age: the minimum age allowed.
     * @returns the updated builder
     */
    addMinimumAge(age: number): AtomicStatementBuilder {
        return this.addRange(AttributesKeys.dob, MIN_DATE, getPastDate(age));
    }

    /**
     * Add to the statement that the age is at maximum the given value.
     * This adds a range statement that the date of birth is between <age + 1> years ago and 1st of january 9999.
     * @param age: the maximum age allowed.
     * @returns the updated builder
     */
    addMaximumAge(age: number): AtomicStatementBuilder {
        return this.addRange(
            AttributesKeys.dob,
            getPastDate(age + 1, 1),
            MAX_DATE
        );
    }

    /**
     * Add to the statement that the age is between two given ages.
     * This adds a range statement that the date of birth is between <maxAge> years ago and <minAge> years ago.
     * @param minAge: the maximum age allowed.
     * @param maxAge: the maximum age allowed.
     * @returns the updated builder
     */
    addAgeInRange(minAge: number, maxAge: number): AtomicStatementBuilder {
        return this.addRange(
            AttributesKeys.dob,
            getPastDate(maxAge + 1, 1),
            getPastDate(minAge)
        );
    }

    /**
     * Add to the statement that the user's document expiry is atleast the given date.
     * This adds a range statement that the idDocExpiresAt is between the given date and 1st of january 9999 .
     * @param earliestDate: the earliest the document is allow to be expired at, should be a string in YYYYMMDD format.
     * @returns the updated builder
     */
    documentExpiryNoEarlierThan(earliestDate: string): AtomicStatementBuilder {
        return this.addRange(
            AttributesKeys.idDocExpiresAt,
            earliestDate,
            MAX_DATE
        );
    }

    /**
     * Add to the statement that the country of residence is one of the EU countries
     * @returns the updated builder
     */
    addEUResidency(): AtomicStatementBuilder {
        return this.addMembership(
            AttributesKeys.countryOfResidence,
            EU_MEMBERS
        );
    }

    /**
     * Add to the statement that the nationality is one of the EU countries
     * @returns the updated builder
     */
    addEUNationality(): AtomicStatementBuilder {
        return this.addMembership(AttributesKeys.nationality, EU_MEMBERS);
    }
}

type InternalBuilder = StatementBuilder<string | bigint, number>;
export class Web3StatementBuilder {
    private statements: IdStatementV2 = [];

    private add(
        id: StatementProverQualifier,
        builderCallback: (builder: InternalBuilder) => void,
        schema?: VerifiableCredentialSubject
    ): this {
        const builder = new AtomicStatementBuilder(schema);
        builderCallback(builder);
        this.statements.push({ id, statement: builder.getStatement() });
        return this;
    }

    addForVerifiableCredentials(
        validContractAddresses: ContractAddress[],
        builderCallback: (builder: InternalBuilder) => void,
        schema?: VerifiableCredentialSubject
    ): this {
        return this.add(
            getVerifiableCredentialQualifier(validContractAddresses),
            builderCallback,
            schema
        );
    }

    addForIdentityCredentials(
        validIdentityProviders: number[],
        builderCallback: (builder: InternalBuilder) => void
    ): this {
        return this.add(
            getIdentityQualifiervalidIdentityProviders(validIdentityProviders),
            builderCallback,
            IDENTITY_SUBJECT_SCHEMA
        );
    }

    getStatements(): IdStatementV2 {
        return this.statements;
    }
}
