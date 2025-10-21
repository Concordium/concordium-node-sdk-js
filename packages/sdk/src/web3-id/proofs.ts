import { Buffer } from 'buffer/index.js';

import { EU_MEMBERS, MAX_DATE, MIN_DATE, StatementBuilder, StatementTypes } from '../commonProofTypes.js';
import { MAX_U64 } from '../constants.js';
import { getPastDate } from '../id/idProofs.js';
import {
    AttributeKey,
    AttributeKeyString,
    AttributeList,
    AttributesKeys,
    HexString,
    IdentityObjectV1,
    IdentityProvider,
    Network,
    Policy,
} from '../types.js';
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
    AccountCredentialQualifier,
    AccountCredentialStatement,
    AtomicStatementV2,
    AttributeType,
    CredentialSchemaProperty,
    CredentialSchemaSubject,
    CredentialStatement,
    CredentialStatements,
    CredentialSubject,
    DIDString,
    IDENTITY_SUBJECT_SCHEMA,
    IdObjectUseData,
    IdentityCommitmentInput,
    IdentityCredentialQualifier,
    IdentityCredentialStatement,
    MembershipStatementV2,
    NonMembershipStatementV2,
    RangeStatementV2,
    StatementAttributeType,
    Web3IdCredentialQualifier,
    Web3IssuerCommitmentInput,
    isTimestampAttribute,
} from './types.js';

/** Maximum byte length allowed for string attributes. */
export const MAX_STRING_BYTE_LENGTH = 31;
/** Minimum date in ISO format supported by the system. */
export const MIN_DATE_ISO = '-262144-01-01T00:00:00Z';
/** Maximum date in ISO format supported by the system. */
export const MAX_DATE_ISO = '+262143-12-31T23:59:59.999999999Z';
/** Minimum date timestamp value supported by the system. */
export const MIN_DATE_TIMESTAMP = Date.parse(MIN_DATE_ISO);
/** Maximum date timestamp value supported by the system. */
export const MAX_DATE_TIMESTAMP = Date.parse(MAX_DATE_ISO);

/** Valid timestamp range string for error messages. */
const TIMESTAMP_VALID_VALUES = MIN_DATE_ISO + 'to ' + MAX_DATE_ISO;
/** Valid string range description for error messages. */
const STRING_VALID_VALUES = '0 to ' + MAX_STRING_BYTE_LENGTH + ' bytes as UTF-8';
/** Valid integer range description for error messages. */
const INTEGER_VALID_VALUES = '0 to ' + MAX_U64;

/** Throws a standardized range error for statement validation. */
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
/** Throws a standardized set error for statement validation. */
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

/** Checks if a credential schema property represents a timestamp attribute. */
function isTimestampAttributeSchemaProperty(properties?: CredentialSchemaProperty) {
    return properties && properties.type === 'object' && properties.properties.type.const === 'date-time';
}

/** Validates that a string attribute value is within allowed byte length. */
function isValidStringAttribute(attributeValue: string): boolean {
    return Buffer.from(attributeValue, 'utf-8').length <= MAX_STRING_BYTE_LENGTH;
}

/** Validates that an integer attribute value is within allowed range. */
function isValidIntegerAttribute(attributeValue: bigint) {
    return attributeValue >= 0 && attributeValue <= MAX_U64;
}

/** Validates that a timestamp attribute value is within allowed date range. */
function isValidTimestampAttribute(attributeValue: Date) {
    return attributeValue.getTime() >= MIN_DATE_TIMESTAMP && attributeValue.getTime() <= MAX_DATE_TIMESTAMP;
}

/** Validates a timestamp attribute type and value. */
function validateTimestampAttribute(value: AttributeType) {
    return isTimestampAttribute(value) && isValidTimestampAttribute(timestampToDate(value));
}

/** Validates a string attribute type and value. */
function validateStringAttribute(value: AttributeType) {
    return typeof value === 'string' && isValidStringAttribute(value);
}

/** Validates an integer attribute type and value. */
function validateIntegerAttribute(value: AttributeType) {
    return typeof value === 'bigint' && isValidIntegerAttribute(value);
}

