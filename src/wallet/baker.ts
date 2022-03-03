import * as wasm from '../../pkg/node_sdk_helpers';
import {
    BakerKeyProofs,
    BakerVerifyKeys,
    AddBakerPayload,
    AccountInfo,
    UpdateBakerKeysPayload,
} from '../types';
import { AccountAddress } from '../types/accountAddress';
import { GtuAmount } from '../types/gtuAmount';

export enum BakerKeyVariant {
    Add = 'ADD',
    Update = 'UPDATE',
}

export type BakerKeys = {
    electionSecret: string;
    electionPublic: string;
    signatureSecret: string;
    signaturePublic: string;
    aggregationSecret: string;
    aggregationPublic: string;
    proofElection: string;
    proofSignature: string;
    proofAggregation: string;
};

export async function generateBakerKeys(
    sender: AccountAddress,
    keyVariant: BakerKeyVariant
): Promise<BakerKeys> {
    const response = await wasm.generateBakerKeys(
        sender.address,
        keyVariant === BakerKeyVariant.Add
            ? wasm.BakerKeyVariant.ADD
            : wasm.BakerKeyVariant.UPDATE
    );
    return JSON.parse(response);
}

function bakerKeysForPayload(
    bakerKeys: BakerKeys
): BakerVerifyKeys & BakerKeyProofs {
    return {
        electionVerifyKey: bakerKeys.electionPublic,
        signatureVerifyKey: bakerKeys.signaturePublic,
        aggregationVerifyKey: bakerKeys.aggregationPublic,
        proofElection: bakerKeys.proofElection,
        proofSignature: bakerKeys.proofSignature,
        proofAggregation: bakerKeys.proofAggregation,
    };
}

export function buildAddBakerPayload(
    bakerKeys: BakerKeys,
    bakingStake: GtuAmount,
    restakeEarnings: boolean
): AddBakerPayload {
    return {
        ...bakerKeysForPayload(bakerKeys),
        bakingStake,
        restakeEarnings,
    };
}

export function buildUpdateBakerKeysPayload(
    bakerKeys: BakerKeys
): UpdateBakerKeysPayload {
    return {
        ...bakerKeysForPayload(bakerKeys),
    };
}

export function serializeBakerCredentials(
    bakerKeys: BakerKeys,
    bakerId: number
): string {
    // We have to manually insert the bakerId into the JSON, because JS integers only supports 53bit precision, and JSON.stringify doesn't handle bigints.
    return JSON.stringify({
        bakerId: 0, // Placeholder
        aggregationSignKey: bakerKeys.aggregationSecret,
        aggregationVerifyKey: bakerKeys.aggregationPublic,
        electionPrivateKey: bakerKeys.electionSecret,
        electionVerifyKey: bakerKeys.electionPublic,
        signatureSignKey: bakerKeys.signatureSecret,
        signatureVerifyKey: bakerKeys.signaturePublic,
    }).replace('"bakerId":0', `"bakerId":${bakerId}`);
}

export function getBakerId(info: AccountInfo): bigint {
    return info.accountIndex;
}
