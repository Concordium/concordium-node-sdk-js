import { whereAlpha2 } from 'iso-3166-1';

import { EU_MEMBERS, MAX_DATE, MIN_DATE, StatementTypes } from '../commonProofTypes.js';
import { AttributeKey, AttributeKeyString, AttributesKeys, IdDocType } from '../types.js';
import {
    AtomicStatement,
    IdStatement,
    MembershipStatement,
    NonMembershipStatement,
    RangeStatement,
} from './idProofTypes.js';

/**
 * Given a number x, return the date string for x years ago.
 * @param yearsAgo how many years to go back from today
 * @param daysOffset optional, how many days should be added to the current date
 * @returns YYYYMMDD for x years ago today in local time.
 */
export function getPastDate(yearsAgo: number, daysOffset = 0): string {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = (date.getFullYear() - yearsAgo).toString();
    return year + month + day;
}

interface StatementBuilder {
    addRange(attribute: AttributesKeys, lower: string, upper: string): IdStatementBuilder;

    addMembership(attribute: AttributesKeys, set: string[]): IdStatementBuilder;

    addNonMembership(attribute: AttributesKeys, set: string[]): IdStatementBuilder;
    revealAttribute(attribute: AttributesKeys): IdStatementBuilder;
    getStatement(): IdStatement;
}

/**
 * Converts the attribute value into the name string.
 */
function getAttributeString(key: AttributesKeys): AttributeKey {
    if (!(key in AttributesKeys)) {
        throw new Error('invalid attribute key');
    }
    return AttributesKeys[key] as AttributeKey;
}

function isISO8601(date: string): boolean {
    if (date.length !== 8) {
        return false;
    }
    if (!/^\d+$/.test(date)) {
        return false;
    }
    const month = Number(date.substring(4, 6));
    if (month < 1 || month > 12) {
        return false;
    }
    const day = Number(date.substring(6));
    if (day < 1 || day > 31) {
        return false;
    }
    return true;
}

function isISO3166_1Alpha2(code: string) {
    return Boolean(whereAlpha2(code)) && /^[A-Z][A-Z]$/.test(code);
}

/**
 * ISO3166-2 codes consist of a ISO3166_1Alpha2 code, then a dash, and then 1-3 alphanumerical characters
 */
function isISO3166_2(code: string) {
    return isISO3166_1Alpha2(code.substring(0, 2)) && /^\-([a-zA-Z0-9]){1,3}$/.test(code.substring(2));
}

function verifyRangeStatement(statement: RangeStatement) {
    if (statement.lower === undefined) {
        throw new Error('Range statements must contain a lower field');
    }
    if (statement.upper === undefined) {
        throw new Error('Range statements must contain an upper field');
    }
    if (statement.upper < statement.lower) {
        throw new Error('Upper bound must be greater than lower bound');
    }

    switch (statement.attributeTag) {
        case AttributeKeyString.dob:
        case AttributeKeyString.idDocIssuedAt:
        case AttributeKeyString.idDocExpiresAt: {
            if (!isISO8601(statement.lower)) {
                throw new Error(statement.attributeTag + ' lower range value must be YYYYMMDD');
            }
            if (!isISO8601(statement.upper)) {
                throw new Error(statement.attributeTag + ' upper range value must be YYYYMMDD');
            }
            break;
        }
        default:
            throw new Error(statement.attributeTag + ' is not allowed to be used in range statements');
    }
}

function verifySetStatement(statement: MembershipStatement | NonMembershipStatement, typeName: string) {
    if (statement.set === undefined) {
        throw new Error(typeName + 'statements must contain a lower field');
    }
    if (statement.set.length === 0) {
        throw new Error(typeName + ' statements may not use empty sets');
    }

    switch (statement.attributeTag) {
        case AttributeKeyString.countryOfResidence:
        case AttributeKeyString.nationality:
            if (!statement.set.every(isISO3166_1Alpha2)) {
                throw new Error(statement.attributeTag + ' values must be ISO3166-1 Alpha 2 codes in upper case');
            }
            break;
        case AttributeKeyString.idDocIssuer:
            if (!statement.set.every((x) => isISO3166_1Alpha2(x) || isISO3166_2(x))) {
                throw new Error('idDocIssuer must be ISO3166-1 Alpha 2  in upper case or ISO3166-2 codes');
            }
            break;
        case AttributeKeyString.idDocType:
            if (!statement.set.every((v) => Object.values(IdDocType).includes(v as IdDocType))) {
                throw new Error('idDocType values must be one from IdDocType enum');
            }
            break;
        case AttributeKeyString.legalCountry:
            if (!statement.set.every(isISO3166_1Alpha2)) {
                throw new Error(statement.attributeTag + ' values must be ISO3166-1 Alpha 2 codes in upper case');
            }
            break;
        default:
            throw new Error(statement.attributeTag + ' is not allowed to be used in ' + typeName + ' statements');
    }
}

