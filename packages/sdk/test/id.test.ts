import {
    createIdentityRequest,
    IdentityRequestInput,
    IdentityRecoveryRequestInput,
    createIdentityRecoveryRequest,
} from '../src/wasm/identity.js';
import fs from 'fs';

test('idrequest', () => {
    const ipInfo = JSON.parse(
        fs.readFileSync('./test/resources/ip_info.json').toString()
    ).value;
    const globalContext = JSON.parse(
        fs.readFileSync('./test/resources/global.json').toString()
    ).value;
    const arsInfos = JSON.parse(
        fs.readFileSync('./test/resources/ars_infos.json').toString()
    ).value;
    const seed =
        'efa5e27326f8fa0902e647b52449bf335b7b605adc387015ec903f41d95080eb71361cbc7fb78721dcd4f3926a337340aa1406df83332c44c1cdcfe100603860';

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
});

test('Create id recovery request', () => {
    const ipInfo = JSON.parse(
        fs.readFileSync('./test/resources/ip_info.json').toString()
    ).value;
    const globalContext = JSON.parse(
        fs.readFileSync('./test/resources/global.json').toString()
    ).value;
    const seedAsHex =
        'efa5e27326f8fa0902e647b52449bf335b7b605adc387015ec903f41d95080eb71361cbc7fb78721dcd4f3926a337340aa1406df83332c44c1cdcfe100603860';

    const timestamp = 1660550412;

    const input: IdentityRecoveryRequestInput = {
        ipInfo,
        globalContext,
        seedAsHex,
        net: 'Testnet',
        identityIndex: 0,
        timestamp,
    };
    const output = createIdentityRecoveryRequest(input);

    expect(output.value.idCredPub).toEqual(
        'b23e360b21cb8baad1fb1f9a593d1115fc678cb9b7c1a5b5631f82e088092d79d34b6a6c8520c06c41002a666adf792f'
    );
    expect(typeof output.value.proof).toBe('string');
    expect(output.value.timestamp).toBe(timestamp);
});
