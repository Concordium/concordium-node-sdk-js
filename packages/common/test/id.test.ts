import {
    createIdentityRequest,
    createCredentialV1,
    CredentialInput,
    IdentityRequestInput,
} from '../src/identity';
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

    const input: IdentityRequestInput = {
        ipInfo,
        globalContext,
        arsInfos,
        seed,
        net: 'Testnet',
        identityIndex: 0,
        arThreshold: 1,
    };
    const output = createIdentityRequest(input);
    const output2 = createIdentityRequest(input);
    expect(typeof output.proofsOfKnowledge).toBe('string');
    expect(output.idCredPub).toEqual(output2.idCredPub);
});

test('credential', () => {
    const ipInfo = JSON.parse(
        fs.readFileSync('./test/resources/ip_info.json').toString()
    ).value;
    const globalContext = JSON.parse(
        fs.readFileSync('./test/resources/global.json').toString()
    ).value;
    const arsInfos = JSON.parse(
        fs.readFileSync('./test/resources/ars_infos.json').toString()
    ).value;
    const idObject = JSON.parse(
        fs.readFileSync('./test/resources/identity-object.json').toString()
    ).value;

    const seed =
        'efa5e27326f8fa0902e647b52449bf335b7b605adc387015ec903f41d95080eb71361cbc7fb78721dcd4f3926a337340aa1406df83332c44c1cdcfe100603860';

    const input: CredentialInput = {
        ipInfo,
        globalContext,
        arsInfos,
        idObject,
        revealedAttributes: ['firstName'],
        seed,
        net: 'Testnet',
        identityIndex: 0,
        credNumber: 1,
        expiry: Math.floor(Date.now() / 1000) + 720,
    };
    const output = createCredentialV1(input);
    expect(output.cdi.credId).toEqual(
        'b6e5837a032c2845e94edd7ac617e5281c30b27dc9acfbd94de10f80ba42b6e5fc57c8e8a14eceb503bdff375bd17458'
    );
    expect(output.cdi.credentialPublicKeys.keys[0].verifyKey).toEqual(
        'a5a820b4947d2ddef4d9252f940b73ee8f3da17262ddb0c8c9593c6a0c617989'
    );
});
