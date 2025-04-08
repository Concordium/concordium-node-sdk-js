import { Buffer } from 'buffer/index.js';

import { EU_MEMBERS, MAX_DATE, MIN_DATE, StatementBuilder, StatementTypes } from '../commonProofTypes.js';
import { MAX_U64 } from '../constants.js';
import { getPastDate } from '../id/idProofs.js';
import { AttributeKey, AttributeKeyString, AttributeList, AttributesKeys, HexString, Network } from '../types.js';
import type * as ContractAddress from '../types/ContractAddress.js';
import { ConcordiumHdWallet } from '../wasm/HdWallet.js';
import {
    compareStringAttributes,
    isStringAttributeInRange,
    statementAttributeTypeToAttributeType,
    timestampToDate,
} from './helpers.js';
import {
    AccountCommitmentInput,
    AtomicStatementV2,
    AttributeType,
    CredentialSchemaProperty,
    CredentialSchemaSubject,
    CredentialStatement,
    CredentialStatements,
    CredentialSubject,
    IDENTITY_SUBJECT_SCHEMA,
    IdentityQualifier,
    MembershipStatementV2,
    NonMembershipStatementV2,
    RangeStatementV2,
    StatementAttributeType,
    StatementProverQualifier,
    VerifiableCredentialQualifier,
    Web3IssuerCommitmentInput,
    isTimestampAttribute,
} from './types.js';

export const MAX_STRING_BYTE_LENGTH = 31;
export const MIN_DATE_ISO = '-262144-01-01T00:00:00Z';
export const MAX_DATE_ISO = '+262143-12-31T23:59:59.999999999Z';
export const MIN_DATE_TIMESTAMP = Date.parse(MIN_DATE_ISO);
export const MAX_DATE_TIMESTAMP = Date.parse(MAX_DATE_ISO);

const TIMESTAMP_VALID_VALUES = MIN_DATE_ISO + 'to ' + MAX_DATE_ISO;
const STRING_VALID_VALUES = '0 to ' + MAX_STRING_BYTE_LENGTH + ' bytes as UTF-8';
const INTEGER_VALID_VALUES = '0 to ' + MAX_U64;

const throwRangeError = (title: string, property: string, end: string, mustBe: string, validRange: string) => {
    throw new Error(
        title +
            ' is a ' +
            property +
            ' property and therefore the ' +
            end +
            ' end of a range statement must be a ' +
            mustBe +
            ' in the range of ' +
            validRange
    );
};
const throwSetError = (title: string, property: string, mustBe: string, validRange: string) => {
    throw new Error(
        title +
            ' is a ' +
            property +
            ' property and therefore the members of a set statement must be ' +
            mustBe +
            ' in the range of ' +
            validRange
    );
};

function isTimestampAttributeSchemaProperty(properties?: CredentialSchemaProperty) {
    return properties && properties.type === 'object' && properties.properties.type.const === 'date-time';
}

function isValidStringAttribute(attributeValue: string): boolean {
    return Buffer.from(attributeValue, 'utf-8').length <= MAX_STRING_BYTE_LENGTH;
}

function isValidIntegerAttribute(attributeValue: bigint) {
    return attributeValue >= 0 && attributeValue <= MAX_U64;
}

function isValidTimestampAttribute(attributeValue: Date) {
    return attributeValue.getTime() >= MIN_DATE_TIMESTAMP && attributeValue.getTime() <= MAX_DATE_TIMESTAMP;
}

function validateTimestampAttribute(value: AttributeType) {
    return isTimestampAttribute(value) && isValidTimestampAttribute(timestampToDate(value));
}

function validateStringAttribute(value: AttributeType) {
    return typeof value === 'string' && isValidStringAttribute(value);
}

function validateIntegerAttribute(value: AttributeType) {
    return typeof value === 'bigint' && isValidIntegerAttribute(value);
}

