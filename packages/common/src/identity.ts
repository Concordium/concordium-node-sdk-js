import * as wasm from '@concordium/rust-bindings';
import { ArInfo, CryptographicParameters, IpInfo, Versioned } from './types';

type IdentityRequestInput = {
    ipInfo: IpInfo;
    globalContext: CryptographicParameters;
    arsInfos: ArInfo[];
    seed: string;
    net: 'Testnet' | 'Mainnet';
    identityIndex: number;
    arThreshold: number;
};

export interface IdObjectRequest {
    idCredPub: string;
    // TODO: add remaining fields
}

export function createIdentityRequest(
    input: IdentityRequestInput
): Versioned<IdObjectRequest> {
    const rawRequest = wasm.createIdRequestV1(JSON.stringify(input));
    try {
        return JSON.parse(rawRequest).idObjectRequest;
    } catch (e) {
        throw new Error(rawRequest);
    }
}
