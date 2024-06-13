import * as wasm from '@concordium/rust-bindings/wallet';

import type { IdProofInput, IdProofOutput } from '../id/index.js';
import type {
    ArInfo,
    CryptographicParameters,
    IdObjectRequestV1,
    IdRecoveryRequest,
    IpInfo,
    Network,
    Versioned,
} from '../types.js';
import { ConcordiumHdWallet } from './HdWallet.js';

interface IdentityRequestInputCommon {
    ipInfo: IpInfo;
    globalContext: CryptographicParameters;
    arsInfos: Record<string, ArInfo>;
    arThreshold: number;
}

/**
 * The input parameter for creating an identity object request where
 * the secret keys are derived from the provided seed.
 */
export type IdentityRequestInput = IdentityRequestInputCommon & {
    seed: string;
    net: Network;
    identityIndex: number;
};

/**
 * The input parameter for creating an identity object request where
 * the secret keys and randomness are provided directly.
 */
export type IdentityRequestWithKeysInput = IdentityRequestInputCommon & {
    prfKey: string;
    idCredSec: string;
    blindingRandomness: string;
};

/**
 * Creates a V1 identity request by providing the secret keys directly.
 * This allows for the generation of the keys separately from creating
 * the request.
 */
export function createIdentityRequestWithKeys(input: IdentityRequestWithKeysInput): Versioned<IdObjectRequestV1> {
    const rawRequest = wasm.createIdRequestV1(JSON.stringify(input));
    try {
        return JSON.parse(rawRequest).idObjectRequest;
    } catch (e) {
        throw new Error(rawRequest);
    }
}

/**
 * Creates a V1 identity request from a seed. This will derive the corresponding
 * keys based on the provided identity index, identity provider index and seed.
 * The identity provider index is extracted from the provided IpInfo.
 */
export function createIdentityRequest(input: IdentityRequestInput): Versioned<IdObjectRequestV1> {
    const wallet = ConcordiumHdWallet.fromHex(input.seed, input.net);
    const identityProviderIndex = input.ipInfo.ipIdentity;
    const identityIndex = input.identityIndex;
    const idCredSec = wallet.getIdCredSec(identityProviderIndex, identityIndex).toString('hex');
    const prfKey = wallet.getPrfKey(identityProviderIndex, identityIndex).toString('hex');
    const blindingRandomness = wallet
        .getSignatureBlindingRandomness(identityProviderIndex, identityIndex)
        .toString('hex');

    const inputWithKeys: IdentityRequestWithKeysInput = {
        arsInfos: input.arsInfos,
        arThreshold: input.arThreshold,
        globalContext: input.globalContext,
        ipInfo: input.ipInfo,
        idCredSec,
        prfKey,
        blindingRandomness,
    };

    return createIdentityRequestWithKeys(inputWithKeys);
}

type IdentityRecoveryRequestInputCommon = {
    ipInfo: IpInfo;
    globalContext: CryptographicParameters;
    timestamp: number;
};

/**
 * The input parameter for creating an identity recovery request where
 * the secret keys are derived from the provided seed.
 */
export type IdentityRecoveryRequestInput = IdentityRecoveryRequestInputCommon & {
    seedAsHex: string;
    net: Network;
    identityIndex: number;
};

/**
 * The input parameter for creating an identity recovery request where
 * the secret keys and randomness are provided directly.
 */
export type IdentityRecoveryRequestWithKeysInput = IdentityRecoveryRequestInputCommon & {
    idCredSec: string;
};

/**
 * Creates an identity recovery request from a seed. This will derive the
 * corresponding keys based on the provided identity index, identity provider index
 * and seed. The identity provider index is extracted from the provided IpInfo.
 */
export function createIdentityRecoveryRequest(input: IdentityRecoveryRequestInput): Versioned<IdRecoveryRequest> {
    const wallet = ConcordiumHdWallet.fromHex(input.seedAsHex, input.net);
    const idCredSec = wallet.getIdCredSec(input.ipInfo.ipIdentity, input.identityIndex).toString('hex');

    const inputWithKeys: IdentityRecoveryRequestWithKeysInput = {
        globalContext: input.globalContext,
        ipInfo: input.ipInfo,
        timestamp: input.timestamp,
        idCredSec,
    };

    return createIdentityRecoveryRequestWithKeys(inputWithKeys);
}

/**
 * Creates an indentity recovery request by providing the secret key directly.
 * This allows for the generation of the keys separately from creating
 * the request.
 */
export function createIdentityRecoveryRequestWithKeys(
    input: IdentityRecoveryRequestWithKeysInput
): Versioned<IdRecoveryRequest> {
    const rawRequest = wasm.createIdentityRecoveryRequest(JSON.stringify(input));
    try {
        return JSON.parse(rawRequest).idRecoveryRequest;
    } catch (e) {
        throw new Error(rawRequest);
    }
}

/**
 * Given a statement about an identity and the inputs necessary to prove the statement, produces a proof that the associated identity fulfills the statement.
 */
export function getIdProof(input: IdProofInput): IdProofOutput {
    const rawRequest = wasm.createIdProof(JSON.stringify(input));
    let out: IdProofOutput;
    try {
        out = JSON.parse(rawRequest);
    } catch (e) {
        throw new Error(rawRequest);
    }
    return out;
}
