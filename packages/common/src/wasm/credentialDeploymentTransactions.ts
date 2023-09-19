import bs58check from 'bs58check';
import { Buffer } from 'buffer/index.js';
import { sign } from '@noble/ed25519';
import * as wasm from '@concordium/rust-bindings/wallet';
import {
    AttributeKey,
    CredentialDeploymentTransaction,
    CredentialDeploymentInfo,
    CryptographicParameters,
    IdentityInput,
    UnsignedCdiWithRandomness,
    UnsignedCredentialDeploymentInformation,
    VerifyKey,
    IpInfo,
    ArInfo,
    IdentityObjectV1,
    SignedCredentialDeploymentDetails,
    Network,
    CredentialPublicKeys,
    AttributesKeys,
    CredentialDeploymentDetails,
    HexString,
} from '../types.js';
import { TransactionExpiry } from '../types/transactionExpiry.js';
import { AccountAddress } from '../types/accountAddress.js';
import { sha256 } from '../hash.js';
import { ConcordiumHdWallet } from './HdWallet.js';
import { filterRecord, mapRecord } from '../util.js';
import { getCredentialDeploymentSignDigest } from '../serialization.js';

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
    address?: AccountAddress
): UnsignedCdiWithRandomness {
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

    if (address) {
        credentialInput.address = address.address;
    }

    const unsignedCredentialDeploymentInfoString =
        wasm.generateUnsignedCredential(JSON.stringify(credentialInput));
    const result: UnsignedCdiWithRandomness = JSON.parse(
        unsignedCredentialDeploymentInfoString
    );
    return result;
}

/**
 * Create a credential deployment transaction, which is the transaction used
 * when deploying a new account.
 * @deprecated This function doesn't use allow supplying the randomness. {@link createCredentialTransactionV1 } or { @link createCredentialTransactionV1NoSeed } should be used instead.
 * @param identity the identity to create a credential for
 * @param cryptographicParameters the global cryptographic parameters from the chain
 * @param threshold the signature threshold for the credential, has to be less than number of public keys
 * @param publicKeys the public keys for the account
 * @param credentialIndex the index of the credential to create, has to be in sequence and unused
 * @param revealedAttributes the attributes about the account holder that should be revealed on chain
 * @param expiry the expiry of the transaction
 * @returns the details used in a credential deployment transaction
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
 */
export function createUnsignedCredentialForExistingAccount(
    identity: IdentityInput,
    cryptographicParameters: CryptographicParameters,
    threshold: number,
    publicKeys: VerifyKey[],
    credentialIndex: number,
    revealedAttributes: AttributeKey[],
    address: AccountAddress
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
        wasm.getDeploymentInfo(
            signatures,
            JSON.stringify(unsignedCredentialInfo)
        )
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
export function getAccountAddress(credId: string): AccountAddress {
    const hashedCredId = sha256([Buffer.from(credId, 'hex')]);
    const prefixedWithVersion = Buffer.concat([Buffer.of(1), hashedCredId]);
    const accountAddress = new AccountAddress(
        bs58check.encode(prefixedWithVersion)
    );
    return accountAddress;
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

/**
 * Creates a credential for a new account, using the version 1 algorithm, which uses a seed to generate keys and commitments.
 * @deprecated This function outputs the format used by the JSON-RPC client, createCredentialTransaction should be used instead.
 */
export function createCredentialV1(
    input: CredentialInput & { expiry: number }
): SignedCredentialDeploymentDetails {
    const rawRequest = wasm.createCredentialV1(JSON.stringify(input));
    let info: CredentialDeploymentInfo;
    try {
        info = JSON.parse(rawRequest);
    } catch (e) {
        throw new Error(rawRequest);
    }
    return {
        expiry: TransactionExpiry.fromEpochSeconds(BigInt(input.expiry)),
        cdi: info,
    };
}

export type CredentialInputNoSeed = CredentialInputCommon & {
    idCredSec: HexString;
    prfKey: HexString;
    sigRetrievelRandomness: HexString;
    credentialPublicKeys: CredentialPublicKeys;
    attributeRandomness: Record<AttributesKeys, HexString>;
};

/**
 * Creates an unsigned credential for a new account, using the version 1 algorithm, which uses a seed to generate keys and commitments.
 */
export function createCredentialTransaction(
    input: CredentialInput,
    expiry: TransactionExpiry
): CredentialDeploymentTransaction {
    const wallet = ConcordiumHdWallet.fromHex(input.seedAsHex, input.net);
    const publicKey = wallet
        .getAccountPublicKey(
            input.ipInfo.ipIdentity,
            input.identityIndex,
            input.credNumber
        )
        .toString('hex');

    const verifyKey = {
        schemeId: 'Ed25519',
        verifyKey: publicKey,
    };
    const credentialPublicKeys = {
        keys: { 0: verifyKey },
        threshold: 1,
    };

    const prfKey = wallet
        .getPrfKey(input.ipInfo.ipIdentity, input.identityIndex)
        .toString('hex');
    const idCredSec = wallet
        .getIdCredSec(input.ipInfo.ipIdentity, input.identityIndex)
        .toString('hex');
    const randomness = wallet
        .getSignatureBlindingRandomness(
            input.ipInfo.ipIdentity,
            input.identityIndex
        )
        .toString('hex');

    const attributeRandomness = mapRecord(
        filterRecord(AttributesKeys, (k) => isNaN(Number(k))),
        (x) =>
            wallet
                .getAttributeCommitmentRandomness(
                    input.ipInfo.ipIdentity,
                    input.identityIndex,
                    input.credNumber,
                    x
                )
                .toString('hex')
    );

    const noSeedInput: CredentialInputNoSeed = {
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
    return createCredentialTransactionNoSeed(noSeedInput, expiry);
}

/**
 * Creates an unsigned credential for a new account, using the version 1 algorithm, but without requiring the seed to be provided directly.
 */
export function createCredentialTransactionNoSeed(
    input: CredentialInputNoSeed,
    expiry: TransactionExpiry
): CredentialDeploymentTransaction {
    const rawRequest = wasm.createUnsignedCredentialV1(JSON.stringify(input));
    let info: UnsignedCdiWithRandomness;
    try {
        info = JSON.parse(rawRequest);
    } catch (e) {
        throw new Error(rawRequest);
    }
    return {
        expiry,
        ...info,
    };
}

export async function signCredentialTransaction(
    credDeployment: CredentialDeploymentDetails,
    signingKey: HexString
): Promise<HexString> {
    const digest = getCredentialDeploymentSignDigest(credDeployment);
    return Buffer.from(await sign(digest, signingKey)).toString('hex');
}
