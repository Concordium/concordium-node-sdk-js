import { Buffer } from 'buffer/index.js';
import fs from 'fs';
import JSONBig from 'json-bigint';
import path from 'path';

import {
    ConfigureBakerHandler,
    ConfigureDelegationHandler,
    DeployModuleHandler,
    InitContractHandler,
    RegisterDataHandler,
    SimpleTransferHandler,
    SimpleTransferWithMemoHandler,
    UpdateContractHandler,
    UpdateCredentialsHandler,
} from '../../src/accountTransactions.ts';
import {
    AccountTransactionType,
    CcdAmount,
    ConfigureBakerPayload,
    ConfigureDelegationPayload,
    ContractAddress,
    ContractName,
    DataBlob,
    DelegationTargetType,
    DeployModulePayload,
    Energy,
    IndexedCredentialDeploymentInfo,
    InitContractPayload,
    ModuleReference,
    OpenStatus,
    Parameter,
    ReceiveName,
    RegisterDataPayload,
    SequenceNumber,
    SimpleTransferPayload,
    SimpleTransferWithMemoPayload,
    UpdateContractPayload,
    UpdateCredentialsPayload,
    getAccountTransactionHandler,
    getAccountTransactionSignDigest,
    serializeAccountTransactionPayload,
} from '../../src/index.js';
import { AccountAddress, TransactionExpiry } from '../../src/pub/types.js';

const senderAccountAddress = '4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M';
const expiry = TransactionExpiry.fromDate(new Date(1675872215));

test('configureBaker is serialized correctly', async () => {
    const expectedDigest = 'dcfb92b6e57b1d3e252c52cb8b838f44a33bf8d67301e89753101912f299dffb';

    const header = {
        expiry,
        nonce: SequenceNumber.create(1),
        sender: AccountAddress.fromBase58(senderAccountAddress),
    };

    const payload: ConfigureBakerPayload = {
        stake: CcdAmount.fromMicroCcd(1000000000n),
        restakeEarnings: true,
        openForDelegation: OpenStatus.ClosedForAll,
        keys: {
            aggregationVerifyKey:
                'ad8e519b6a7f869780a547b6aade0aeb112a7364160b391fc179d68792388cd99d3b60c2037964abbadaf22bfded67b913eed9ac246f2fc39c3eff7c7060838e320fea1419c9282159e56ae5aef1291d31ba34ad389c9571e4d83cf65509bb57',
            electionVerifyKey: 'adbf30d103c08cd4960b6e559ef9bd97427f5160d611eeba4507a116e0aa8cb3',
            proofAggregation:
                'c9c98d80869b56e51c57ea668aec00a62280268b595f113f801bcf205d996d22056b2779ce547874829f41dd81c267979ee5576aa8e5c0d090b3ad68752fb74b',
            proofElection:
                'd9102e9eb0e6d527df37a576fd09e218d3f2c5ff28a656f49fd02d81bec58a0dcfbb79be0ef9bad74cbc73522e769e912cc8541e058be0d8b654e1e7bed9780e',
            proofSig:
                'e033f3293c388b7388bcb7db01d6052c8ba869d6c8aa6ddba0d3b6dca288f30748ce47e87e368cd323e787fc5e2f48f34311d80bb39a9915551c09c81d97e80d',
            signatureVerifyKey: 'e278cf4ae4f354833732c27aa2649559c450da1c73b2a29d50d258d9c3459727',
        },
        metadataUrl: 'test.com',
        transactionFeeCommission: 1,
        bakingRewardCommission: 1,
        finalizationRewardCommission: 1,
    };

    const handler = getAccountTransactionHandler(AccountTransactionType.ConfigureBaker);
    const transaction = handler.create(header, payload);

    const signDigest = getAccountTransactionSignDigest(transaction);

    expect(signDigest.toString('hex')).toBe(expectedDigest);
});