function verifyRangeStatement(statement: RangeStatementV2, properties?: CredentialSchemaProperty) {
    if (statement.lower === undefined) {
        throw new Error('Range statements must contain a lower field');
    }
    if (statement.upper === undefined) {
        throw new Error('Range statements must contain an upper field');
    }

    if (properties) {
        const checkRange = (
            typeName: string,
            validate: (a: AttributeType) => boolean,
            typeString: string,
            validRange: string
        ) => {
            if (!validate(statement.lower)) {
                throwRangeError(properties.title, typeName, 'lower', typeString, validRange);
            }
            if (!validate(statement.upper)) {
                throwRangeError(properties.title, typeName, 'upper', typeString, validRange);
            }
        };

        if (isTimestampAttributeSchemaProperty(properties)) {
            checkRange('timestamp', validateTimestampAttribute, 'Date', TIMESTAMP_VALID_VALUES);
        } else if (properties.type === 'string') {
            checkRange('string', validateStringAttribute, 'string', STRING_VALID_VALUES);
        } else if (properties.type === 'integer') {
            checkRange('integer', validateIntegerAttribute, 'bigint', INTEGER_VALID_VALUES);
        }
    }

    // The assertions are safe, because we already validated that lower/upper has the correct types.
    if (
        (properties?.type === 'integer' && statement.upper < statement.lower) ||
        (isTimestampAttributeSchemaProperty(properties) &&
            isTimestampAttribute(statement.lower) &&
            isTimestampAttribute(statement.upper) &&
            timestampToDate(statement.upper).getTime() < timestampToDate(statement.lower).getTime()) ||
        (properties?.type === 'string' &&
            compareStringAttributes(statement.lower as string, statement.upper as string) > 0)
    ) {
        throw new Error('Upper bound must be greater than lower bound');
    }
}

function verifySetStatement(
    statement: MembershipStatementV2 | NonMembershipStatementV2,
    statementTypeName: string,
    properties?: CredentialSchemaProperty
) {
    if (statement.set === undefined) {
        throw new Error(statementTypeName + 'statements must contain a set field');
    }
    if (statement.set.length === 0) {
        throw new Error(statementTypeName + ' statements may not use empty sets');
    }

    if (properties) {
        const checkSet = (
            typeName: string,
            validate: (a: AttributeType) => boolean,
            typeString: string,
            validValues: string
        ) => {
            if (!statement.set.every(validate)) {
                throwSetError(properties.title, typeName, typeString, validValues);
            }
        };

        if (isTimestampAttributeSchemaProperty(properties)) {
            checkSet('date-time', validateTimestampAttribute, 'Date', TIMESTAMP_VALID_VALUES);
        } else if (properties.type === 'string') {
            checkSet('string', validateStringAttribute, 'string', STRING_VALID_VALUES);
        } else if (properties.type === 'integer') {
            checkSet('integer', validateIntegerAttribute, 'bigint', INTEGER_VALID_VALUES);
        }
    }
}

