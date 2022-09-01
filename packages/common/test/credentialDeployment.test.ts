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
        'b317d3fea7de56f8c96f6e72820c5cd502cc0eef8454016ee548913255897c6b52156cc60df965d3efb3f160eff6ced4'
    );
    expect(output.cdi.credentialPublicKeys.keys[0].verifyKey).toEqual(
        '29723ec9a0b4ca16d5d548b676a1a0adbecdedc5446894151acb7699293d69b1'
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