test('Init contract serializes init name correctly', async () => {
    const header = {
        expiry,
        nonce: SequenceNumber.create(1),
        sender: AccountAddress.fromBase58(senderAccountAddress),
    };

    const initNameBase = 'credential_registry';

    const payload: InitContractPayload = {
        amount: CcdAmount.fromMicroCcd(0),
        initName: ContractName.fromString(initNameBase),
        maxContractExecutionEnergy: Energy.create(30000),
        moduleRef: ModuleReference.fromHexString('aabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd'),
        param: Parameter.empty(),
    };

    const handler = getAccountTransactionHandler(AccountTransactionType.InitContract);
    const transaction = handler.create(header, payload);

    const serializedTransaction = serializeAccountTransactionPayload(transaction);

    // Slice out the init name part of the serialized transaction.
    const serializedInitName = serializedTransaction.slice(43, serializedTransaction.length - 2).toString('utf8');

    expect(serializedInitName).toEqual('init_credential_registry');
});

test('SimpleTransferPayload serializes to JSON correctly', async () => {
    const payload: SimpleTransferPayload = {
        amount: CcdAmount.fromMicroCcd(1000000000n),
        toAddress: AccountAddress.fromBase58(senderAccountAddress),
    };
    const handler = new SimpleTransferHandler();
    const json = handler.toJSON(payload);

    const actual = JSONBig.stringify(json);
    const expected = '{"toAddress":"4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M","amount":"1000000000"}';
    expect(actual).toEqual(expected);

    // ID test
    expect(handler.fromJSON(JSONBig.parse(expected))).toEqual(payload);
});

test('SimpleTransferWithMemoPayload serializes to JSON correctly', async () => {
    const payload: SimpleTransferWithMemoPayload = {
        amount: CcdAmount.fromMicroCcd(1000000000n),
        memo: new DataBlob(Buffer.from('test', 'utf8')),
        toAddress: AccountAddress.fromBase58(senderAccountAddress),
    };
    const handler = new SimpleTransferWithMemoHandler();
    const json = handler.toJSON(payload);

    const actual = JSONBig.stringify(json);
    const expected =
        '{"toAddress":"4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M","memo":"000474657374","amount":"1000000000"}';
    expect(actual).toEqual(expected);

    // ID test
    expect(handler.fromJSON(JSONBig.parse(expected))).toEqual(payload);
});

test('DeployModulePayload serializes to JSON correctly', async () => {
    let payload: DeployModulePayload = {
        version: 1,
        source: Buffer.from('test', 'utf8'),
    };
    const handler = new DeployModuleHandler();
    let json = handler.toJSON(payload);

    let actual = JSONBig.stringify(json);
    let expected = '{"source":"74657374","version":1}';
    expect(actual).toEqual(expected);

    // ID test
    expect(handler.fromJSON(JSONBig.parse(expected))).toEqual(payload);

    // Test no version
    payload = {
        source: Buffer.from('test2', 'utf8'),
    };
    json = handler.toJSON(payload);
    expect(handler.fromJSON(JSONBig.parse(JSONBig.stringify(json)))).toEqual(payload);

    actual = JSONBig.stringify(json);
    expected = '{"source":"7465737432"}';
    expect(actual).toEqual(expected);

    // ID test
    expect(handler.fromJSON(JSONBig.parse(expected))).toEqual(payload);
});

test('InitContractPayload serializes to JSON correctly', async () => {
    const payload: InitContractPayload = {
        amount: CcdAmount.fromMicroCcd(1000),
        initName: ContractName.fromString('test'),
        maxContractExecutionEnergy: Energy.create(30000),
        moduleRef: ModuleReference.fromHexString('aabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd'),
        param: Parameter.fromBuffer(Buffer.from('test', 'utf8')),
    };
    const handler = new InitContractHandler();
    const json = handler.toJSON(payload);

    const actual = JSONBig.stringify(json);
    const expected =
        '{"amount":"1000","moduleRef":"00000020aabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd","initName":"test","param":"74657374","maxContractExecutionEnergy":30000}';
    expect(actual).toEqual(expected);

    // ID test
    expect(handler.fromJSON(JSONBig.parse(expected))).toEqual(payload);
});

test('UpdateContractPayload serializes to JSON correctly', async () => {
    const payload: UpdateContractPayload = {
        amount: CcdAmount.fromMicroCcd(5),
        address: ContractAddress.fromSchemaValue({ index: 1n, subindex: 2n }),
        receiveName: ReceiveName.fromString('test.abc'),
        message: Parameter.fromBuffer(Buffer.from('test', 'utf8')),
    };
    const handler = new UpdateContractHandler();
    const json = handler.toJSON(payload);

    const actual = JSONBig.stringify(json);
    const expected = '{"amount":"5","address":{"index":1,"subindex":2},"receiveName":"test.abc","message":"74657374"}';
    expect(actual).toEqual(expected);

    // ID test
    expect(handler.fromJSON(JSONBig.parse(expected))).toEqual(payload);
});

