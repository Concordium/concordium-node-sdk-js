import * as wasm from '@concordium/rust-bindings/wallet';
import type {
    ArInfo,
    CryptographicParameters,
    IdObjectRequestV1,
    IdRecoveryRequest,
    IpInfo,
    Network,
    Versioned,
} from '../types.js';
import type { IdProofInput, IdProofOutput } from '../id/index.js';

interface IdentityRequestInputCommon {
    ipInfo: IpInfo;
    globalContext: CryptographicParameters;
    arsInfos: Record<string, ArInfo>;
    arThreshold: number;
}

export type IdentityRequestInput = IdentityRequestInputCommon & {
    seed: string;
    net: Network;
    identityIndex: number;
};

type IdentityRequestInputInternal = {
    common: IdentityRequestInputCommon;
    net: Network;
    seedAsHex: string;
    identityIndex: number;
};

export type IdentityRequestWithKeysInput = IdentityRequestInputCommon & {
    prfKey: string;
    idCredSec: string;
    blindingRandomness: string;
};

type IdentityRequestWithKeysInputInternal = {
    common: IdentityRequestInputCommon;
    prfKey: string;
    idCredSec: string;
    blindingRandomness: string;
};

/**
 * Creates a V1 identity request by providing the secret keys directly.
 * This allows for the generation of the keys separately from creating
 * the request.
 */
export function createIdentityRequestWithKeys(
    input: IdentityRequestWithKeysInput
): Versioned<IdObjectRequestV1> {
    const { prfKey, idCredSec, blindingRandomness, ...common } = input;
    const internalInput: IdentityRequestWithKeysInputInternal = {
        common,
        prfKey,
        idCredSec,
        blindingRandomness,
    };

    const rawRequest = wasm.createIdRequestWithKeysV1(
        JSON.stringify(internalInput)
    );
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
export function createIdentityRequest(
    input: IdentityRequestInput
): Versioned<IdObjectRequestV1> {
    const { seed, identityIndex, net, ...common } = input;
    const internalInput: IdentityRequestInputInternal = {
        common,
        net,
        seedAsHex: seed,
        identityIndex,
    };

    const rawRequest = wasm.createIdRequestV1(JSON.stringify(internalInput));
    try {
        return JSON.parse(rawRequest).idObjectRequest;
    } catch (e) {
        throw new Error(rawRequest);
    }
}

type IdentityRecoveryRequestInputCommon = {
    ipInfo: IpInfo;
    globalContext: CryptographicParameters;
    timestamp: number;
};

export type IdentityRecoveryRequestInput =
    IdentityRecoveryRequestInputCommon & {
        seedAsHex: string;
        net: Network;
        identityIndex: number;
    };

type IdentityRecoveryRequestInputInternal = {
    common: IdentityRecoveryRequestInputCommon;
    seedAsHex: string;
    net: Network;
    identityIndex: number;
};

export type IdentityRecoveryRequestWithKeysInput =
    IdentityRecoveryRequestInputCommon & {
        idCredSec: string;
    };

type IdentityRecoveryRequestWithKeysInputInternal = {
    common: IdentityRecoveryRequestInputCommon;
    idCredSec: string;
};

/**
 * Creates an identity recovery request from a seed. This will derive the
 * corresponding keys based on the provided identity index, identity provider index
 * and seed. The identity provider index is extracted from the provided IpInfo.
 */
export function createIdentityRecoveryRequest(
    input: IdentityRecoveryRequestInput
): Versioned<IdRecoveryRequest> {
    const { seedAsHex, net, identityIndex, ...common } = input;

    const internalInput: IdentityRecoveryRequestInputInternal = {
        common,
        identityIndex,
        net,
        seedAsHex,
    };

    const rawRequest = wasm.createIdentityRecoveryRequest(
        JSON.stringify(internalInput)
    );
    try {
        return JSON.parse(rawRequest).idRecoveryRequest;
    } catch (e) {
        throw new Error(rawRequest);
    }
}

/**
 * Creates an identity recovery request from a seed. This will derive the
 * corresponding keys based on the provided identity index, identity provider index
 * and seed. The identity provider index is extracted from the provided IpInfo.
 */
export function createIdentityRecoveryRequestWithKeys(
    input: IdentityRecoveryRequestWithKeysInput
): Versioned<IdRecoveryRequest> {
    const { idCredSec, ...common } = input;
    const internalInput: IdentityRecoveryRequestWithKeysInputInternal = {
        common,
        idCredSec,
    };

    const rawRequest = wasm.createIdentityRecoveryRequestWithKeys(
        JSON.stringify(internalInput)
    );
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
