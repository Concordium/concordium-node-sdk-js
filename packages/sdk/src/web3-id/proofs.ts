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
    IdentityQualifier,
    MembershipStatementV2,
    NonMembershipStatementV2,
    RangeStatementV2,
    StatementAttributeType,
    VerifiableCredentialQualifier,
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
function getWeb3IdCredentialQualifier(validContractAddresses: ContractAddress.Type[]): VerifiableCredentialQualifier {
    return {
        type: 'sci',
        issuers: validContractAddresses,
    };
}

/** Creates an account credential qualifier with valid identity providers. */
function getAccountCredentialQualifier(validIdentityProviders: number[]): IdentityQualifier {
    return {
        type: 'cred',
        issuers: validIdentityProviders,
    };
}

/**
 * Builder class for constructing atomic statements about credential attributes.
 * Provides a fluent API for adding range, membership, and reveal statements with validation.
 */
export class AtomicStatementBuilder<AttributeKey = string> implements InternalBuilder<AttributeKey> {
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

/**
 * Specialized builder for account/identity credential statements.
 * Extends AtomicStatementBuilder with convenience methods for common identity attributes
 * like age, residency, and document expiry.
 */
export class AccountStatementBuild extends AtomicStatementBuilder<AttributeKey> {
    /**
     * Add to the statement that the age is at minimum the given value.
     * This adds a range statement that the date of birth is between 1st of january 1800 and <age> years ago.
     * @param age: the minimum age allowed.
     * @returns the updated builder
     */
    addMinimumAge(age: number): AccountStatementBuild {
        return this.addRange(AttributeKeyString.dob, MIN_DATE, getPastDate(age, 1));
    }

    /**
     * Add to the statement that the age is at maximum the given value.
     * This adds a range statement that the date of birth is between <age + 1> years ago and 1st of january 9999.
     * @param age: the maximum age allowed.
     * @returns the updated builder
     */
    addMaximumAge(age: number): AccountStatementBuild {
        return this.addRange(AttributeKeyString.dob, getPastDate(age + 1, 1), MAX_DATE);
    }

    /**
     * Add to the statement that the age is between two given ages.
     * This adds a range statement that the date of birth is between <maxAge> years ago and <minAge> years ago.
     * @param minAge: the maximum age allowed.
     * @param maxAge: the maximum age allowed.
     * @returns the updated builder
     */
    addAgeInRange(minAge: number, maxAge: number): AccountStatementBuild {
        return this.addRange(AttributeKeyString.dob, getPastDate(maxAge + 1, 1), getPastDate(minAge));
    }

    /**
     * Add to the statement that the user's document expiry is atleast the given date.
     * This adds a range statement that the idDocExpiresAt is between the given date and 1st of january 9999 .
     * @param earliestDate: the earliest the document is allow to be expired at, should be a string in YYYYMMDD format.
     * @returns the updated builder
     */
    documentExpiryNoEarlierThan(earliestDate: string): AccountStatementBuild {
        return this.addRange(AttributeKeyString.idDocExpiresAt, earliestDate, MAX_DATE);
    }

    /**
     * Add to the statement that the country of residence is one of the EU countries
     * @returns the updated builder
     */
    addEUResidency(): AccountStatementBuild {
        return this.addMembership(AttributeKeyString.countryOfResidence, EU_MEMBERS);
    }

