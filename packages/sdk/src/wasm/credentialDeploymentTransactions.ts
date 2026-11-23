import * as wasm from '@concordium/rust-bindings/wallet';
// self-referencing not allowed by eslint resolver
// eslint-disable-next-line import/no-extraneous-dependencies
import * as ed from '@concordium/web-sdk/shims/ed25519';
import { Buffer } from 'buffer/index.js';

import { Known } from '../grpc/upward.js';
import { sha256 } from '../hash.js';
import { getCredentialDeploymentSignDigest } from '../serialization.js';
import {
    ArInfo,
    AttributeKey,
    AttributesKeys,
    CdiRandomness,
    CredentialDeploymentDetails,
    CredentialDeploymentInfo,
    CredentialDeploymentPayload,
    CredentialPublicKeys,
    CryptographicParameters,
    HexString,
    IdentityInput,
    IdentityObjectV1,
    IpInfo,
    Network,
    UnsignedCdiWithRandomness,
    UnsignedCredentialDeploymentInformation,
    VerifyKey,
} from '../types.js';
import * as AccountAddress from '../types/AccountAddress.js';
import * as TransactionExpiry from '../types/TransactionExpiry.js';
import { filterRecord, mapRecord } from '../util.js';
import { ConcordiumHdWallet } from './HdWallet.js';

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
 * @param address the account address, if the credential is to be deployed to an existing account
 * @returns the unsigned credential deployment information (for signing), and the randomness used
 */
