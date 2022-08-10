import {
    createCredentialV1,
    CredentialInputV1,
} from '../src/credentialDeploymentTransactions';
import fs from 'fs';
import { AttributeKey } from '../src/types';

test('Test createCredentialV1', () => {
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

    const seedAsHex =
        'efa5e27326f8fa0902e647b52449bf335b7b605adc387015ec903f41d95080eb71361cbc7fb78721dcd4f3926a337340aa1406df83332c44c1cdcfe100603860';
    const expiry = Math.floor(Date.now() / 1000) + 720;
    const revealedAttributes: AttributeKey[] = ['firstName'];

    const input: CredentialInputV1 = {
        ipInfo,
        globalContext,
        arsInfos,
        idObject,
        revealedAttributes,
        seedAsHex,
        net: 'Testnet',
        identityIndex: 0,
        credNumber: 1,
        expiry,
    };
    const output = createCredentialV1(input);
    expect(output.cdi.credId).toEqual(
        'b6e5837a032c2845e94edd7ac617e5281c30b27dc9acfbd94de10f80ba42b6e5fc57c8e8a14eceb503bdff375bd17458'
    );
    expect(output.cdi.credentialPublicKeys.keys[0].verifyKey).toEqual(
        'a5a820b4947d2ddef4d9252f940b73ee8f3da17262ddb0c8c9593c6a0c617989'
    );
    expect(output.cdi.credentialPublicKeys.threshold).toEqual(1);
    expect(output.cdi.ipIdentity).toEqual(0);
    expect(output.cdi.policy.createdAt).toEqual('202208');
    expect(output.cdi.policy.validTo).toEqual('202308');
    expect(Object.keys(output.cdi.policy.revealedAttributes)).toEqual(
        revealedAttributes
    );
    expect(output.cdi.revocationThreshold).toEqual(1);
    expect(typeof output.cdi.proofs).toEqual('string');
    expect(Object.keys(output.cdi.arData)).toEqual(['1', '2', '3']);
    expect(typeof output.cdi.arData[1].encIdCredPubShare).toEqual('string');
    expect(typeof output.cdi.arData[2].encIdCredPubShare).toEqual('string');
    expect(typeof output.cdi.arData[3].encIdCredPubShare).toEqual('string');
    expect(output.expiry.expiryEpochSeconds).toEqual(BigInt(expiry));
});