test('UpdateCredentialsPayload serializes to JSON correctly', async () => {
    const cdi = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'resources/cdi.json')).toString());
    const credentialDeploymentInfo: IndexedCredentialDeploymentInfo = {
        index: 0,
        cdi,
    };

    const payload: UpdateCredentialsPayload = {
        newCredentials: [credentialDeploymentInfo],
        removeCredentialIds: ['123', '456'],
        threshold: 5,
        currentNumberOfCredentials: 2n,
    };
    const handler = new UpdateCredentialsHandler();
    const json = handler.toJSON(payload);

    const actual = JSONBig.stringify(json);
    const expected = `{"newCredentials":[{"index":0,"cdi":{"credentialPublicKeys":{"keys":{"0":{"schemeId":"Ed25519","verifyKey":"d684ac5fd786d33c82701ce9f05017bb6f3114bec77c0e836e7d5c211de9acc6"},"1":{"schemeId":"Ed25519","verifyKey":"df70d598d7cf8954b7b6d27bee2b94c4f2f5540219573bca70600c7cde39e92d"},"2":{"schemeId":"Ed25519","verifyKey":"6f2da81a8f7d6965d720527d31c05efdb197129ed54fee51500b2c1742b3a43a"}},"threshold":2},"credId":"a5727a5f217a0abaa6bba7f6037478051a49d5011e045eb0d86fce393e0c7b4a96382c60e09a489ebb6d800dc0d88d05","commitments":{"cmmPrf":"abcdef","cmmCredCounter":"2","cmmIdCredSecSharingCoeff":["1","2","3","4","5"],"cmmAttributes":{},"cmmMaxAccounts":"3"},"ipIdentity":0,"revocationThreshold":5,"arData":{"1":{"encIdCredPubShare":"a458d29cdf02ae34d2ae9b11da12a20df1cb2f0051f50547ca975c1916334443f8654198ffd55763274d7663b3f71def89950e178445b2c080de77cbe66bf16716808124af92b99f4d042568a8ac178a51050b04c073e5400a8e89dce61290fd"},"2":{"encIdCredPubShare":"b84f64cb45ff97d96380dd94324c99f850bcde2cb16eefade2775b2cf0f8183349766468a2ee0f855aa6b7beb585967fa798439b0e02a3181b5b27b22ec4926b1927d4b4c81c6a2dd7e1c850c902c1e3a4d730b0af41ca522d5ccb613416a64f"},"3":{"encIdCredPubShare":"944c9009adfecee0ad2cf613b73b80a28228e1e1daf6f0d7a7e3d35bc88d18c267835b3e47fc01afc1d51f8639a4cad48aed53c2630f015b9b8eddda5fd93f5856da962456edd05c3a70d4bccf75a552cc0ec4edd65afd7eb526264edb5ff884"},"4":{"encIdCredPubShare":"a6d8667d09800553890d8f285454825d277c42d55e96ed11774939d333059e63ae5fc72ef6fefbc81c65fa37b1e3763a8b2cef934b1d2ddfd26f8227a074204e3343a4dcd3e17f88838964c30adfeb9b00b12973627178fac4aeb88771d30510"},"5":{"encIdCredPubShare":"a4f83b6ec95ca1417aa3a90f6108916b10bdbec85a514655f142ed38b02760364246510be006d7d001cc6c6c839bae72899c10ad29ca8feb171330feacf066c88f3b9617ce99ea44e56be8c57b50ea1865ba73585012bbc8b1035e0c73fb557c"}},"policy":{"validTo":"202205","createdAt":"202005","revealedAttributes":{"lastName":"31"}},"proofs":"8de04f30f49ae527b47849db1b47ce552d7418b80db2cba081fdf3633d5603447ae7ec23d9f7dc1cf5ab1d6b3cdffac396ee4c6c4729fc3f1e9522106aa1ba8c4f520a7723cdb448a0a173e6303668856059fbc451c2e0fad097bea790495141a2777040540cebb08c901d1e6f02558b066270a386f37d1c5e2bc43d9993ddaae856ea4c797dd6a87c2492099e644de98dc05433eedcbb889836585c219c4511e15a0ccd482ce13a6dcf3925972bedc57d39ce7c66dd3f543e2fe6a56c162c28b8787bf461820596b23eee6c8eeccc9033e0a58131680e27eff1abe79335cd839335607ab92da5c59108d4f40d8d550e00010081b4666e437108d43118aa99b49ffd1d0c0ae50582c98ea8e579dcd7915766affc1b7f43c6eacf7f3cb4a5277f364ddf000000000000000581d0c77cfd5d4a2cad61af4e297c3758e9b124e795175f6a38df4359b4a3fdb72a1425b4f3b24c506d3ec1b01f88e9c6b8a09102d73cb8595dd6451b379ea10c448af16240bbb9f17dbdc82cc618b502804ecfae627b1b98dca9caf9f6e58877a42ceb77aec5b8f23b23e1964972a91b7a7a2ba3a26f988b5a8d9686e322be424263a5d7633fcf0bd6c08c01b1ed56c591a5de15fdd9615adea505ce5826ea856cd416d9d9d7cbffa9707b29767d3d828546d0d70dc65548e4f7ebc137161a06a5c244cec74ac7532dfae1a55d6f72b17183cdac5efb6dadb05b5fa9190886cd22dab6af2c529b78c94f172614fb4566fd0a40d21729a8dc162172b391a016010663a8d218e0a2619e3c1078e350171d000000050000000156f626c9797ba29d4f25d0e3fb13bf123fafa0fddd1904e00f8bfbcd58a21d88271593d2ec15a4a5f221e5cb323affe74d3b2fb079d9383e51e4d28a3974909c25f89d29e7d46a0be7d53d06419ecaa25a7d5a0709cc4042530b7a786fcf059f00000002264be8a2a42bc92545f2b3097245c32d73f9af158b2043149ad11dccd18a3e2866a07ff991d62b4e1095e4a38886e039920515645225a4cc7ed1a95dc441c8452b4ba0c6ddd22b18bda5f8f95de768b363c06be021bbd2b3866c19033b07544a00000003264fc3e92b8b4fb305e2ae4fd489185c0b2db6f17fee2b8322a4d616bc6bbdc5646354ab202cca69f8e048818fc1a7cca118c4c781e48717a74a9722b9808d3a396aeba5b3a202c70b80069f49e90abfd8c273f907ed152deef3ca94d152c0ba000000041e7beb80ce73f7cb51af2c7f88343a9034ccd3c9016864a54e53ce62bcb228fc6b0130690cc2f6464b6f15bd46ca1a14a771f9295dc159f1751efc854b112d38704682a1e69833de7d1dcd897530b95425c64a047da9c2eec8f378371e89ac1c0000000512e0ae9fec6bc90a82f401d873d166d37af6c7036fa0e4b7bb165bfb51793a1d31b2ba053a4f1033ce2fba48b5fb9627bfbc54b6b80e4a12f5dad6b5c9a69be21c66db79ea672b27e769417f0580981eb74270588af4d168cb55d35ec07cad5c6371eb5ae9ebcf2e6dc3528e2c23ee60f8457cf0a7ad37ac8a0738a7024154a8000000080757f2f50fbc24693d6123840db7816b061625b5db543cf2dfa0ed97d6a4580f080031487225c5a4c6f8137c6ed22b62e3c7147208335d44e8960a731ee9d9281e36dd40960ff56e1d9f1c6b5a113b2ad7273a13d436a0c907723160d3dd583822ca004f5aa5baed781f60fd517a52476aa1418179cdef8be6e9008b39600864319e1726df94f871aee2503e58b550754857e103c11e61088e2832071d77aae86d910bac00430c87d49fb8fbc1772c380accf943ed7ce8027b7082bc1c0ab96701744a37de324ace32d012eead95938a82a0a5e13100a02e3d3018b7dc30ea9b5ef9a53397eaa75097c94496dff9cc7f4a3306bcb2109add64308f8f0dce7863729995d755f16982168cfd8da56b6d8372a92c1b66dc5e473f20f2cca797cb0021755fb84d154d906dd024909af27df61eba71956790dba63e05d53d3dda18cc164a847e6ea7c85d5bb098a9700fbbe44a14c0ad3740d8676bdf5f658ba833fe2581d28265a98699a42fcc64f0af2594d8de352f169cdef7f9676ede3e29ceb3273329f3141432a0f82fc21b9962886bdf03bcd7c08edf916f7729c83f8dc1af6dbc8baa1999977e65462802c6e079797c8f8a856ed318c140e9d158adc8a7af03bab3027f4c5f38459ad8bee1ca254a05b8e0fc3f3362d0a37230d981ee1dbf505177c36e4cec2c28f25cee5f58b995aa4ae9814ec6dbd8eeaffface9b784ea6c37c4556f98ca84dc87a2aa02c686d624a96897a48146ee84ea7053414685c83e2d054d819295eb2fa7deaebbcce36bd5d0bf616a24027139bd535a87fd6d05541fa7241c2faba915b9efec6f8e18e1aeac96c51f29fdf47297a8dda26624015fa7bbce725d73c6fbfcd992270459e42a4e8c10ecf98c1cb8e92b49588db0ee3c672f0419b96b90bce28005e8ce61ef12db46ea28bf78e069e2906009b836fc03005ff4b9177d0ca17945439c9cbab5c8925b1dee3fcc3f38bf531972c27ca12e2f9f63d10e202dd3d4133e841ff4d18f85699d093be56b420494a16990a005130b016f8c01ece174d5513e67a843388c60a254d720c989fafc3aca223259b78f32159f26539236c7b7f41bc7bac0b705c645a316af1a35542e60b10e668a03881e0f02167738c36bbadd7f2b9ecce6bceea81c2f66c87417e001037d86a20dd592201e2a5e8432d47ea459f5025725a09e2f7d13a5876cb8fc83c6cfd67b143a305204a830c829dbbb57a14dd16ccadfbd2931765e77b75e21050d7a12cb7e3c18e293eb4eb8eb6f347a533231e7f779f635c08baba6971ed89b35c764f3c4c2cc791cc9fc6515a9d0fb4f32d61ce8e553a4d29c24125515885a6ea38446f26011da81a157b898a914542bd13102dc32fef0045d88dfccbff7b8614b35c95e6db61e96d37a22f685d6f5a58173ef1c9d70fce0883dc84609835d57ac8015ba8bdcc62b24fe8c66097a0cfadd4acb90334d03d6b8e47287670dc1bff24563df60aea1cf62d05dad3da072d19b6b15d2f60d5f678652a871a15e5c7cf1424fe0140d3b4772849b099a36c46135fdf1bc54e07871dcfe3cbd84ec5e815ecaa9dc698442506d2bffa7fe29b5de209d8bdebb91ee036c45b44beb7abd6694b15b5f1daa4fd900000004893d20bff691738bc05d5f64ec440ba1b5230a745cd5a1aba5ea5c825fb6c3207cf7c9031b2e0973f71def0c8bd6b6deb31d25df2c11c98d4971c61d74ad9d775b78459bf53f90ca5cf022d79b229a7193a1d8553bab369539bfdfd48979778c86bf2d3dfa160aecab9d2c25b8234a9142393edbc22b13eff31014671f22d33482ed69b305ecb3fcaac42785c4fe5bc496d920d1c56d7c37fb706874c142be02f884955bdedf1d55f810ada375d6d159ec14d4afbc20a4d102f694fb0df8993a8954b5794d6a9674faac3c34d29c893d8fb1fde8f7edfc023a77668dc48d3c7217d2dcc1b3f22609668752f9bebf970d880948ffd35831fa9f6745cc5cc181fb93acf110d05453fd5dcf9d71c052bf8ff2bf9bed978a4afe50bc35de97afb83cb813d25c06794f7c7450c296df24985dda1e7a74eb8e3357bb2582444b54a986cfebde872b47dd83def6f21c736365b7a6184ec3040caa8184ee3dcd05b4cb75d6bc0c159647a59bd26a3ac193b571bd9261c8241ca5d529eab45abd725a8e9d5dea08a4b504b8d0ae5a398f270555e24c013350f77467b2186f3c775b1396a1434f6ec4cf51fa5c6ee8688c6e4c73ec67f1be9c742d3c6ab1c916159191d741"}}],"removeCredentialIds":["123","456"],"threshold":5,"currentNumberOfCredentials":2}`;
    expect(actual).toEqual(expected);

    // ID test
    expect(handler.fromJSON(JSONBig.parse(expected))).toEqual(payload);
});

