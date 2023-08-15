import {
    createIdRequestV1 as createIdRequestV1Wasm,
    createIdentityRecoveryRequest as createIdentityRecoveryRequestWasm,
} from '@concordium/rust-bindings/wallet';
import {
    ArInfo,
    CryptographicParameters,
    IdObjectRequestV1,
    IdRecoveryRequest,
    IpInfo,
    Network,
    Versioned,
} from '../types';

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
    const rawRequest = createIdRequestV1Wasm(JSON.stringify(input));
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
    const rawRequest = createIdentityRecoveryRequestWasm(JSON.stringify(input));
    try {
        return JSON.parse(rawRequest).idRecoveryRequest;
    } catch (e) {
        throw new Error(rawRequest);
    }
}