/** Verifies that a range statement is valid according to schema constraints. */
function verifyRangeStatement<AttributeKey>(
    statement: RangeStatementV2<AttributeKey>,
    properties?: CredentialSchemaProperty
) {
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

/** Verifies that a set statement (membership or non-membership) is valid according to schema constraints. */
function verifySetStatement<AttributeKey>(
    statement: MembershipStatementV2<AttributeKey> | NonMembershipStatementV2<AttributeKey>,
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

/** Verifies that an atomic statement is valid according to schema constraints. */
function verifyAtomicStatement<AttributeKey>(
    statement: AtomicStatementV2<AttributeKey>,
    schema?: CredentialSchemaSubject
) {
    if (statement.type === undefined) {
        throw new Error('Statements must contain a type field');
    }
    if (statement.attributeTag === undefined) {
        throw new Error('Statements must contain an attributeTag field');
    }

    if (schema && !Object.keys(schema.properties.attributes.properties).includes(statement.attributeTag as string)) {
        throw new Error('Unknown attributeTag: ' + statement.attributeTag);
    }

    const property = schema && schema.properties.attributes.properties[statement.attributeTag as string];

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
function verifyAtomicStatementInContext<AttributeKey>(
    statement: AtomicStatementV2<AttributeKey>,
    existingStatements: AtomicStatementV2<AttributeKey>[],
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

/** Creates a Web3 ID credential qualifier with valid contract addresses. */
function getWeb3IdCredentialQualifier(validContractAddresses: ContractAddress.Type[]): Web3IdCredentialQualifier {
    return {
        type: 'sci',
        issuers: validContractAddresses,
    };
}

/** Creates an account credential qualifier with valid identity providers. */
function getAccountCredentialQualifier(validIdentityProviders: number[]): AccountCredentialQualifier {
    return {
        type: 'cred',
        issuers: validIdentityProviders,
    };
}

/** Creates an identity credential qualifier with valid identity providers. */
function getIdentityCredentialQualifier(validIdentityProviders: number[]): IdentityCredentialQualifier {
    return {
        type: 'id',
        issuers: validIdentityProviders,
    };
}

export class AtomicStatementBuilder<AttributeKey> implements InternalBuilder<AttributeKey> {
    /** Array of atomic statements being built. */
    statements: AtomicStatementV2<AttributeKey>[];
    /** Optional schema for validating statements against credential schema. */
    schema: CredentialSchemaSubject | undefined;

    /**
     * Creates a new AtomicStatementBuilder.
     * @param schema Optional credential schema for validation
     */
    constructor(schema?: CredentialSchemaSubject) {
        this.statements = [];
        this.schema = schema;
    }

    /**
     * Outputs the built statement.
     */
    getStatement(): AtomicStatementV2<AttributeKey>[] {
        return this.statements;
    }

    /**
     * This checks whether the given statement may be added to the statement being built.
     * If the statement breaks any rules, this will throw an error.
     * @param statement The atomic statement to validate
     */
    private check(statement: AtomicStatementV2<AttributeKey>) {
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
    addRange(attribute: AttributeKey, lower: StatementAttributeType, upper: StatementAttributeType): this {
        const statement: AtomicStatementV2<AttributeKey> = {
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
    addMembership(attribute: AttributeKey, set: StatementAttributeType[]): this {
        const statement: AtomicStatementV2<AttributeKey> = {
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
    addNonMembership(attribute: AttributeKey, set: StatementAttributeType[]): this {
        const statement: AtomicStatementV2<AttributeKey> = {
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
    revealAttribute(attribute: AttributeKey): this {
        const statement: AtomicStatementV2<AttributeKey> = {
            type: StatementTypes.RevealAttribute,
            attributeTag: attribute,
        };
        this.check(statement);
        this.statements.push(statement);
        return this;
    }
}

export class IdentityStatementBuilder extends AtomicStatementBuilder<AttributeKey> {
    /**
     * Add to the statement that the age is at minimum the given value.
     * This adds a range statement that the date of birth is between 1st of january 1800 and <age> years ago.
     * @param age: the minimum age allowed.
     * @returns the updated builder
     */
    addMinimumAge(age: number): IdentityStatementBuilder {
        return this.addRange(AttributeKeyString.dob, MIN_DATE, getPastDate(age, 1));
    }

    /**
     * Add to the statement that the age is at maximum the given value.
     * This adds a range statement that the date of birth is between <age + 1> years ago and 1st of january 9999.
     * @param age: the maximum age allowed.
     * @returns the updated builder
     */
    addMaximumAge(age: number): IdentityStatementBuilder {
        return this.addRange(AttributeKeyString.dob, getPastDate(age + 1, 1), MAX_DATE);
    }

    /**
     * Add to the statement that the age is between two given ages.
     * This adds a range statement that the date of birth is between <maxAge> years ago and <minAge> years ago.
     * @param minAge: the maximum age allowed.
     * @param maxAge: the maximum age allowed.
     * @returns the updated builder
     */
    addAgeInRange(minAge: number, maxAge: number): IdentityStatementBuilder {
        return this.addRange(AttributeKeyString.dob, getPastDate(maxAge + 1, 1), getPastDate(minAge));
    }

    /**
     * Add to the statement that the user's document expiry is atleast the given date.
     * This adds a range statement that the idDocExpiresAt is between the given date and 1st of january 9999 .
     * @param earliestDate: the earliest the document is allow to be expired at, should be a string in YYYYMMDD format.
     * @returns the updated builder
     */
    documentExpiryNoEarlierThan(earliestDate: string): IdentityStatementBuilder {
        return this.addRange(AttributeKeyString.idDocExpiresAt, earliestDate, MAX_DATE);
    }

    /**
     * Add to the statement that the country of residence is one of the EU countries
     * @returns the updated builder
     */
    addEUResidency(): IdentityStatementBuilder {
        return this.addMembership(AttributeKeyString.countryOfResidence, EU_MEMBERS);
    }

    /**
     * Add to the statement that the nationality is one of the EU countries
     * @returns the updated builder
     */
    addEUNationality(): IdentityStatementBuilder {
        return this.addMembership(AttributeKeyString.nationality, EU_MEMBERS);
    }
}

/** Internal type alias for statement builders. */
type InternalBuilder<AttributeKey> = StatementBuilder<AttributeKey, StatementAttributeType>;
/** Builder class for constructing credential statements with different credential types. */
export class CredentialStatementBuilder {
    /** Array of credential statements being built. */
    private statements: CredentialStatements = [];

    /**
     * Add statements for Web3 ID credentials.
     *
     * @param validContractAddresses Array of contract addresses that are valid issuers
     * @param builderCallback Callback function to build the statements using the provided builder
     * @param schema Optional credential schema for validation
     *
     * @returns The updated builder instance
     */
    forWeb3IdCredentials(
        validContractAddresses: ContractAddress.Type[],
        builderCallback: (builder: InternalBuilder<string>) => void,
        schema?: CredentialSchemaSubject
    ): CredentialStatementBuilder {
        const builder = new AtomicStatementBuilder<string>(schema);
        builderCallback(builder);
        this.statements.push({
            idQualifier: getWeb3IdCredentialQualifier(validContractAddresses),
            statement: builder.getStatement(),
        });
        return this;
    }

    /**
     * Add statements for account credentials.
     *
     * @param validIdentityProviders Array of identity provider indices that are valid issuers
     * @param builderCallback Callback function to build the statements using the provided identity builder
     *
     * @returns The updated builder instance
     */
    forAccountCredentials(
        validIdentityProviders: number[],
        builderCallback: (builder: IdentityStatementBuilder) => void
    ): CredentialStatementBuilder {
        const builder = new IdentityStatementBuilder(IDENTITY_SUBJECT_SCHEMA);
        builderCallback(builder);
        const statement: AccountCredentialStatement = {
            idQualifier: getAccountCredentialQualifier(validIdentityProviders),
            statement: builder.getStatement(),
        };
        this.statements.push(statement);
        return this;
    }

    /**
     * Add statements for identity credentials.
     *
     * @param validIdentityProviders Array of identity provider indices that are valid issuers
     * @param builderCallback Callback function to build the statements using the provided identity builder
     *
     * @returns The updated builder instance
     */
    forIdentityCredentials(
        validIdentityProviders: number[],
        builderCallback: (builder: IdentityStatementBuilder) => void
    ): CredentialStatementBuilder {
        const builder = new IdentityStatementBuilder(IDENTITY_SUBJECT_SCHEMA);
        builderCallback(builder);
        const statement: IdentityCredentialStatement = {
            idQualifier: getIdentityCredentialQualifier(validIdentityProviders),
            statement: builder.getStatement(),
        };
        this.statements.push(statement);
        return this;
    }

    /**
     * Get the built credential statements.
     * @returns Array of credential statements
     */
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
 * Create a DID string for an identity credential. Used to build a request for a verifiable credential.
 */
export function createIdentityDID(network: Network, identityProviderIndex: number, identityIndex: number): DIDString {
    return 'did:ccd:' + network.toLowerCase() + ':id:' + identityProviderIndex + ':' + identityIndex;
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
 * Create the commitment input required to create a proof for the given statements, using an identity credential.
 */
export function createIdentityCommitmentInput(
    identityProvider: IdentityProvider,
    idObject: IdentityObjectV1,
    idObjectUseData: IdObjectUseData
): IdentityCommitmentInput {
    const policy: Policy = {
        createdAt: idObject.attributeList.createdAt,
        validTo: idObject.attributeList.validTo,
        revealedAttributes: {}, // TODO: this is temporary until we figure out if it's needed or not
    };
    return {
        type: 'identityCredentials',
        context: identityProvider,
        idObject,
        idObjectUseData,
        policy,
    };
}

/**
 * Create the commitment input required to create a proof for the given statements, using an identity credential.
 * Uses a ConcordiumHdWallet to get values for the {@linkcode IdObjectUseData}.
 */
export function createIdentityCommitmentInputWithHdWallet(
    idObject: IdentityObjectV1,
    identityProvider: IdentityProvider,
    identityIndex: number,
    wallet: ConcordiumHdWallet
): IdentityCommitmentInput {
    const prfKey = wallet.getPrfKey(identityProvider.ipInfo.ipIdentity, identityIndex);
    const idCredSecret = wallet.getIdCredSec(identityProvider.ipInfo.ipIdentity, identityIndex);
    const randomness = wallet.getSignatureBlindingRandomness(identityProvider.ipInfo.ipIdentity, identityIndex);
    const idObjectUseData: IdObjectUseData = {
        randomness,
        aci: { prfKey, credentialHolderInformation: { idCredSecret } },
    };
    return createIdentityCommitmentInput(identityProvider, idObject, idObjectUseData);
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