test('RegisterDataPayload serializes to JSON correctly', async () => {
    const payload: RegisterDataPayload = {
        data: new DataBlob(Buffer.from('test', 'utf8')),
    };
    const handler = new RegisterDataHandler();
    const json = handler.toJSON(payload);

    const actual = JSONBig.stringify(json);
    const expected = '{"data":"000474657374"}';
    expect(actual).toEqual(expected);

    // ID test
    expect(handler.fromJSON(JSONBig.parse(expected))).toEqual(payload);
});

test('ConfigureBakerPayload serializes to JSON correctly', async () => {
    let payload: ConfigureBakerPayload = {
        stake: CcdAmount.fromMicroCcd(1000000000n),
        restakeEarnings: true,
        openForDelegation: OpenStatus.ClosedForAll,
        keys: {
            signatureVerifyKey: 'abcdef',
            electionVerifyKey: 'abcdef',
            aggregationVerifyKey: 'abcdef',
            proofAggregation: 'abcdef',
            proofSig: 'abcdef',
            proofElection: 'abcdef',
        },
        metadataUrl: 'http://example.com',
        transactionFeeCommission: 1,
        bakingRewardCommission: 1,
        finalizationRewardCommission: 1,
        suspended: true,
    };
    const handler = new ConfigureBakerHandler();
    let json = handler.toJSON(payload);

    let actual = JSONBig.stringify(json);
    let expected =
        '{"stake":"1000000000","restakeEarnings":true,"openForDelegation":2,"keys":{"signatureVerifyKey":"abcdef","electionVerifyKey":"abcdef","aggregationVerifyKey":"abcdef","proofAggregation":"abcdef","proofSig":"abcdef","proofElection":"abcdef"},"metadataUrl":"http://example.com","transactionFeeCommission":1,"bakingRewardCommission":1,"finalizationRewardCommission":1,"suspended":true}';
    expect(actual).toEqual(expected);

    // ID test
    expect(handler.fromJSON(JSONBig.parse(expected))).toEqual(payload);

    payload = {
        stake: CcdAmount.fromMicroCcd(1000000000n),
        restakeEarnings: true,
        openForDelegation: OpenStatus.ClosedForAll,
    };
    json = handler.toJSON(payload);

    actual = JSONBig.stringify(json);
    expected = '{"stake":"1000000000","restakeEarnings":true,"openForDelegation":2}';
    expect(actual).toEqual(expected);

    // ID test
    expect(handler.fromJSON(JSONBig.parse(expected))).toEqual(payload);
});

