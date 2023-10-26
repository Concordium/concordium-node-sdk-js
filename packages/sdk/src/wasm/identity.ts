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

export type IdentityRequestInput = {
    ipInfo: IpInfo;
    globalContext: CryptographicParameters;
    arsInfos: Record<string, ArInfo>;
    seed: string;
    net: Network;
    identityIndex: number;
    arThreshold: number;
};

/**
 * Creates a V1 identityRequest.
 */
export function createIdentityRequest(
    input: IdentityRequestInput
): Versioned<IdObjectRequestV1> {
    const rawRequest = wasm.createIdRequestV1(JSON.stringify(input));
    try {
        return JSON.parse(rawRequest).idObjectRequest;
    } catch (e) {
        throw new Error(rawRequest);
    }
}

export type IdentityRecoveryRequestInput = {
    ipInfo: IpInfo;
    globalContext: CryptographicParameters;
    seedAsHex: string;
    net: Network;
    identityIndex: number;
    timestamp: number;
};

/**
 * Creates a identity Recovery Request.
 */
export function createIdentityRecoveryRequest(
    input: IdentityRecoveryRequestInput
): Versioned<IdRecoveryRequest> {
    const rawRequest = wasm.createIdentityRecoveryRequest(
        JSON.stringify(input)
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
