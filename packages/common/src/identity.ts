import * as wasm from '@concordium/rust-bindings';
import {
    ArInfo,
    AttributeKey,
    CredentialDeploymentInfo,
    CryptographicParameters,
    IpInfo,
    Versioned,
} from './types';

export type IdentityRequestInput = {
    ipInfo: IpInfo;
    globalContext: CryptographicParameters;
    arsInfos: Record<string, ArInfo>;
    seed: string;
    net: 'Testnet' | 'Mainnet';
    identityIndex: number;
    arThreshold: number;
};

export type IpArData = {
    encPrfKeyShare: string;
    proofComEncEq: string;
};

export interface IdObjectRequest {
    idCredPub: string;
    choiceArData: {
        arIdentities: number[];
        threshold: number;
    };
    ipArData: Record<string, IpArData>;
    idCredSecCommitment: string;
    prfKeyCommitmentWithIP: string;
    prfKeySharingCoeffCommitments: string[];
    proofsOfKnowledge: string;
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

export interface AttributeList {
    validTo: string; // "YYYYMM"
    createdAt: string; // "YYYYMM"
    maxAccounts: number;
    chosenAttributes: Record<AttributeKey, string>;
}

export type IdentityObject = {
    preIdentityObject: IdObjectRequest;
    attributeList: AttributeList;
    signature: string;
};

export type CredentialInput = {
    ipInfo: IpInfo;
    globalContext: CryptographicParameters;
    arsInfos: Record<string, ArInfo>;
    idObject: IdentityObject;
    revealedAttributes: AttributeKey[];
    seed: string;
    net: 'Testnet' | 'Mainnet';
    identityIndex: number;
    credNumber: number;
    expiry: number;
};

export function createCredentialV1(
    input: CredentialInput
): CredentialDeploymentInfo {
    const rawRequest = wasm.createCredentialV1(JSON.stringify(input));
    try {
        return JSON.parse(rawRequest);
    } catch (e) {
        throw new Error(rawRequest);
    }
}
