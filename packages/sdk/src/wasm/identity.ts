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
    net: Network;
    arThreshold: number;
}

export type IdentityRequestInput = IdentityRequestInputCommon & {
    seed: string;
    identityIndex: number;
};

type IdentityRequestInputInternal = {
    common: IdentityRequestInputCommon;
    seedAsHex: string;
    identityIndex: number;
};

/**
 * Creates a V1 identityRequest.
 */
export function createIdentityRequest(
    input: IdentityRequestInput
): Versioned<IdObjectRequestV1> {
    const { seed, identityIndex, ...common } = input;
    const internalInput: IdentityRequestInputInternal = {
        common,
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

/**
 * Creates a identity Recovery Request.
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
