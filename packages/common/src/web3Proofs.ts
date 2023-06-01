import * as wasm from '@concordium/rust-bindings';
import {
    AttributeKey,
    AttributeList,
    AttributesKeys,
    ContractAddress,
    KeyPair,
    Network,
} from './types';
import {
    AtomicStatementV2,
    IdentityQualifier,
    IDENTITY_SUBJECT_SCHEMA,
    CredentialStatements,
    MembershipStatementV2,
    NonMembershipStatementV2,
    PropertyDetails,
    RangeStatementV2,
    StatementProverQualifier,
    VerifiableCredentialQualifier,
    VerifiableCredentialSubject,
    Web3IdProofInput,
    AccountCommitmentInput,
    Web3IssuerCommitmentInput,
    VerifiablePresentation,
} from './web3ProofTypes';
import { getPastDate } from './idProofs';
import {
    StatementTypes,
    StatementBuilder,
    MIN_DATE,
    MAX_DATE,
    EU_MEMBERS,
} from './commonProofTypes';
import { ConcordiumHdWallet } from './HdWallet';
import { stringify } from 'json-bigint';

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
                    ' is a string property and therefore the lower end of a range statement must be a string'
            );
        }
        if (typeof statement.upper != 'string') {
            throw new Error(
                properties.title +
                    ' is a string property and therefore the upper end of a range statement must be a string'
            );
        }
    } else if (properties.type === 'integer') {
        if (typeof statement.lower != 'bigint') {
            throw new Error(
                properties.title +
                    ' is a integer property and therefore the lower end of a range statement must be a bigint'
            );
        }
        if (typeof statement.upper != 'bigint') {
            throw new Error(
                properties.title +
                    ' is a integer property and therefore the upper end of a range statement must be a bigint'
            );
        }
    }
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
                ' is a string property and therefore the members of a set statement must be strings'
        );
    }
    if (
        properties.type === 'integer' &&
        !statement.set.every((value) => typeof value == 'bigint')
    ) {
        throw new Error(
            properties.title +
                ' is a integer property and therefore the members of a set statement must be bigints'
        );
    }
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

function getWeb3IdCredentialQualifier(
    validContractAddresses: ContractAddress[]
): VerifiableCredentialQualifier {
    return {
        type: 'sci',
        issuers: validContractAddresses,
    };
}

function getAccountCredentilQualifier(
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

export class AccountStatementBuild extends AtomicStatementBuilder {
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
    private statements: CredentialStatements = [];

    private add(
        idQualifier: StatementProverQualifier,
        builderCallback: (builder: InternalBuilder) => void,
        schema?: VerifiableCredentialSubject
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
        validContractAddresses: ContractAddress[],
        builderCallback: (builder: InternalBuilder) => void,
        schema?: VerifiableCredentialSubject
    ): this {
        return this.add(
            getWeb3IdCredentialQualifier(validContractAddresses),
            builderCallback,
            schema
        );
    }

    addForIdentityCredentials(
        validIdentityProviders: number[],
        builderCallback: (builder: InternalBuilder) => void
    ): this {
        return this.add(
            getAccountCredentilQualifier(validIdentityProviders),
            builderCallback,
            IDENTITY_SUBJECT_SCHEMA
        );
    }

    getStatements(): CredentialStatements {
        return this.statements;
    }
}

/**
 * Given a statement about an identity and the inputs necessary to prove the statement, produces a proof that the associated identity fulfills the statement.
 */
export function getVerifiablePresentation(
    input: Web3IdProofInput
): VerifiablePresentation {
    try {
        // Use json-bigint stringify to ensure we can handle bigints
        const s: VerifiablePresentation = JSON.parse(
            wasm.createWeb3IdProof(stringify(input))
        );
        // TODO Fix statements to have "correct type"
        // s.verifiableCredential.map((proof) => proof.credentialSubject.statement.map())
        return s;
    } catch (e) {
        throw new Error(e as string);
    }
}

/**
 * Create a DID string for a web3id credential. Used to build a request for a verifiable credential.
 */
export function createWeb3IdDID(
    network: Network,
    publicKey: string,
    index: bigint,
    subindex: bigint
): string {
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
 * Converts a YYYYMM string to a rfc3339 string. It uses the earliest possible time/day.
 */
function convertYearMonthToRfc3339(yearMonth: string): string {
    const year = yearMonth.substring(0, 4);
    const month = yearMonth.substring(4, 6);
    return year + '-' + month + '-01T00:00:00.00Z';
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
        issuanceDate: convertYearMonthToRfc3339(attributes.createdAt),
        issuer: identityProvider,
        values: statements.reduce<Record<number, string>>((acc, x) => {
            acc[x.attributeTag] =
                attributes.chosenAttributes[
                    AttributesKeys[x.attributeTag] as AttributeKey
                ];
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
) {
    const randomness = statements.reduce<Record<number, string>>((acc, x) => {
        acc[x.attributeTag] = wallet
            .getAttributeCommitmentRandomness(
                identityProvider,
                identityIndex,
                credIndex,
                x.attributeTag
            )
            .toString('hex');
        return acc;
    }, {});
    return createAccountCommitmentInput(
        statements,
        identityProvider,
        attributes,
        randomness
    );
}

/**
 * Create the commitment input required to create a proof for the given statements, using an web3Id credential.
 */
export function createWeb3CommitmentInput(
    statements: AtomicStatementV2[],
    signer: KeyPair,
    attributes: AttributeList,
    randomness: string
): Web3IssuerCommitmentInput {
    return {
        type: 'web3Issuer',
        issuanceDate: convertYearMonthToRfc3339(attributes.createdAt),
        signer: signer.signKey + signer.verifyKey,
        values: statements.reduce<Record<number, string>>((acc, x) => {
            acc[x.attributeTag] =
                attributes.chosenAttributes[
                    AttributesKeys[x.attributeTag] as AttributeKey
                ];
            return acc;
        }, {}),
        randomness,
    };
}

/**
 * Create the commitment input required to create a proof for the given statements, using an web3Id credential.
 * Uses a ConcordiumHdWallet to supply the public key and the signing key of the credential.
 */
export function createWeb3CommitmentInputWithHdWallet(
    statements: AtomicStatementV2[],
    attributes: AttributeList,
    wallet: ConcordiumHdWallet,
    credentialIndex: number,
    randomness: string
) {
    const keyPair = {
        signKey: wallet
            .getVerifiableCredentialPublicKey(credentialIndex)
            .toString('hex'),
        verifyKey: wallet
            .getVerifiableCredentialSigningKey(credentialIndex)
            .toString('hex'),
    };
    return createWeb3CommitmentInput(
        statements,
        keyPair,
        attributes,
        randomness
    );
}