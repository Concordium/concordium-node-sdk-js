import * as wasm from '@concordium/rust-bindings';
import {
    ArInfo,
    AttributeKey,
    CredentialDeploymentInfo,
    CryptographicParameters,
    IpInfo,
    SignedCredentialDeploymentDetails,
    Versioned,
} from './types';
import { TransactionExpiry } from './types/transactionExpiry';

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

/**
 * Creates an V1 identityRequest.
 */
export function createIdentityRequest(
    input: IdentityRequestInput
): IdObjectRequest {
    const rawRequest = wasm.createIdRequestV1(JSON.stringify(input));
    try {
        return JSON.parse(rawRequest).idObjectRequest.value;
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

/**
 * Creates a V1 credential for a new account.
 */
export function createCredentialV1(
    input: CredentialInput
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
