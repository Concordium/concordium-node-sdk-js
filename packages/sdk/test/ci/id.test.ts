import fs from 'fs';

import {
    ArInfo,
    ConcordiumHdWallet,
    CryptographicParameters,
    IdObjectRequestV1,
    IdRecoveryRequest,
    IpInfo,
} from '../../src/index.ts';
import {
    IdentityRecoveryRequestInput,
    IdentityRecoveryRequestWithKeysInput,
    IdentityRequestInput,
    IdentityRequestWithKeysInput,
    createIdentityRecoveryRequest,
    createIdentityRecoveryRequestWithKeys,
    createIdentityRequest,
    createIdentityRequestWithKeys,
} from '../../src/wasm/identity.js';

const seed =
    'efa5e27326f8fa0902e647b52449bf335b7b605adc387015ec903f41d95080eb71361cbc7fb78721dcd4f3926a337340aa1406df83332c44c1cdcfe100603860';

function getTestData() {
    const ipInfo: IpInfo = JSON.parse(fs.readFileSync('./test/ci/resources/ip_info.json').toString()).value;
    const globalContext: CryptographicParameters = JSON.parse(
        fs.readFileSync('./test/ci/resources/global.json').toString()
    ).value;
    const arsInfos: Record<string, ArInfo> = JSON.parse(
        fs.readFileSync('./test/ci/resources/ars_infos.json').toString()
    ).value;

    return {
        ipInfo,
        globalContext,
        arsInfos,
    };
}

function assertIdentityRequestResult(output: IdObjectRequestV1, arThreshold: number) {
    expect(typeof output.proofsOfKnowledge).toBe('string');
    expect(typeof output.prfKeySharingCoeffCommitments[0]).toEqual('string');
    expect(typeof output.idCredSecCommitment).toEqual('string');
    expect(typeof output.prfKeyCommitmentWithIP).toEqual('string');
    expect(output.idCredPub).toEqual(
        'b23e360b21cb8baad1fb1f9a593d1115fc678cb9b7c1a5b5631f82e088092d79d34b6a6c8520c06c41002a666adf792f'
    );
    expect(output.choiceArData.threshold).toEqual(arThreshold);
    expect(output.choiceArData.arIdentities).toEqual([1, 2, 3]);
    expect(typeof output.ipArData[1].encPrfKeyShare).toEqual('string');
    expect(typeof output.ipArData[1].proofComEncEq).toEqual('string');
    expect(typeof output.ipArData[2].encPrfKeyShare).toEqual('string');
    expect(typeof output.ipArData[2].proofComEncEq).toEqual('string');
    expect(typeof output.ipArData[3].encPrfKeyShare).toEqual('string');
    expect(typeof output.ipArData[3].proofComEncEq).toEqual('string');
}

function assertIdentityRecoveryRequestResult(output: IdRecoveryRequest, timestamp: number) {
    expect(output.idCredPub).toEqual(
        'b23e360b21cb8baad1fb1f9a593d1115fc678cb9b7c1a5b5631f82e088092d79d34b6a6c8520c06c41002a666adf792f'
    );
    expect(typeof output.proof).toBe('string');
    expect(output.timestamp).toBe(timestamp);
}

test('Create identity request using individual keys', () => {
    const { ipInfo, globalContext, arsInfos } = getTestData();

    const wallet = ConcordiumHdWallet.fromHex(seed, 'Testnet');
    const idCredSec = wallet.getIdCredSec(0, 0).toString('hex');
    const prfKey = wallet.getPrfKey(0, 0).toString('hex');
    const blindingRandomness = wallet.getSignatureBlindingRandomness(0, 0).toString('hex');
    const arThreshold = 2;
    const input: IdentityRequestWithKeysInput = {
        arsInfos,
        globalContext,
        ipInfo,
        arThreshold,
        idCredSec,
        prfKey,
        blindingRandomness,
    };

    const output = createIdentityRequestWithKeys(input).value;

    assertIdentityRequestResult(output, arThreshold);
});

test('Create identity request using seed', () => {
    const { ipInfo, globalContext, arsInfos } = getTestData();
    const arThreshold = 2;
    const input: IdentityRequestInput = {
        ipInfo,
        globalContext,
        arsInfos,
        seed,
        net: 'Testnet',
        identityIndex: 0,
        arThreshold,
    };

    const output = createIdentityRequest(input).value;

    assertIdentityRequestResult(output, arThreshold);
});

test('Create identity recovery request using seed', () => {
    const { ipInfo, globalContext } = getTestData();
    const timestamp = 1660550412;
    const input: IdentityRecoveryRequestInput = {
        ipInfo,
        globalContext,
        seedAsHex: seed,
        net: 'Testnet',
        identityIndex: 0,
        timestamp,
    };
    const output = createIdentityRecoveryRequest(input).value;

    assertIdentityRecoveryRequestResult(output, timestamp);
});

test('Create identity recovery request using individual keys', () => {
    const { ipInfo, globalContext } = getTestData();
    const timestamp = 1660550412;
    const wallet = ConcordiumHdWallet.fromHex(seed, 'Testnet');
    const idCredSec = wallet.getIdCredSec(0, 0).toString('hex');
    const input: IdentityRecoveryRequestWithKeysInput = {
        ipInfo,
        globalContext,
        timestamp,
        idCredSec,
    };
    const output = createIdentityRecoveryRequestWithKeys(input).value;

    assertIdentityRecoveryRequestResult(output, timestamp);
});
