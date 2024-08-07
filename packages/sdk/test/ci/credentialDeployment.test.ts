import fs from 'fs';

import { TransactionExpiry } from '../../src/index.js';
import { AttributeKey, IdentityObjectV1 } from '../../src/types.js';
import { CredentialInput, createCredentialTransaction, createCredentialTransactionNoSeed } from '../../src/wasm/credentialDeploymentTransactions.js';


function createCredentialInput(revealedAttributes: AttributeKey[], idObject: IdentityObjectV1): CredentialInput {
    const ipInfo = JSON.parse(fs.readFileSync('./test/ci/resources/ip_info.json').toString()).value;
    const globalContext = JSON.parse(fs.readFileSync('./test/ci/resources/global.json').toString()).value;
    const arsInfos = JSON.parse(fs.readFileSync('./test/ci/resources/ars_infos.json').toString()).value;

    const seedAsHex =
        'efa5e27326f8fa0902e647b52449bf335b7b605adc387015ec903f41d95080eb71361cbc7fb78721dcd4f3926a337340aa1406df83332c44c1cdcfe100603860';

    return {
        ipInfo,
        globalContext,
        arsInfos,
        idObject,
        revealedAttributes,
        seedAsHex,
        net: 'Testnet',
        identityIndex: 0,
        credNumber: 1,
    };
}

test('Test createCredentialTransaction', () => {
    const expiry = BigInt(Math.floor(Date.now() / 1000)) + BigInt(720);
    const revealedAttributes: AttributeKey[] = ['firstName'];
    const idObject = JSON.parse(fs.readFileSync('./test/ci/resources/identity-object.json').toString()).value;

    const output = createCredentialTransaction(
        createCredentialInput(revealedAttributes, idObject),
        TransactionExpiry.fromEpochSeconds(expiry)
    );
    const cdi = output.unsignedCdi;

    expect(cdi.credId).toEqual(
        'b317d3fea7de56f8c96f6e72820c5cd502cc0eef8454016ee548913255897c6b52156cc60df965d3efb3f160eff6ced4'
    );
    expect(cdi.credentialPublicKeys.keys[0].verifyKey).toEqual(
        '29723ec9a0b4ca16d5d548b676a1a0adbecdedc5446894151acb7699293d69b1'
    );
    expect(cdi.credentialPublicKeys.threshold).toEqual(1);
    expect(cdi.ipIdentity).toEqual(0);
    expect(cdi.policy.createdAt).toEqual('202208');
    expect(cdi.policy.validTo).toEqual('202308');
    expect(Object.keys(cdi.policy.revealedAttributes)).toEqual(revealedAttributes);
    expect(cdi.revocationThreshold).toEqual(1);
    expect(typeof cdi.proofs.challenge).toEqual('string');
    expect(typeof cdi.proofs.commitments).toEqual('string');
    expect(typeof cdi.proofs.credCounterLessThanMaxAccounts).toEqual('string');
    expect(typeof cdi.proofs.sig).toEqual('string');
    expect(typeof cdi.proofs.proofRegId).toEqual('string');
    expect(typeof cdi.proofs.proofIpSig).toEqual('string');
    expect(Object.keys(cdi.proofs.proofIdCredPub)).toEqual(['1', '2', '3']);
    expect(typeof cdi.proofs.proofIdCredPub[1]).toEqual('string');
    expect(typeof cdi.proofs.proofIdCredPub[2]).toEqual('string');
    expect(typeof cdi.proofs.proofIdCredPub[3]).toEqual('string');

    expect(Object.keys(cdi.arData)).toEqual(['1', '2', '3']);
    expect(typeof cdi.arData[1].encIdCredPubShare).toEqual('string');
    expect(typeof cdi.arData[2].encIdCredPubShare).toEqual('string');
    expect(typeof cdi.arData[3].encIdCredPubShare).toEqual('string');
    expect(output.expiry.expiryEpochSeconds).toEqual(BigInt(expiry));
});

test('Test createCredentialTransactionNoSeed lastname with special characters', () => {
  const input = JSON.parse(fs.readFileSync('./test/ci/resources/credential-input-no-seed.json').toString())

    const expiry = 1722939941n;
    const output = createCredentialTransactionNoSeed(
        input,
        TransactionExpiry.fromEpochSeconds(expiry)
    );
    const cdi = output.unsignedCdi;

    expect(cdi.credId).toEqual(
        '930e1e148d2a08b14ed3b5569d4768c96dbea5f540822ee38a6c52ca6c172be408ca4b78d6e2956cfad157bd02804c2c'
    );
    expect(cdi.credentialPublicKeys.keys[0].verifyKey).toEqual(
        '3522291ef370e89424a2ed8a9e440963a783aec4e34377192360f763e1671d77'
    );
    expect(cdi.credentialPublicKeys.threshold).toEqual(1);
    expect(cdi.ipIdentity).toEqual(0);
    expect(cdi.policy.createdAt).toEqual('202408');
    expect(cdi.policy.validTo).toEqual('202508');
    expect(Object.keys(cdi.policy.revealedAttributes)).toEqual([]);
    expect(cdi.revocationThreshold).toEqual(2);
    expect(typeof cdi.proofs.challenge).toEqual('string');
    expect(typeof cdi.proofs.commitments).toEqual('string');
    expect(typeof cdi.proofs.credCounterLessThanMaxAccounts).toEqual('string');
    expect(typeof cdi.proofs.sig).toEqual('string');
    expect(typeof cdi.proofs.proofRegId).toEqual('string');
    expect(typeof cdi.proofs.proofIpSig).toEqual('string');
    expect(Object.keys(cdi.proofs.proofIdCredPub)).toEqual(['1', '2', '3']);
    expect(typeof cdi.proofs.proofIdCredPub[1]).toEqual('string');
    expect(typeof cdi.proofs.proofIdCredPub[2]).toEqual('string');
    expect(typeof cdi.proofs.proofIdCredPub[3]).toEqual('string');

    expect(Object.keys(cdi.arData)).toEqual(['1', '2', '3']);
    expect(typeof cdi.arData[1].encIdCredPubShare).toEqual('string');
    expect(typeof cdi.arData[2].encIdCredPubShare).toEqual('string');
    expect(typeof cdi.arData[3].encIdCredPubShare).toEqual('string');
    expect(output.expiry.expiryEpochSeconds).toEqual(BigInt(expiry));
});



