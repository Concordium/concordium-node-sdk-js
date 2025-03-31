// self-referencing not allowed by eslint resolver
// eslint-disable-next-line import/no-extraneous-dependencies
import * as ed from '@concordium/web-sdk/shims/ed25519';
import fs from 'fs';

import { TransactionExpiry } from '../../src/index.js';
import { getCredentialDeploymentSignDigest } from '../../src/serialization.js';
import {
    AttributeKey,
    BlockItemKind,
    CredentialDeploymentTransaction,
    IdentityInput,
    IdentityObjectV1,
    VerifyKey,
} from '../../src/types.js';
import {
    CredentialInput,
    createCredentialDeploymentTransaction,
    createCredentialTransaction,
    createCredentialTransactionNoSeed,
} from '../../src/wasm/credentialDeploymentTransactions.js';
import { deserializeTransaction } from '../../src/wasm/deserialization.js';
import { serializeCredentialDeploymentTransactionForSubmission } from '../../src/wasm/serialization.js';
import { getIdentityInput } from '../client/testHelpers.ts';

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

// This test was generated on an older version of the SDK to verify that the serialization remains the same.
test('Test serialize v0 credential transaction', async () => {
    const tx: CredentialDeploymentTransaction = JSON.parse(fs.readFileSync('./test/ci/resources/cdt.json').toString());
    tx.expiry = TransactionExpiry.fromEpochSeconds(tx.expiry as unknown as number); // convert JSON `TransactionExpiry`.
    const hashToSign = getCredentialDeploymentSignDigest(tx);

    const signingKey1 = '1053de23867e0f92a48814aabff834e2ca0b518497abaef71cad4e1be506334a';
    const signingKey2 = 'fcd0e499f5dc7a989a37f8c89536e9af956170d7f502411855052ff75cfc3646';

    const signature1 = Buffer.from(await ed.signAsync(hashToSign, signingKey1)).toString('hex');
    const signature2 = Buffer.from(await ed.signAsync(hashToSign, signingKey2)).toString('hex');
    const signatures: string[] = [signature1, signature2];
    const serializedTx = serializeCredentialDeploymentTransactionForSubmission(tx, signatures);
    const expected =
        '00010000000067eb089e010100006373d17ef26305e5fc4d101aa4a2f97bc414d5b67c3459bcddb869dce54227d70190744f490d5dc7b26b64cdc54404f0a7b9423f952b879de9052aef1ddb715a3c7673a192ba87e03c63adbecc1847f9680000000002000300000001a01f0580ab738ad17e4454b0a21b9ed03c1366198bcd0626c519ec9fb3a4ba2b33327a4539e6780d9250d0ad524c5a6f8b550f6a243321d146f15e8cc373abd0650cd73d3d4e31064724c0fa5ca9dd6bc38d22424881e14c5f0239c06dbb2b9d00000002a6b7c256370aa043b0cc0a7662842ef8c2112f5308ad29d2cb662888fec1b106fdc28224de62135bf32f64eb8dda0f0298278a79123b99f31566031e245150e3c9c9b060c03873484c7a5065bebc1bd701f563af4955fa838d245a5b423e6d2500000003a6ebcf8e91124a7cb69c5b93f09de70b9f0ad4edfaf2146b31bd7de7b224b9525497a76a92da8852abcfccd3d245e6b0a3b7deea254c983497401e357bc89c8a180a5bd14dfdecaf3689428e6b12d9910bc6490b204fa0faeeee08475a6a908707e60a07e50a000000000e12a686b5f222767a8b8c51bccc59e2d29df0954beb18c25ba1dd15a7e0894bf70536f8f8ebbef8d6dd5f98793ec9f7bbcfb38bac5bc5d83fb3d4eaeb876bd272be1b922778924fdaee29e9146e08b4056d17f08685b4ffaf4f7400091b36c7a6d3917c0001d5279b2de164bb4caec2ee3bcf0f605233c77a820963932ee082429f98044c7dc3a1bf48e1f003139e42750bb5487e15e6c251a04c52b980ed2516d7022028710c9931d42b2dbf93595f6de772cb237a5a0c353c4840b54d0a20f2d1b1ef084aaad15bb358c63011d602c440bc154c657f321efa98133b013dc01cd526242dff8717b73a990d6d72e8476148000d00ac7c06f6fcf24b55bd0c691878d9c76b2678c3f18ab44f65118c139ce844579b8650678bbcbe9a764045d5efcae62aec01a50f89c51b22f5096c4331541a4e5203d1dc1ee70d2405aa4df90b6190f58b8bb3225a8bfb352b4bc261855d817eaca9028b843c66e60405c49943194c78c54fa3e51c95dad863aba159fe4046b34f0139841c3b23669b012a181bd92609e4dda503ab6ddd25346944d468dbd086dcfad667355700cc58930c92cc40ad9df1495451bc1f2b131aef711d8734a01cb913080d04b3eb23ceae804df4c101be1b7957d069b7a22b97047d17a472409be216f610560a18aa668c7dc8132db93e6451f2e0a50582f4d08c72cd3000039fcb69df646f51c84c947cb553697397998fd44c03f4a8c9c8c42f949093f5176877cd6f169e4906a5a526a3714cc1f51e312fe293e4f3f258663b3664ce50c08fb4c8b619802463c786adc8d345e751184bcc533011400607b9a573496a53eb277831366d6ce97099531d303f7024c132644df05e41abe5822fbbe0e40e424295186d47230d4324b3088374f3de4817ef093813df71f6afdca068e7ba72ec2f2eaf2c122de2e16eb6997a98e15c50e101d946bbb929e290277d0982001d6e3f42b780b73b0d5dc328a69a9f3298c94069b72e9245380b491ab25a62469f2fc157639e05295eee6361531a0a8fe1f86dba06ec072184cc57b1e93ecbc550e1457385251f064b94352f11211bfffb97c78c975560ca6dd639a693fb5c0badcdae03f2451f58d7d7eb32a292eae79930fd72c56fa2d46c64be88d3d2c99dcd95513204a75c7618cb47273a0607640cb6ad8f3dd4d23f7f58e9d4bc1ceabee809e816b636de7ed36e630d42eaa416bb8aa5da633c7863e3ccc87ccb99db26f700000000000000029875ad885251d7f9f34d6f3c26339026e16a71da9ec8599275c4fde019396e44e11980535b4e0e807bd25f90b5cbb52283c4284751168d064e5103fcd2ca1e40b44981afa0fcd255468aa56f92bd44b846960618db73cdb16b89d3b02f4744f268687aa592a53b47f9446fe169cf74b4b3abe812d007efbc4105464bc49a623f000000030000000158444a55016c9b209edf9eca0ab0ed38abcb6db6c9e3d109157544b3df0e43073620716e8855348744c98dd6b3b1b534681633d298683f94d92c92eb239f977e217fb16e467168087b9979c6397045145ee5789836df2077093f59d8bcd7bab000000002734ace50095b6b7e328716bec375c2624158a5d2e673cd276fa9eab2a187c1a834c6e14d61d159b68e7eeb08f07b49ef3c40944040013eaadd58c544c309153115d908121d8d3d11f86994f7ec7ebf28ebb1eb82b6d42f2fddf9daa554a60b6600000003135a1076015268a0cfa443838c37a47ee1e6e5908d9279067d4bd4a7f9e688a12baa065095dc626aac1bb6b688152fa2d494040d1c4fa074ce2cad3e19f0df5c25bdd948a721c1ea38711ca8b1ebf78fbf78f8f0c22150ed34d03b1330f4785658ca7fb752f806eb411288af01a78c7f18d797282bcbd281496f56fd8a4f7f300000001330cc1b09b3b3410e4ad4f3b788db452eb5ae783e28075c246377055d8a2fec725da01851bbbfe111dbd3b1e4279fc6cfc9a0f3d872a91f00be9b0220953389095c23928d7a590db1f8ac8bc2ee8fec904e395f3b267913b75c779b56224bf4222e5375e601ed4e32ab17bab630b1c6bb1863e6e81650a17334427c80bdf308ba4b3b348d95ffd206c682dc02f14972005157e24a24cefc2f54371f3b564859d36f5d08dc00c2416e1114a900c3c114ff0d7fc2af2f6b49906b0b65b4719b106223b3d7333663c0cb024c71d4421f5bed7cfacda6d9ba1fa48a092db36f6ce32932f0b4fc5f291330bccab98ca055995f5e6bc6501f48cc5e9a05b0954fae18890dc6091cc5a150c25220081f9a4fa67d6c37f8929fa47aacf4bc7cfa91918cc04b109f3f0b8aa71a4f3ff58eaeadea8c136136e38abd7041eb9256fe5975c8603e84f08cd81b90638c96a89e6b4e40768beea12866b384dac30137a23b2797ad11cba0210f4437d4dc95a9de58ceb03a71fd8897c4dc54e89171789b13d33e560c25ba839bc8d789b1b19ca25db41d2192e2111d93042df8e6311ea73054bdfd69fa699bb94ebee7de2602ca609daaf3ca8c95833b173eae4e94baf8ea515e75699a1f3cad256aa6a29a83aae982bb6c7f2bae4e0d216b83290e2c89a38ad55628c67bd5b7460c4e9492db601efe3c936ccb6ef0504b22b6c021cef8d0ea607b6c061db023d9a1ad594c196e7ceeae9d2bbfcc268521f17c8825777faa55b654684dd5044d78c865468d5df7cf59cf5a9fbed34431a612280de46aa4a1c13f1f44573c9c3f1d611b1f2191f16735c795b88d6a25093ec9f6cc5d69835981300e712a9226c97fc87c98ce4c32e6f0ab124d96a6a8ebdc61934465336081c127551f150d961fe240316da19450c5bdc53b3722fd3166de35b365346007267f8411011234e76983927dc02486881614648e32d52d285d550398afe09abb530cdd3471901ee456bac17af410deee4e4c6819bdfda1b3ecc251678c0c53ba75f3abcb315cb2602817190a25d601ab0b6b76b1c6d8cfa4d8935fd7432868397df83bba2d21dfc42e5082ad645bf5080a962799be250f5f6d02ae6eeb1cac52df950c085fabcc82d635114579037fb6f88d4385a07c39328c110c80b4102620b965d4393679550684b937ead67cee2d6d6b8758a939c19c1856c33567bbe3ddd89bbcf402ce9252a2f460d560220fb1bc9864a7068735ebf54f4c09420681235786bb0b0ef45f05a2f41cac3312eb3fdbe6df45fbe3ea3daaead4d3f9a4d43c3d982cab3e21088af2deed436dce18de35b5dae7927b19e661df28806a35539053852b476c0f8f242b04fb2facb266f1a80f122e1b00255c7cddbf50be9c75bc36241fd453e25743f848c6a3ef6bc3d0f98f92d622b269f16412aac6b95cd14a9f1e40e640860f19339cd69631f8ef3cfc552bce49cdc1717e3a7d349ef721a8658c246a01632db30c83c97022639d7f621f79d0564b9328ebc2c552f45e9625e807e33b1af1c1365b80a8711f66591aa3bb42b01ad987770606b0eefd848b4077e353db53b7ed6c91d25c54aff0c4e7fb8fba386e07845b426b307f91f091b6734a27d13fba280d6044354ec2b11891a36e5910fdea54c7d5b7c48f9e26ec0ba3380edf2de97175340cadd4e886690e191afe043894748b4191ac78b8855acdd63dbd207396088f4137ff00e4be8d52ab8c7e644264bcd3c5215e0b3ef682794d7199f0525b06750ef72a2ff702defee14175909de62c89b689b6eb2e9155535db41220731cd32e261603ddb13975052040e181d2b862134bf5a77511a900c9b870d2fe25a1aef756347f8b9034197fc5ca65677eed011b360c60befc66d572b1c0079e6b71cd77c9a6c18d819a6111b4c1ceb2ba355776584cbccf251eb3ca8b4d20b502007b0d4731dd1f565836f0ec9721031f494deb3e46cd11ae7c6c434b099ea8045d52a0db65335a0133dd42b33bd64f177c1ad474ca19c002523b8b776afc1f3e0401cdcb8b121f76b90d9f46cc3debbc9122e5b6b62c79d1812ed0b6485c680c9bdb7ff1e7f72cf93bce3f21f14266bc37f557ad1edf8fee278e2b6647d5376c6a0faafae6fd7ab4201ed0ecfd836921dbfef1c6e319f78e5e4522b1bd0cb978b8dfcb341af759e1dfc2d1465a91b4084afe94da555de1a9e4c90756140c7d88faaaa45a0701c55008c67df0217ee881b9d9a33cd8785c8806429d25541c0886ced9803927f4312053db9f681b0ec8676115cfa7679ab2864664d1493bdd7bd1905f904d701833dca918d637c11a9b3e73658616ba0ab81ed007bf85d301a597ef740025670b8cc28c562835ab801cc39e5ea64c4e33bad381bf4b78bf781919c86b327e4d3304c34b0128c8624f5f7d62490a192a86633e66a94a0726f907b0cdfa42e28cdbf0a108e58a8ed98fe04202003a658e68a0a604858f2065dd9d224a1106bcd6992c838860cecdd1b2a3854b9b62fee7ed6b6ede4936a9da1342f7a8bc0000000487a9a664e37cea3d0a7d85ae7f2116307d6a490f273b920af3280a51cac68b1b7795a38801adbbb3bc5c970ffd17845386826a4f59bd3e1ffd781c8d635561e229dc7479ea2f79602dd67082b23fb792105af6471e3587e67331f9571f45014187e2bd2b715754627c81277cf8cebc8b50233e3277b9ad50079536d204cefdaf870503ec4563935ddf816e2c60e90ce3a57c625cb12c101c7735e0c430ef0f380e7c6d67782a6ea5281b5d9b68f49ff82a8873426eed378b4e34107d3726c61385ce8823536e32c27c8fda6df9b320cafa12ddeef6c0037727216aa7d01edc1faf3c3830d6eada6d86b709e680d7b75db378177ef1954c977e54f7510ec75119d4dc0452824e90420090da5bab82622c12097d1119327bf215ea11078564fe80b5ca2ff195cf159c485876f9395114bbdb0adc6b8fe61ffb53ab224f481c0fcbfc6763ab9bb6d1ade65e75a50519f1a88392df728336d8b18fc538cf26d3e0c036e1d6bf1cccf2ec9ee22ef49a4da193a9307d6872348fee3da2f49ebdca51a76c9168d8c657da0966f8432f8bef8024afccad3aac025d9c4414bba5370f533e46b56a4b873aeb0d0e88563b94238fd04359e12e83ca65d749d9a532532c3eb9';
    expect(serializedTx.toString('hex')).toEqual(expected);
});