    /**
     * Add to the statement that the nationality is one of the EU countries
     * @returns the updated builder
     */
    addEUNationality(): AccountStatementBuild {
        return this.addMembership(AttributeKeyString.nationality, EU_MEMBERS);
    }
}

/** Internal type alias for statement builders. */
type InternalBuilder<AttributeKey> = StatementBuilder<StatementAttributeType, AttributeKey>;

/**
 * Builder class for constructing credential statements for the original verifiable presentation protocol.
 * Supports both Web3 ID credentials and account/identity credentials with issuer qualifiers.
 */
export class Web3StatementBuilder {
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
    addForVerifiableCredentials(
        validContractAddresses: ContractAddress.Type[],
        builderCallback: (builder: InternalBuilder<string>) => void,
        schema?: CredentialSchemaSubject
    ): Web3StatementBuilder {
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
    addForIdentityCredentials(
        validIdentityProviders: number[],
        builderCallback: (builder: AccountStatementBuild) => void
    ): Web3StatementBuilder {
        const builder = new AccountStatementBuild(IDENTITY_SUBJECT_SCHEMA);
        builderCallback(builder);
        const statement: AccountCredentialStatement = {
            idQualifier: getAccountCredentialQualifier(validIdentityProviders),
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
 * Creates a DID string for a Web3 ID credential.
 * Used to build a request for a verifiable credential issued by a smart contract.
 *
 * @param network - The Concordium network
 * @param publicKey - The public key of the credential holder
 * @param index - The contract index
 * @param subindex - The contract subindex
 * @returns DID string in format: did:ccd:{network}:sci:{index}:{subindex}/credentialEntry/{publicKey}
 */
export function createWeb3IdDID(network: Network, publicKey: string, index: bigint, subindex: bigint): DIDString {
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
 * Creates a DID string for an account credential.
 * Used to build a request for a verifiable credential based on an account credential.
 *
 * @param network - The Concordium network
 * @param credId - The credential ID (registration ID)
 * @returns DID string in format: did:ccd:{network}:cred:{credId}
 */
export function createAccountDID(network: Network, credId: string): DIDString {
    return 'did:ccd:' + network.toLowerCase() + ':cred:' + credId;
}

/**
 * Creates a DID string for an identity credential statement.
 * Used to build a request for a verifiable credential based on an identity object.
 *
 * @param network - The Concordium network
 * @param idpIndex - The index of the identity provider as registered on chain
 * @returns DID string in format: did:ccd:{network}:id
 */
export function createIdentityStatementDID(network: Network, idpIndex: number): DIDString {
    return 'did:ccd:' + network.toLowerCase() + ':idp:' + idpIndex;
}

/**
 * Creates the commitment input required to generate a proof for account credential statements.
 * The commitment input contains the attribute values and randomness needed for zero-knowledge proofs.
 *
 * @param statements - The atomic statements to prove
 * @param identityProvider - The identity provider index that issued the credential
 * @param attributes - The credential holder's attributes
 * @param randomness - Randomness values for commitments, keyed by attribute index
 * @returns Account commitment input for proof generation
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
 * Creates the commitment input required to generate a proof for account credential statements.
 * Uses a ConcordiumHdWallet to derive the necessary randomness values.
 *
 * @param statements - The atomic statements to prove
 * @param identityProvider - The identity provider index that issued the credential
 * @param attributes - The credential holder's attributes
 * @param wallet - The HD wallet for deriving randomness
 * @param identityIndex - The identity index in the wallet
 * @param credIndex - The credential index in the wallet
 * @returns Account commitment input for proof generation
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
 * Creates the commitment input required to generate a proof for Web3 ID credential statements.
 * The commitment input contains the attribute values, randomness, and signature needed for proofs.
 *
 * @param verifiableCredentialPrivateKey - The private key for signing the credential
 * @param credentialSubject - The credential subject with attributes
 * @param randomness - Randomness values for commitments, keyed by attribute name
 * @param signature - The credential signature
 * @returns Web3 issuer commitment input for proof generation
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
 * Creates the commitment input required to generate a proof for Web3 ID credential statements.
 * Uses a ConcordiumHdWallet to derive the credential signing key.
 *
 * @param wallet - The HD wallet for deriving the signing key
 * @param issuer - The contract address of the credential issuer
 * @param credentialIndex - The credential index in the wallet
 * @param credentialSubject - The credential subject with attributes
 * @param randomness - Randomness values for commitments, keyed by attribute name
 * @param signature - The credential signature
 * @returns Web3 issuer commitment input for proof generation
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
 * Creates the commitment input required to generate a proof for identity credential statements.
 * The commitment input contains the identity object and secrets needed for zero-knowledge proofs.
 *
 * @param identityProvider - The identity provider that issued the identity
 * @param idObject - The identity object containing identity information
 * @param idObjectUseData - Additional data required for using the identity object
 * @returns Identity commitment input for proof generation
 */
export function createIdentityCommitmentInput(
    identityProvider: IdentityProvider,
    idObject: IdentityObjectV1,
    idObjectUseData: IdObjectUseData
): IdentityCommitmentInput {
    return {
        type: 'identity',
        ...identityProvider,
        idObject,
        idObjectUseData,
    };
}

/**
 * Creates the commitment input required to generate a proof for identity credential statements.
 * Uses a ConcordiumHdWallet to derive the identity secrets (PRF key, ID cred secret, randomness).
 *
 * @param idObject - The identity object containing identity information
 * @param identityProvider - The identity provider that issued the identity
 * @param identityIndex - The identity index in the wallet
 * @param wallet - The HD wallet for deriving identity secrets
 * @returns Identity commitment input for proof generation
 */
export function createIdentityCommitmentInputWithHdWallet(
    idObject: IdentityObjectV1,
    identityProvider: IdentityProvider,
    identityIndex: number,
    wallet: ConcordiumHdWallet
): IdentityCommitmentInput {
    const prfKey = wallet.getPrfKey(identityProvider.ipInfo.ipIdentity, identityIndex).toString('hex');
    const idCredSecret = wallet.getIdCredSec(identityProvider.ipInfo.ipIdentity, identityIndex).toString('hex');
    const randomness = wallet
        .getSignatureBlindingRandomness(identityProvider.ipInfo.ipIdentity, identityIndex)
        .toString('hex');
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
 * Checks whether a prover can fulfill an atomic statement with their attributes.
 * Validates that the prover has the required attribute and that it satisfies the statement constraints.
 *
 * @param statement - The atomic statement to check
 * @param attributes - The prover's attributes
 * @returns True if the statement can be proven with the given attributes
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
 * Checks whether a prover can fulfill all atomic statements in a credential statement.
 * Returns true only if all atomic statements can be proven with the given attributes.
 *
 * @param credentialStatement - The credential statement containing multiple atomic statements
 * @param attributes - The prover's attributes
 * @returns True if all statements can be proven with the given attributes
 */
export function canProveCredentialStatement(
    credentialStatement: CredentialStatement,
    attributes: Record<string, AttributeType>
): boolean {
    return credentialStatement.statement.every((statement) => canProveAtomicStatement(statement, attributes));
}
