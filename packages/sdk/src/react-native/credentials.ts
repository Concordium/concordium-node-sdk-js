import { Buffer } from 'buffer/index.js';
import JSONbig from 'json-bigint';

import type {
    AttributeKey,
    CdiRandomness,
    CredentialDeploymentDetails,
    CredentialDeploymentInfo,
    CredentialDeploymentPayload,
    CryptographicParameters,
    IdentityInput,
    TypedCredentialDeployment,
    UnsignedCdiWithRandomness,
    UnsignedCredentialDeploymentInformation,
    VerifyKey,
} from '../types.js';
import type * as AccountAddress from '../types/AccountAddress.js';
import * as TransactionExpiry from '../types/TransactionExpiry.js';
import { AttributesKeys } from '../types/attributes.js';
import type { CredentialInput, CredentialInputNoSeed } from '../wasm/credentialDeploymentTransactions.js';
import { ConcordiumHdWallet } from './HdWallet.js';
import { asArrayBuffer, indexInRange, loadBindings } from './bindings.js';

export type { CredentialInput, CredentialInputNoSeed } from '../wasm/credentialDeploymentTransactions.js';

async function toNoSeedInput({
    seedAsHex,
    net,
    identityIndex,
    ...input
}: CredentialInput): Promise<CredentialInputNoSeed> {
    const wallet = ConcordiumHdWallet.fromHex(seedAsHex, net);
    const provider = input.ipInfo.ipIdentity;
    const counter = indexInRange(input.credNumber, 'credNumber', 255);
    const [publicKey, idCredSec, prfKey, blindingRandomness] = await Promise.all([
        wallet.getAccountPublicKey(provider, identityIndex, counter),
        wallet.getIdCredSec(provider, identityIndex),
        wallet.getPrfKey(provider, identityIndex),
        wallet.getSignatureBlindingRandomness(provider, identityIndex),
    ]);
    const randomness = await Promise.all(
        Object.entries(AttributesKeys)
            .filter((entry): entry is [string, AttributesKeys] => typeof entry[1] === 'number')
            .map(
                async ([name, attribute]) =>
                    [
                        name,
                        (
                            await wallet.getAttributeCommitmentRandomness(provider, identityIndex, counter, attribute)
                        ).toString('hex'),
                    ] as const
            )
    );

    return {
        ...input,
        idCredSec: idCredSec.toString('hex'),
        prfKey: prfKey.toString('hex'),
        sigRetrievelRandomness: blindingRandomness.toString('hex'),
        credentialPublicKeys: {
            keys: { 0: { schemeId: 'Ed25519', verifyKey: publicKey.toString('hex') } },
            threshold: 1,
        },
        attributeRandomness: Object.fromEntries(randomness) as CredentialInputNoSeed['attributeRandomness'],
    };
}

/** Creates an unsigned V1 credential for a new or existing account using externally managed keys. */
export async function createUnsignedCredentialV1(
    { sigRetrievelRandomness, ...input }: CredentialInputNoSeed,
    address?: AccountAddress.Type
): Promise<UnsignedCdiWithRandomness> {
    const native = await loadBindings();
    const request = {
        ...input,
        credNumber: indexInRange(input.credNumber, 'credNumber', 255),
        blindingRandomness: sigRetrievelRandomness,
        address: address?.address,
    };
    return JSONbig.parse(await native.createUnsignedCredentialV1(JSONbig.stringify(request)));
}

export async function createCredentialPayload(
    input: CredentialInput,
    expiry: TransactionExpiry.Type
): Promise<CredentialDeploymentPayload & CdiRandomness> {
    return createCredentialPayloadNoSeed(await toNoSeedInput(input), expiry);
}

export async function createCredentialPayloadNoSeed(
    input: CredentialInputNoSeed,
    expiry: TransactionExpiry.Type
): Promise<CredentialDeploymentPayload & CdiRandomness> {
    return { ...(await createUnsignedCredentialV1(input)), expiry };
}

export async function createUnsignedCredentialForExistingAccountV1(
    input: CredentialInput,
    address: AccountAddress.Type
): Promise<UnsignedCdiWithRandomness> {
    return createUnsignedCredentialV1(await toNoSeedInput(input), address);
}

export const createUnsignedCredentialForExistingAccountV1NoSeed = createUnsignedCredentialV1;

/** Creates an unsigned credential using the legacy identity format. */
export async function generateUnsignedCredential(
    identity: IdentityInput,
    global: CryptographicParameters,
    threshold: number,
    publicKeys: VerifyKey[],
    credentialNumber: number,
    revealedAttributes: AttributeKey[],
    address?: AccountAddress.Type
): Promise<UnsignedCdiWithRandomness> {
    if (publicKeys.length > 255) throw new RangeError('Expected at most 255 keys');
    const native = await loadBindings();
    return JSONbig.parse(
        await native.generateUnsignedCredential(
            JSONbig.stringify({
                ...identity.identityProvider,
                global,
                identityObject: identity.identityObject,
                randomness: { randomness: identity.randomness },
                publicKeys,
                credentialNumber: indexInRange(credentialNumber, 'credentialNumber', 255),
                threshold: indexInRange(threshold, 'threshold', 255),
                prfKey: identity.prfKey,
                idCredSec: identity.idCredSecret,
                revealedAttributes,
                address: address?.address,
            })
        )
    );
}

export async function buildSignedCredentialForExistingAccount(
    unsigned: UnsignedCredentialDeploymentInformation,
    signatures: string[]
): Promise<CredentialDeploymentInfo> {
    return JSONbig.parse(await (await loadBindings()).getDeploymentInfo(signatures, JSONbig.stringify(unsigned)));
}

export interface CredentialDeploymentSerialization {
    credInfo: CredentialDeploymentInfo;
    serializedTransaction: string;
    transactionHash: string;
}

export async function getCredentialDeploymentDetails(
    deployment: CredentialDeploymentDetails,
    signatures: string[]
): Promise<CredentialDeploymentSerialization> {
    return JSONbig.parse(
        await (
            await loadBindings()
        ).getDeploymentDetails(
            signatures,
            JSONbig.stringify(deployment.unsignedCdi),
            deployment.expiry.expiryEpochSeconds
        )
    );
}

export async function serializeCredentialDeploymentPayload(
    signatures: string[],
    deployment: CredentialDeploymentPayload
): Promise<Buffer> {
    const payload = await (
        await loadBindings()
    ).serializeCredentialDeploymentPayload(signatures, JSONbig.stringify(deployment.unsignedCdi));
    return Buffer.from(payload);
}

/** Decodes an account credential message including its expiry and credential. */
export async function deserializeCredentialDeployment(bytes: ArrayBuffer | Uint8Array): Promise<{
    credential: TypedCredentialDeployment;
    expiry: TransactionExpiry.Type;
}> {
    const json = JSONbig({ useNativeBigInt: true }).parse(
        await (await loadBindings()).deserializeCredentialDeployment(asArrayBuffer(bytes))
    );
    return { credential: json.credential, expiry: TransactionExpiry.fromEpochSeconds(json.messageExpiry) };
}
