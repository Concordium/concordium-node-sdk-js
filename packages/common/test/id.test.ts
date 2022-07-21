import * as wasm from '@concordium/rust-bindings';
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

    const input = {
        ipInfo,
        globalContext,
        arsInfos,
        seed,
        net: 'Testnet',
        identityIndex: 0,
        arThreshold: 1,
    };
    console.debug(input);
    const output = JSON.parse(wasm.createIdRequestV1(JSON.stringify(input)));
    console.debug(output);
    const output2 = JSON.parse(wasm.createIdRequestV1(JSON.stringify(input)));
    expect(output.idObjectRequest.idCredPub).toEqual(
        output2.idObjectRequest.idCredPub
    );
    expect(output.idObjectRequest.proofsOfKnowledge).toEqual(
        output2.idObjectRequest.proofsOfKnowledge
    );
});

test('credential', () => {
    const ip_info = JSON.parse(
        fs.readFileSync('./test/resources/ip_info.json').toString()
    ).value;
    const global_context = JSON.parse(
        fs.readFileSync('./test/resources/global.json').toString()
    ).value;
    const ars_infos = JSON.parse(
        fs.readFileSync('./test/resources/ars_infos.json').toString()
    ).value;
    const id_object = JSON.parse(
        fs.readFileSync('./test/resources/identity-object.json').toString()
    ).value;
    const revealed_attributes: string[] = ['firstName'];

    const seed =
        'efa5e27326f8fa0902e647b52449bf335b7b605adc387015ec903f41d95080eb71361cbc7fb78721dcd4f3926a337340aa1406df83332c44c1cdcfe100603860';

    const input = {
        ip_info,
        global_context,
        ars_infos,
        id_object,
        revealed_attributes,
        seed,
        net: 'Testnet',
        identity_index: 0,
        cred_number: 1,
        expiry: Math.floor(Date.now() / 1000) + 720,
    };
    const output1 = wasm.createCredentialV1(JSON.stringify(input));
    console.debug(output1);
    const output2 = wasm.createCredentialV1(JSON.stringify(input));
    expect(output1).toEqual(output2);
});
