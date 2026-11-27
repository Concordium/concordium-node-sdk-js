import type { AttributeKey, AttributeList, HexString, IdentityObjectV1, IdentityProvider } from '../types.js';
import type {
    AccountCommitmentInput,
    AtomicStatementV2,
    CredentialSubject,
    IdObjectUseData,
    IdentityCommitmentInput,
    Web3IssuerCommitmentInput,
} from './types.js';

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