function verifyAtomicStatement(statement: AtomicStatementV2, schema?: CredentialSchemaSubject) {
    if (statement.type === undefined) {
        throw new Error('Statements must contain a type field');
    }
    if (statement.attributeTag === undefined) {
        throw new Error('Statements must contain an attributeTag field');
    }

    if (schema && !Object.keys(schema.properties.attributes.properties).includes(statement.attributeTag)) {
        throw new Error('Unknown attributeTag: ' + statement.attributeTag);
    }

    const property = schema && schema.properties.attributes.properties[statement.attributeTag];

    switch (statement.type) {
        case StatementTypes.AttributeInRange:
            return verifyRangeStatement(statement, property);
        case StatementTypes.AttributeInSet:
            return verifySetStatement(statement, 'membership', property);
        case StatementTypes.AttributeNotInSet:
            return verifySetStatement(statement, 'non-membership', property);
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
 * Verify that the atomicStatement is valid, and check it doesn't break any "composite" rules in the context of the existing statements.
 */
function verifyAtomicStatementInContext(
    statement: AtomicStatementV2,
    existingStatements: AtomicStatementV2[],
    schema?: CredentialSchemaSubject
) {
    verifyAtomicStatement(statement, schema);
    if (existingStatements.some((v) => v.attributeTag === statement.attributeTag)) {
        throw new Error('Only 1 statement is allowed for each attribute');
    }
}

/**
 * Check that the given atomic statements are well formed and do not break any rules.
 * If they do not verify, this throw an error.
 */
export function verifyAtomicStatements(statements: AtomicStatementV2[], schema?: CredentialSchemaSubject): boolean {
    if (statements.length === 0) {
        throw new Error('Empty statements are not allowed');
    }
    const checkedStatements: AtomicStatementV2[] = [];
    for (const s of statements) {
        verifyAtomicStatementInContext(s, checkedStatements, schema);
        checkedStatements.push(s);
    }
    return true;
}

function getWeb3IdCredentialQualifier(validContractAddresses: ContractAddress.Type[]): VerifiableCredentialQualifier {
    return {
        type: 'sci',
        issuers: validContractAddresses,
    };
}

function getAccountCredentialQualifier(validIdentityProviders: number[]): IdentityQualifier {
    return {
        type: 'cred',
        issuers: validIdentityProviders,
    };
}

export class AtomicStatementBuilder implements InternalBuilder {
    statements: AtomicStatementV2[];
    schema: CredentialSchemaSubject | undefined;

    constructor(schema?: CredentialSchemaSubject) {
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
     * This checks whether the given statement may be added to the statement being built.
     * If the statement breaks any rules, this will throw an error.
     */
    private check(statement: AtomicStatementV2) {
        if (this.schema) {
            verifyAtomicStatementInContext(statement, this.statements, this.schema);
        }
    }

    /**
     * Add to the statement, that the given attribute should be in the given range, i.e. that lower <= attribute < upper.
     * @param attribute the attribute that should be checked
     * @param lower: the lower end of the range, inclusive.
     * @param upper: the upper end of the range, exclusive.
     * @returns the updated builder
     */
    addRange(attribute: string, lower: StatementAttributeType, upper: StatementAttributeType): this {
        const statement: AtomicStatementV2 = {
            type: StatementTypes.AttributeInRange,
            attributeTag: attribute,
            lower: statementAttributeTypeToAttributeType(lower),
            upper: statementAttributeTypeToAttributeType(upper),
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
    addMembership(attribute: string, set: StatementAttributeType[]): this {
        const statement: AtomicStatementV2 = {
            type: StatementTypes.AttributeInSet,
            attributeTag: attribute,
            set: set.map(statementAttributeTypeToAttributeType),
        };
        this.check(statement);
        this.statements.push(statement);
        return this;
    }

    /**
     * Add to the statement, that the given attribute should _not_ be one of the values in the given set.
     * @param attribute the attribute that should be checked
     * @param set: the set of values that the attribute must be included in.
     * @returns the updated builder
     */
    addNonMembership(attribute: string, set: StatementAttributeType[]): this {
        const statement: AtomicStatementV2 = {
            type: StatementTypes.AttributeNotInSet,
            attributeTag: attribute,
            set: set.map(statementAttributeTypeToAttributeType),
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
    revealAttribute(attribute: string): this {
        const statement: AtomicStatementV2 = {
            type: StatementTypes.RevealAttribute,
            attributeTag: attribute,
        };
        this.check(statement);
        this.statements.push(statement);
        return this;
    }
}

export class AccountStatementBuild extends AtomicStatementBuilder {
    /**
     * Add to the statement that the age is at minimum the given value.
     * This adds a range statement that the date of birth is between 1st of january 1800 and <age> years ago.
     * @param age: the minimum age allowed.
     * @returns the updated builder
     */
    addMinimumAge(age: number): AtomicStatementBuilder {
        return this.addRange(AttributeKeyString.dob, MIN_DATE, getPastDate(age, 1));
    }

    /**
     * Add to the statement that the age is at maximum the given value.
     * This adds a range statement that the date of birth is between <age + 1> years ago and 1st of january 9999.
     * @param age: the maximum age allowed.
     * @returns the updated builder
     */
    addMaximumAge(age: number): AtomicStatementBuilder {
        return this.addRange(AttributeKeyString.dob, getPastDate(age + 1, 1), MAX_DATE);
    }

    /**
     * Add to the statement that the age is between two given ages.
     * This adds a range statement that the date of birth is between <maxAge> years ago and <minAge> years ago.
     * @param minAge: the maximum age allowed.
     * @param maxAge: the maximum age allowed.
     * @returns the updated builder
     */
    addAgeInRange(minAge: number, maxAge: number): AtomicStatementBuilder {
        return this.addRange(AttributeKeyString.dob, getPastDate(maxAge + 1, 1), getPastDate(minAge));
    }

    /**
     * Add to the statement that the user's document expiry is atleast the given date.
     * This adds a range statement that the idDocExpiresAt is between the given date and 1st of january 9999 .
     * @param earliestDate: the earliest the document is allow to be expired at, should be a string in YYYYMMDD format.
     * @returns the updated builder
     */
    documentExpiryNoEarlierThan(earliestDate: string): AtomicStatementBuilder {
        return this.addRange(AttributeKeyString.idDocExpiresAt, earliestDate, MAX_DATE);
    }

    /**
     * Add to the statement that the country of residence is one of the EU countries
     * @returns the updated builder
     */
    addEUResidency(): AtomicStatementBuilder {
        return this.addMembership(AttributeKeyString.countryOfResidence, EU_MEMBERS);
    }

    /**
     * Add to the statement that the nationality is one of the EU countries
     * @returns the updated builder
     */
    addEUNationality(): AtomicStatementBuilder {
        return this.addMembership(AttributeKeyString.nationality, EU_MEMBERS);
    }
}

type InternalBuilder = StatementBuilder<StatementAttributeType, string>;
export class Web3StatementBuilder {
    private statements: CredentialStatements = [];

    private add(
        idQualifier: StatementProverQualifier,
        builderCallback: (builder: InternalBuilder) => void,
        schema?: CredentialSchemaSubject
    ): this {
        const builder = new AtomicStatementBuilder(schema);
        builderCallback(builder);
        this.statements.push({
            idQualifier,
            statement: builder.getStatement(),
        });
        return this;
    }

    addForVerifiableCredentials(
        validContractAddresses: ContractAddress.Type[],
        builderCallback: (builder: InternalBuilder) => void,
        schema?: CredentialSchemaSubject
    ): this {
        return this.add(getWeb3IdCredentialQualifier(validContractAddresses), builderCallback, schema);
    }

    addForIdentityCredentials(
        validIdentityProviders: number[],
        builderCallback: (builder: InternalBuilder) => void
    ): this {
        return this.add(
            getAccountCredentialQualifier(validIdentityProviders),
            builderCallback,
            IDENTITY_SUBJECT_SCHEMA
        );
    }

    getStatements(): CredentialStatements {
        return this.statements;
    }
}

/**
 * Create a DID string for a web3id credential. Used to build a request for a verifiable credential.
 */
export function createWeb3IdDID(network: Network, publicKey: string, index: bigint, subindex: bigint): string {
    return (
        'did:ccd:' +
        network.toLowerCase() +
        ':sci:' +
        index.toString() +
        ':' +
        subindex.toString() +
        '/credentialEntry/' +
        publicKey
    );
}

/**
 * Create a DID string for a web3id credential. Used to build a request for a verifiable credential.
 */
export function createAccountDID(network: Network, credId: string): string {
    return 'did:ccd:' + network.toLowerCase() + ':cred:' + credId;
}

/**
 * Create the commitment input required to create a proof for the given statements, using an account credential.
 */
export function createAccountCommitmentInput(
    statements: AtomicStatementV2[],
    identityProvider: number,
    attributes: AttributeList,
    randomness: Record<number, string>
): AccountCommitmentInput {
    return {
        type: 'account',
        issuer: identityProvider,
        values: statements.reduce<Record<string, string>>((acc, x) => {
            const attr = attributes.chosenAttributes[x.attributeTag as AttributeKey];
            if (attr !== undefined) {
                acc[x.attributeTag] = attr;
            }

            return acc;
        }, {}),
        randomness,
    };
}

/**
 * Create the commitment input required to create a proof for the given statements, using an account credential.
 * Uses a ConcordiumHdWallet to get randomness needed.
 */
export function createAccountCommitmentInputWithHdWallet(
    statements: AtomicStatementV2[],
    identityProvider: number,
    attributes: AttributeList,
    wallet: ConcordiumHdWallet,
    identityIndex: number,
    credIndex: number
): AccountCommitmentInput {
    const randomness = statements.reduce<Record<string, string>>((acc, x) => {
        acc[x.attributeTag] = wallet
            .getAttributeCommitmentRandomness(
                identityProvider,
                identityIndex,
                credIndex,
                AttributesKeys[x.attributeTag as AttributeKey]
            )
            .toString('hex');
        return acc;
    }, {});
    return createAccountCommitmentInput(statements, identityProvider, attributes, randomness);
}

/**
 * Create the commitment input required to create a proof for the given statements, using an web3Id credential.
 */
export function createWeb3CommitmentInput(
    verifiableCredentialPrivateKey: HexString,
    credentialSubject: CredentialSubject,
    randomness: Record<string, string>,
    signature: string
): Web3IssuerCommitmentInput {
    return {
        type: 'web3Issuer',
        signer: verifiableCredentialPrivateKey,
        values: credentialSubject.attributes,
        randomness,
        signature,
    };
}

/**
 * Create the commitment input required to create a proof for the given statements, using an web3Id credential.
 * Uses a ConcordiumHdWallet to supply the public key and the signing key of the credential.
 */
export function createWeb3CommitmentInputWithHdWallet(
    wallet: ConcordiumHdWallet,
    issuer: ContractAddress.Type,
    credentialIndex: number,
    credentialSubject: CredentialSubject,
    randomness: Record<string, string>,
    signature: string
): Web3IssuerCommitmentInput {
    return createWeb3CommitmentInput(
        wallet.getVerifiableCredentialSigningKey(issuer, credentialIndex).toString('hex'),
        credentialSubject,
        randomness,
        signature
    );
}

/**
 * Helper to check if an attribute value is in the given range.
 */
function isInRange(value: AttributeType, lower: AttributeType, upper: AttributeType) {
    if (typeof value === 'string' && typeof lower === 'string' && typeof upper === 'string') {
        return isStringAttributeInRange(value, lower, upper);
    }
    if (typeof value === 'bigint' && typeof lower === 'bigint' && typeof upper === 'bigint') {
        return lower <= value && upper > value;
    }
    if (isTimestampAttribute(value) && isTimestampAttribute(lower) && isTimestampAttribute(upper)) {
        return (
            timestampToDate(lower).getTime() <= timestampToDate(value).getTime() &&
            timestampToDate(upper).getTime() > timestampToDate(value).getTime()
        );
    }
    // Mismatch in types.
    return false;
}

/**
 * Helper to check if an attribute value is in the given set.
 */
function isInSet(value: AttributeType, set: AttributeType[]) {
    if (typeof value === 'string' || typeof value === 'bigint') {
        return set.includes(value);
    }
    if (isTimestampAttribute(value)) {
        return set
            .map((timestamp) => (isTimestampAttribute(timestamp) ? timestampToDate(timestamp).getTime() : undefined))
            .includes(timestampToDate(value).getTime());
    }
    return false;
}

/**
 * Given an atomic statement and a prover's attributes, determine whether the statement is fulfilled.
 */
export function canProveAtomicStatement(
    statement: AtomicStatementV2,
    attributes: Record<string, AttributeType>
): boolean {
    const attribute = attributes[statement.attributeTag];

    if (attribute === undefined) {
        return false;
    }

    switch (statement.type) {
        case StatementTypes.AttributeInRange:
            return isInRange(attribute, statement.lower, statement.upper);
        case StatementTypes.AttributeInSet:
            return isInSet(attribute, statement.set);
        case StatementTypes.AttributeNotInSet:
            return !isInSet(attribute, statement.set);
        case StatementTypes.RevealAttribute:
            return attribute !== undefined;
        default:
            throw new Error('Statement type of ' + statement.type + ' is not supported');
    }
}

/**
 * Given a credential statement and a prover's attributes, determine whether the statements are fulfilled.
 */
export function canProveCredentialStatement(
    credentialStatement: CredentialStatement,
    attributes: Record<string, AttributeType>
): boolean {
    return credentialStatement.statement.every((statement) => canProveAtomicStatement(statement, attributes));
}