function verifyAtomicStatement(statement: AtomicStatement, existingStatements: IdStatement) {
    if (statement.type === undefined) {
        throw new Error('Statements must contain a type field');
    }
    if (statement.attributeTag === undefined) {
        throw new Error('Statements must contain an attributeTag field');
    }
    if (!(statement.attributeTag in AttributeKeyString)) {
        throw new Error('Unknown attributeTag: ' + statement.attributeTag);
    }
    if (existingStatements.some((v) => v.attributeTag === statement.attributeTag)) {
        throw new Error('Only 1 statement is allowed for each attribute');
    }
    switch (statement.type) {
        case StatementTypes.AttributeInRange:
            return verifyRangeStatement(statement);
        case StatementTypes.AttributeInSet:
            return verifySetStatement(statement, 'membership');
        case StatementTypes.AttributeNotInSet:
            return verifySetStatement(statement, 'non-membership');
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
export function verifyIdstatement(statements: IdStatement): boolean {
    if (statements.length === 0) {
        throw new Error('Empty statements are not allowed');
    }
    const checkedStatements = [];
    for (const s of statements) {
        verifyAtomicStatement(s, checkedStatements);
        checkedStatements.push(s);
    }
    return true;
}

export class IdStatementBuilder implements StatementBuilder {
    statements: IdStatement;
    checkConstraints: boolean;

    constructor(checkConstraints = true) {
        this.statements = [];
        this.checkConstraints = checkConstraints;
    }

    /**
     * Outputs the built statement.
     */
    getStatement(): IdStatement {
        return this.statements;
    }

    /**
     * If checkConstraints is true, this checks whether the given statement may be added to the statement being built.
     * If the statement breaks any rules, this will throw an error.
     */
    private check(statement: AtomicStatement) {
        if (this.checkConstraints) {
            verifyAtomicStatement(statement, this.statements);
        }
    }

    /**
     * Add to the statement, that the given attribute should be in the given range, i.e. that lower <= attribute < upper.
     * @param attribute the attribute that should be checked
     * @param lower: the lower end of the range, inclusive.
     * @param upper: the upper end of the range, exclusive.
     * @returns the updated builder
     */
    addRange(
        // TODO: use an Enum with string values instead, maybe?
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

    /**
     * Add to the statement, that the given attribute should be one of the values in the given set.
     * @param attribute the attribute that should be checked
     * @param set: the set of values that the attribute must be included in.
     * @returns the updated builder
     */
    addMembership(attribute: AttributesKeys, set: string[]): IdStatementBuilder {
        const statement: AtomicStatement = {
            type: StatementTypes.AttributeInSet,
            attributeTag: getAttributeString(attribute),
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
    addNonMembership(attribute: AttributesKeys, set: string[]): IdStatementBuilder {
        const statement: AtomicStatement = {
            type: StatementTypes.AttributeNotInSet,
            attributeTag: getAttributeString(attribute),
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
    revealAttribute(attribute: AttributesKeys): IdStatementBuilder {
        const statement: AtomicStatement = {
            type: StatementTypes.RevealAttribute,
            attributeTag: getAttributeString(attribute),
        };
        this.check(statement);
        this.statements.push(statement);
        return this;
    }

    /**
     * Add to the statement that the age is at minimum the given value.
     * This adds a range statement that the date of birth is between 1st of january 1800 and <age> years ago.
     * @param age: the minimum age allowed.
     * @returns the updated builder
     */
    addMinimumAge(age: number): IdStatementBuilder {
        return this.addRange(AttributesKeys.dob, MIN_DATE, getPastDate(age, 1));
    }

    /**
     * Add to the statement that the age is at maximum the given value.
     * This adds a range statement that the date of birth is between <age + 1> years ago and 1st of january 9999.
     * @param age: the maximum age allowed.
     * @returns the updated builder
     */
    addMaximumAge(age: number): IdStatementBuilder {
        return this.addRange(AttributesKeys.dob, getPastDate(age + 1, 1), MAX_DATE);
    }

    /**
     * Add to the statement that the age is between two given ages.
     * This adds a range statement that the date of birth is between <maxAge> years ago and <minAge> years ago.
     * @param minAge: the maximum age allowed.
     * @param maxAge: the maximum age allowed.
     * @returns the updated builder
     */
    addAgeInRange(minAge: number, maxAge: number): IdStatementBuilder {
        return this.addRange(AttributesKeys.dob, getPastDate(maxAge + 1, 1), getPastDate(minAge));
    }

    /**
     * Add to the statement that the user's document expiry is atleast the given date.
     * This adds a range statement that the idDocExpiresAt is between the given date and 1st of january 9999 .
     * @param earliestDate: the earliest the document is allow to be expired at, should be a string in YYYYMMDD format.
     * @returns the updated builder
     */
    documentExpiryNoEarlierThan(earliestDate: string): IdStatementBuilder {
        return this.addRange(AttributesKeys.idDocExpiresAt, earliestDate, MAX_DATE);
    }

    /**
     * Add to the statement that the country of residence is one of the EU countries
     * @returns the updated builder
     */
    addEUResidency(): IdStatementBuilder {
        return this.addMembership(AttributesKeys.countryOfResidence, EU_MEMBERS);
    }

    /**
     * Add to the statement that the nationality is one of the EU countries
     * @returns the updated builder
     */
    addEUNationality(): IdStatementBuilder {
        return this.addMembership(AttributesKeys.nationality, EU_MEMBERS);
    }
}
