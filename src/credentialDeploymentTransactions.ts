import {
    AttributeKey,
    CredentialDeploymentTransaction,
    CryptographicParameters,
    IdentityInput,
    UnsignedCredentialDeploymentInformation,
    VerifyKey,
    WithRandomness,
} from './types';
import * as wasm from '../pkg/desktop_wallet';
import { TransactionExpiry } from './types/transactionExpiry';

/**
 * Generates the unsigned credential information that has to be signed when
 * deploying a credential. The randomness for the commitments that are part
 * of the transaction is also outputted, and it should be stored if the
 * commitments should be opened at a later point, i.e. if an attribute should
 * be revealed at a later point.
 * @param identity the identity to create a credential for
 * @param cryptographicParameters the global cryptographic parameters from the chain
 * @param threshold the signature threshold for the credential, has to be less than number of public keys
 * @param publicKeys the public keys for the account
 * @param credentialIndex the index of the credential to create, has to be in sequence and unused
 * @param revealedAttributes the attributes about the account holder that should be revealed on chain
 * @returns the unsigned credential deployment information (for signing), and the randomness used
 */
function createUnsignedCredentialInfo(
    identity: IdentityInput,
    cryptographicParameters: CryptographicParameters,
    threshold: number,
    publicKeys: VerifyKey[],
    credentialIndex: number,
    revealedAttributes: AttributeKey[]
): WithRandomness<UnsignedCredentialDeploymentInformation> {
    if (publicKeys.length > 255) {
        throw new Error(
            'The number of keys is greater than what the transaction supports: ' +
                publicKeys.length
        );
    }

    const identityProvider = identity.identityProvider;
    const credentialInput: Record<string, unknown> = {
        ipInfo: identityProvider.ipInfo,
        arsInfos: identityProvider.arsInfos,
        global: cryptographicParameters,
        identityObject: identity.identityObject,
        randomness: {
            randomness: identity.randomness,
        },
        publicKeys,
        credentialNumber: credentialIndex,
        threshold,
        prfKey: identity.prfKey,
        idCredSec: identity.idCredSecret,
        revealedAttributes: revealedAttributes,
    };

    const unsignedCredentialDeploymentInfoString =
        wasm.generateUnsignedCredential(JSON.stringify(credentialInput));
    const result: WithRandomness<UnsignedCredentialDeploymentInformation> =
        JSON.parse(unsignedCredentialDeploymentInfoString);
    return result;
}

/**
 * Create a credential deployment transaction, which is the transaction used
 * when deploying a new account.
 * @param identity the identity to create a credential for
 * @param cryptographicParameters the global cryptographic parameters from the chain
 * @param threshold the signature threshold for the credential, has to be less than number of public keys
 * @param publicKeys the public keys for the account
 * @param credentialIndex the index of the credential to create, has to be in sequence and unused
 * @param revealedAttributes the attributes about the account holder that should be revealed on chain
 * @param expiry the expiry of the transaction
 * @returns a credential deployment transaction
 */
export function createCredentialDeploymentTransaction(
    identity: IdentityInput,
    cryptographicParameters: CryptographicParameters,
    threshold: number,
    publicKeys: VerifyKey[],
    credentialIndex: number,
    revealedAttributes: AttributeKey[],
    expiry: TransactionExpiry
): CredentialDeploymentTransaction {
    const unsignedCredentialInfo = createUnsignedCredentialInfo(
        identity,
        cryptographicParameters,
        threshold,
        publicKeys,
        credentialIndex,
        revealedAttributes
    );
    return {
        cdi: unsignedCredentialInfo.cdi,
        randomness: unsignedCredentialInfo.randomness,
        expiry: expiry,
    };
}