test('ConfigureDelegationPayload serializes to JSON correctly', async () => {
    let payload: ConfigureDelegationPayload = {
        stake: CcdAmount.fromMicroCcd(1000000000n),
        restakeEarnings: true,
        delegationTarget: {
            delegateType: DelegationTargetType.Baker,
            bakerId: 5n,
        },
    };
    const handler = new ConfigureDelegationHandler();
    let json = handler.toJSON(payload);

    let actual = JSONBig.stringify(json);
    let expected =
        '{"stake":"1000000000","restakeEarnings":true,"delegationTarget":{"delegateType":"Baker","bakerId":5}}';
    expect(actual).toEqual(expected);

    // ID test
    expect(handler.fromJSON(JSONBig.parse(expected))).toEqual(payload);

    payload = {
        stake: CcdAmount.fromMicroCcd(1000000000n),
        restakeEarnings: true,
        delegationTarget: {
            delegateType: DelegationTargetType.PassiveDelegation,
        },
    };
    json = handler.toJSON(payload);

    actual = JSONBig.stringify(json);
    expected = '{"stake":"1000000000","restakeEarnings":true,"delegationTarget":{"delegateType":"Passive"}}';
    expect(actual).toEqual(expected);

    // ID test
    expect(handler.fromJSON(JSONBig.parse(expected))).toEqual(payload);

    payload = {
        restakeEarnings: true,
    };
    json = handler.toJSON(payload);
    expect(handler.fromJSON(JSONBig.parse(JSONBig.stringify(json)))).toEqual(payload);

    actual = JSONBig.stringify(json);
    expected = '{"restakeEarnings":true}';
    expect(actual).toEqual(expected);

    // ID test
    expect(handler.fromJSON(JSONBig.parse(expected))).toEqual(payload);
});