function createUnsignedCredentialInfo(
    identity: IdentityInput,
    cryptographicParameters: CryptographicParameters,
    threshold: number,
    publicKeys: VerifyKey[],
    credentialIndex: number,
    revealedAttributes: AttributeKey[],
    address?: AccountAddress.Type
): UnsignedCdiWithRandomness {
    if (publicKeys.length > 255) {
        throw new Error('The number of keys is greater than what the transaction supports: ' + publicKeys.length);
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

    if (address) {
        credentialInput.address = address.address;
    }

    const unsignedCredentialDeploymentInfoString = wasm.generateUnsignedCredential(JSON.stringify(credentialInput));
    const result: UnsignedCdiWithRandomness = JSON.parse(unsignedCredentialDeploymentInfoString);
    return result;
}

/**
 * Create a credential deployment transaction payload used when deploying a new account.
 *
 * @deprecated This function doesn't use allow supplying the randomness. {@link createCredentialPayload} or {@link createCredentialPayloadNoSeed} should be used instead.
 * @param identity the identity to create a credential for
 * @param cryptographicParameters the global cryptographic parameters from the chain
 * @param threshold the signature threshold for the credential, has to be less than number of public keys
 * @param publicKeys the public keys for the account
 * @param credentialIndex the index of the credential to create, has to be in sequence and unused
 * @param revealedAttributes the attributes about the account holder that should be revealed on chain
 * @param expiry the expiry of the transaction
 * @returns the details used in a credential deployment transaction
 */
export function createCredentialDeploymentPayload(
    identity: IdentityInput,
    cryptographicParameters: CryptographicParameters,
    threshold: number,
    publicKeys: VerifyKey[],
    credentialIndex: number,
    revealedAttributes: AttributeKey[],
    expiry: TransactionExpiry.Type
): CredentialDeploymentPayload & CdiRandomness {
    const unsignedCredentialInfo = createUnsignedCredentialInfo(
        identity,
        cryptographicParameters,
        threshold,
        publicKeys,
        credentialIndex,
        revealedAttributes
    );
    return {
        unsignedCdi: unsignedCredentialInfo.unsignedCdi,
        randomness: unsignedCredentialInfo.randomness,
        expiry: expiry,
    };
}

/**
 * Create an unsigned credential for an existing account. This credential has to be signed by
 * the creator before it can be deployed on the existing account.
 * @param identity the identity to create a credential for
 * @param cryptographicParameters the global cryptographic parameters from the chain
 * @param threshold the signature threshold for the credential, has to be less than number of public keys
 * @param publicKeys the public keys for the credential
 * @param credentialIndex the index of the credential to create, has to be in sequence and unused
 * @param revealedAttributes the attributes about the account holder that should be revealed on chain
 * @param address the account address to associated the credential with
 * @see {@linkcode createUnsignedCredentialForExistingAccountV1} and
 * {@linkcode createUnsignedCredentialForExistingAccountV1NoSeed} to supply the attribute commitment randomness.
 */
export function createUnsignedCredentialForExistingAccount(
    identity: IdentityInput,
    cryptographicParameters: CryptographicParameters,
    threshold: number,
    publicKeys: VerifyKey[],
    credentialIndex: number,
    revealedAttributes: AttributeKey[],
    address: AccountAddress.Type
): UnsignedCdiWithRandomness {
    return createUnsignedCredentialInfo(
        identity,
        cryptographicParameters,
        threshold,
        publicKeys,
        credentialIndex,
        revealedAttributes,
        address
    );
}

/**
 * Combines the unsigned credential information and the signatures to the signed credential
 * deployment information. This is the information that the account owner needs to be able
 * to deploy the credential to their account.
 * @param unsignedCredentialInfo the unsigned credential information
 * @param signatures the signatures on the unsigned credential information
 * @returns signed credential deployment information, used in an update credentials transaction to deploy it
 */
export function buildSignedCredentialForExistingAccount(
    unsignedCredentialInfo: UnsignedCredentialDeploymentInformation,
    signatures: string[]
): CredentialDeploymentInfo {
    const signedCredential: CredentialDeploymentInfo = JSON.parse(
        wasm.getDeploymentInfo(signatures, JSON.stringify(unsignedCredentialInfo))
    );
    return signedCredential;
}

/**
 * Derives the account address from a credential id. This is the address of the
 * account that will be created by the credential deployment transaction containing
 * this credential id.
 * @param credId the credential id from a credential deployment transaction
 * @returns the account address
 */
export function getAccountAddress(credId: string): AccountAddress.Type {
    const hashedCredId = sha256([Buffer.from(credId, 'hex')]);
    return AccountAddress.fromBuffer(hashedCredId);
}

type CredentialInputCommon = {
    ipInfo: IpInfo;
    globalContext: CryptographicParameters;
    arsInfos: Record<string, ArInfo>;
    idObject: IdentityObjectV1;
    revealedAttributes: AttributeKey[];
    credNumber: number;
};

export type CredentialInput = CredentialInputCommon & {
    seedAsHex: string;
    net: Network;
    identityIndex: number;
};

export type CredentialInputNoSeed = CredentialInputCommon & {
    idCredSec: HexString;
    prfKey: HexString;
    sigRetrievelRandomness: HexString;
    credentialPublicKeys: Known<CredentialPublicKeys>;
    attributeRandomness: Record<AttributesKeys, HexString>;
};

/**
 * Derives the secrets, keys and attribute commitment randomness of a {@linkcode CredentialInputNoSeed} from the seed
 * in a {@linkcode CredentialInput}.
 */
function toNoSeedInput(input: CredentialInput): CredentialInputNoSeed {
    const wallet = ConcordiumHdWallet.fromHex(input.seedAsHex, input.net);
    const publicKey = wallet
        .getAccountPublicKey(input.ipInfo.ipIdentity, input.identityIndex, input.credNumber)
        .toString('hex');

    const verifyKey = {
        schemeId: 'Ed25519',
        verifyKey: publicKey,
    };
    const credentialPublicKeys = {
        keys: { 0: verifyKey },
        threshold: 1,
    };

    const prfKey = wallet.getPrfKey(input.ipInfo.ipIdentity, input.identityIndex).toString('hex');
    const idCredSec = wallet.getIdCredSec(input.ipInfo.ipIdentity, input.identityIndex).toString('hex');
    const randomness = wallet
        .getSignatureBlindingRandomness(input.ipInfo.ipIdentity, input.identityIndex)
        .toString('hex');

    const attributeRandomness = mapRecord(
        filterRecord(AttributesKeys, (k) => isNaN(Number(k))),
        (x) =>
            wallet
                .getAttributeCommitmentRandomness(input.ipInfo.ipIdentity, input.identityIndex, input.credNumber, x)
                .toString('hex')
    );

    return {
        ipInfo: input.ipInfo,
        globalContext: input.globalContext,
        arsInfos: input.arsInfos,
        idObject: input.idObject,
        idCredSec,
        prfKey,
        sigRetrievelRandomness: randomness,
        credentialPublicKeys,
        attributeRandomness,
        revealedAttributes: input.revealedAttributes,
        credNumber: input.credNumber,
    };
}

/**
 * Creates an unsigned credential using the version 1 algorithm. If `address` is given, the credential is created for
 * that existing account, otherwise for a new account.
 */
function createUnsignedCdiV1(input: CredentialInputNoSeed, address?: AccountAddress.Type): UnsignedCdiWithRandomness {
    const { sigRetrievelRandomness, ...other } = input;
    const internalInput = {
        ...other,
        blindingRandomness: sigRetrievelRandomness,
        ...(address !== undefined ? { address: AccountAddress.toBase58(address) } : {}),
    };
    const rawRequest = wasm.createUnsignedCredentialV1(JSON.stringify(internalInput));
    try {
        return JSON.parse(rawRequest);
    } catch (e) {
        throw new Error(rawRequest);
    }
}

/**
 * Creates an unsigned credential for a new account, using the version 1 algorithm, which uses a seed to generate keys and commitments.
 */
export function createCredentialPayload(
    input: CredentialInput,
    expiry: TransactionExpiry.Type
): CredentialDeploymentPayload & CdiRandomness {
    return createCredentialPayloadNoSeed(toNoSeedInput(input), expiry);
}

/**
 * Creates an unsigned credential for a new account, using the version 1 algorithm, but without requiring the seed to be provided directly.
 */
export function createCredentialPayloadNoSeed(
    input: CredentialInputNoSeed,
    expiry: TransactionExpiry.Type
): CredentialDeploymentPayload & CdiRandomness {
    return {
        expiry,
        ...createUnsignedCdiV1(input),
    };
}

/**
 * Creates an unsigned credential for an existing account, using the version 1 algorithm, which uses a seed to generate
 * keys and commitments. Unlike {@linkcode createUnsignedCredentialForExistingAccount}, the attribute commitment
 * randomness is derived from the seed instead of being generated at random.
 *
 * Only the seed of the wallet holding the identity is needed; the keys of the existing account are not used. The
 * account address is bound into the proofs, so the credential can only be deployed to that account.
 *
 * To deploy the credential, sign `getCredentialForExistingAccountSignDigest(unsignedCdi, address)` with the key(s) of
 * the new credential, combine the signatures using {@linkcode buildSignedCredentialForExistingAccount}, and have the
 * account owner submit the result in an update credentials transaction.
 *
 * @param input the input for creating the credential
 * @param address the address of the existing account the credential is created for
 * @returns the unsigned credential and the randomness used for its commitments
 */
export function createUnsignedCredentialForExistingAccountV1(
    input: CredentialInput,
    address: AccountAddress.Type
): UnsignedCdiWithRandomness {
    return createUnsignedCredentialForExistingAccountV1NoSeed(toNoSeedInput(input), address);
}

/**
 * Creates an unsigned credential for an existing account, using the version 1 algorithm, but without requiring the seed
 * to be provided directly. Unlike {@linkcode createUnsignedCredentialForExistingAccount}, the attribute commitment
 * randomness is taken from `input.attributeRandomness` instead of being generated at random.
 *
 * The account address is bound into the proofs, so the credential can only be deployed to that account.
 *
 * To deploy the credential, sign `getCredentialForExistingAccountSignDigest(unsignedCdi, address)` with the key(s) of
 * the new credential, combine the signatures using {@linkcode buildSignedCredentialForExistingAccount}, and have the
 * account owner submit the result in an update credentials transaction.
 *
 * @param input the input for creating the credential
 * @param address the address of the existing account the credential is created for
 * @returns the unsigned credential and the randomness used for its commitments
 */
export function createUnsignedCredentialForExistingAccountV1NoSeed(
    input: CredentialInputNoSeed,
    address: AccountAddress.Type
): UnsignedCdiWithRandomness {
    return createUnsignedCdiV1(input, address);
}

export async function signCredentialTransaction(
    credDeployment: CredentialDeploymentDetails,
    signingKey: HexString
): Promise<HexString> {
    const digest = getCredentialDeploymentSignDigest(credDeployment);
    return Buffer.from(await ed.signAsync(digest, signingKey)).toString('hex');
}