test('test create + deserialize v0 credentialDeployment', async () => {
    const identityInput: IdentityInput = getIdentityInput();

    const cryptographicParameters = JSON.parse(fs.readFileSync('./test/ci/resources/global.json').toString()).value;
    if (!cryptographicParameters) {
        throw new Error('Missing global');
    }

    const publicKeys: VerifyKey[] = [
        {
            schemeId: 'Ed25519',
            verifyKey: 'c8cd7623c5a9316d8e2fccb51e1deee615bdb5d324fb4a6d33801848fb5e459e',
        },
        {
            schemeId: 'Ed25519',
            verifyKey: 'b6baf645540d0ea6ae5ff0b87dff324340ae1120a5c430ffee60d5f370b2ab75',
        },
    ];

    const threshold = 1;

    // Intentionally use a credential index that has already been used. This means that
    // the transaction will not succeed, but it should still be received by the node.
    const credentialIndex = 0;

    // The attributes to reveal on the chain.
    const revealedAttributes: AttributeKey[] = ['firstName', 'nationality'];

    const expiry = TransactionExpiry.futureMinutes(60);
    const credentialDeploymentTransaction: CredentialDeploymentTransaction = createCredentialDeploymentTransaction(
        identityInput,
        cryptographicParameters,
        threshold,
        publicKeys,
        credentialIndex,
        revealedAttributes,
        expiry
    );
    const hashToSign = getCredentialDeploymentSignDigest(credentialDeploymentTransaction);

    const signingKey1 = '1053de23867e0f92a48814aabff834e2ca0b518497abaef71cad4e1be506334a';
    const signingKey2 = 'fcd0e499f5dc7a989a37f8c89536e9af956170d7f502411855052ff75cfc3646';

    const signature1 = Buffer.from(await ed.signAsync(hashToSign, signingKey1)).toString('hex');
    const signature2 = Buffer.from(await ed.signAsync(hashToSign, signingKey2)).toString('hex');
    const signatures: string[] = [signature1, signature2];

    const serialized = serializeCredentialDeploymentTransactionForSubmission(
        credentialDeploymentTransaction,
        signatures
    );

    const deployment = deserializeTransaction(serialized);

    if (deployment.kind !== BlockItemKind.CredentialDeploymentKind) {
        throw new Error('Incorrect BlockItemKind');
    }
    if (deployment.transaction.credential.type !== 'normal') {
        throw new Error('Incorrect deployment type');
    }

    // TODO: Check correctness of proofs
    const { proofs: deserializedProofs, ...deserializedValues } = deployment.transaction.credential.contents;
    const { proofs, ...values } = credentialDeploymentTransaction.unsignedCdi;
    expect(deserializedValues).toEqual(values);
    expect(BigInt(deployment.transaction.expiry)).toEqual(credentialDeploymentTransaction.expiry.expiryEpochSeconds);
});

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
    const input = JSON.parse(fs.readFileSync('./test/ci/resources/credential-input-no-seed.json').toString());

    const expiry = 1722939941n;
    const output = createCredentialTransactionNoSeed(input, TransactionExpiry.fromEpochSeconds(expiry));
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
