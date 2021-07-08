import { credentials, Metadata } from '@grpc/grpc-js';
import ConcordiumNodeClient from '../src/client';
import { ConsensusStatus, NormalAccountCredential } from '../src/types';
import { instanceOfNormalAccountCredential, isHex } from '../src/util';

const metadata = new Metadata();
metadata.add('authentication', 'rpcadmin');
const client = new ConcordiumNodeClient(
    '127.0.0.1',
    10000,
    credentials.createInsecure(),
    metadata,
    15000
);

test('account info for invalid hash throws error', async () => {
    const accountAddress = '3sAHwfehRNEnXk28W7A3XB3GzyBiuQkXLNRmDwDGPUe8JsoAcU';
    const invalidBlockHash = 'P{L}GDA';
    await expect(
        client.getAccountInfo(accountAddress, invalidBlockHash)
    ).rejects.toEqual(
        new Error('The input was not a valid hash: ' + invalidBlockHash)
    );
});

test('account info for unknown block hash is undefined', async () => {
    const accountAddress = '3sAHwfehRNEnXk28W7A3XB3GzyBiuQkXLNRmDwDGPUe8JsoAcU';
    const blockHash =
        'fd4915edca67b4e8f6521641a638a3abdbdd7934e4f2a9a52d8673861e2ebdd2';

    const accountInfo = await client.getAccountInfo(accountAddress, blockHash);
    return expect(accountInfo).toBeUndefined();
});

test('account info for unknown account address is undefined', async () => {
    const accountAddress = '3sACwfehRNEnXk28W7A3XB3GzyBiuQkXLNRmDwDGPUe8JsoAcU';
    const blockHash =
        '6b01f2043d5621192480f4223644ef659dd5cda1e54a78fc64ad642587c73def';

    const accountInfo = await client.getAccountInfo(accountAddress, blockHash);
    return expect(accountInfo).toBeUndefined();
});

test('retrieves the account info', async () => {
    const accountAddress = '3sAHwfehRNEnXk28W7A3XB3GzyBiuQkXLNRmDwDGPUe8JsoAcU';
    const blockHash =
        '6b01f2043d5621192480f4223644ef659dd5cda1e54a78fc64ad642587c73def';

    const accountInfo = await client.getAccountInfo(accountAddress, blockHash);

    if (!accountInfo) {
        throw new Error('Test failed to find account info');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let normalAccountCredentialExpects: any[] = [];
    if (
        instanceOfNormalAccountCredential(
            accountInfo.accountCredentials[0].value
        )
    ) {
        const normalAccountCredential: NormalAccountCredential =
            accountInfo.accountCredentials[0].value;
        normalAccountCredentialExpects = [
            expect(normalAccountCredential.contents.credId).toEqual(
                'a8e810a15eeefcdd425126d6faed3a45fdf211392180d0fb3dc7e9e3382cb0dc6ce8e0d8bc46cfb6cfbb4ea5d8771966'
            ),
            expect(
                normalAccountCredential.contents.revocationThreshold
            ).toEqual(2),
            expect(
                normalAccountCredential.contents.arData['1'].encIdCredPubShare
            ).toEqual(
                '8dbed4968d346683084f76c369a05571fb31ba8627a39fac5114f175a958bc6afc870aeee41f3886a32a655c61b7a07491a6130545f9a6e11755242a384bc5e61d858405e471283212acd11609a319644dc89dd452785c3a96acee6064d2c580'
            ),
            expect(
                normalAccountCredential.contents.arData['2'].encIdCredPubShare
            ).toEqual(
                'a7e7a1dbc5e3d154ac1e21b7a4a1d40419a62a3e47d0d5c1503842077a946e38d398fc1c74825dbcbd3c90599c1ba647a292927a2a595dc4b7505f80a61277bc6e1bfc16243d2a79d29bfe3867b87bbdc4bd45fc39bd2eee74e07fa52f595a74'
            ),
            expect(
                normalAccountCredential.contents.arData['3'].encIdCredPubShare
            ).toEqual(
                '979ae3097837f43873f741b688bb11aabd5ceb5e38ed58f04928a5afdd419873ce17f2bffa576b613e0eac48af921444a4fd28a6bbdd1e6f500a27fb9f686f5199798a9984f85f0b7d413156d86bcefe0dfd460fa3a9b878b3a3aedd9057760d'
            ),

            expect(normalAccountCredential.contents.commitments.cmmPrf).toEqual(
                '83dc504ba2a0f06eb67f31d8a8366ae8200b09db831ca2debbf567b6d4d8d575868ba678aa492d01cf48c2e53028af05'
            ),
            expect(
                normalAccountCredential.contents.commitments.cmmCredCounter
            ).toEqual(
                'b8deddcbecd5fe65f520c4d2dfc3ff9570bcb1f84c87f45452928bc1398636eeca6f3f5b3676963ebcd4eadf33a427b6'
            ),
            expect(
                normalAccountCredential.contents.commitments.cmmMaxAccounts
            ).toEqual(
                'a67b05ac71c85abdf6d5021e0fd83878b2d50b4f308cad1fbe332074cabca5b8e59f06c4feb8866071b8966bef7f86ae'
            ),

            expect(
                normalAccountCredential.contents.commitments
                    .cmmIdCredSecSharingCoeff[0]
            ).toEqual(
                '90cec6faf659c95697313e3b21013bf87dde411ca228d2ddb9cae4fe29f2888713ceab6772b028d56e25cf0e836beb4a'
            ),
            expect(
                normalAccountCredential.contents.commitments
                    .cmmIdCredSecSharingCoeff[1]
            ).toEqual(
                '8c607b073bf7bee83ff388fef8e8b49e838a6f28c038d3017940dc837bd5dc29801848f28e2f2924c98c16f562c067e5'
            ),

            expect(
                normalAccountCredential.contents.commitments.cmmAttributes[
                    'idDocNo'
                ]
            ).toEqual(
                'ad11f12ed8ce15fbcd27667cfdd0358c8e00b3a1bc89fa6dffa2933394c0eaae360125e35fa22bdfe678feeef5fa677b'
            ),
            expect(
                normalAccountCredential.contents.commitments.cmmAttributes[
                    'nationalIdNo'
                ]
            ).toEqual(
                'ab03f0db066ff7f5baf5cf00871299c631e163e1af11ad5a1cac6d1caa8bc7cfaa48fd8181b2504f93dbd9290886af74'
            ),
            expect(
                normalAccountCredential.contents.commitments.cmmAttributes[
                    'firstName'
                ]
            ).toEqual(
                'a513c5c5410cd7dfec0d2291986e56cdb8e29d7a1d8c4e4c395dc285966078200b650f2a4109a4e340560faec090a1fb'
            ),
            expect(
                normalAccountCredential.contents.commitments.cmmAttributes[
                    'lastName'
                ]
            ).toEqual(
                '90e266f4722b49aadc68892ccf47baef6630648bdf21166c35c7a68145fb100e5cf50a7f8b460db7fff8d166c549f7a7'
            ),
        ];
    }

    return Promise.all([
        expect(accountInfo.accountNonce).toEqual(8n),
        expect(accountInfo.accountIndex).toEqual(221n),
        expect(accountInfo.accountAmount).toEqual(458442050n),
        expect(accountInfo.accountEncryptionKey).toEqual(
            'b14cbfe44a02c6b1f78711176d5f437295367aa4f2a8c2551ee10d25a03adc69d61a332a058971919dad7312e1fc94c5a8e810a15eeefcdd425126d6faed3a45fdf211392180d0fb3dc7e9e3382cb0dc6ce8e0d8bc46cfb6cfbb4ea5d8771966'
        ),
        expect(accountInfo.accountThreshold).toEqual(2),
        expect(accountInfo.accountEncryptedAmount.startIndex).toEqual(0n),
        expect(accountInfo.accountEncryptedAmount.selfAmount).toEqual(
            'c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
        ),
        expect(
            accountInfo.accountEncryptedAmount.numAggregated
        ).toBeUndefined(),
        expect(accountInfo.accountReleaseSchedule.schedule.length).toEqual(0),
        expect(accountInfo.accountReleaseSchedule.total).toEqual(0n),
        expect(accountInfo.accountCredentials[0].value.type).toEqual('normal'),
        expect(
            accountInfo.accountCredentials[0].value.contents
                .credentialPublicKeys.keys[0].verifyKey
        ).toEqual(
            '4de8e0c6ca5b2d9361b29179075e01db49b5e58c11d6a9fcf1c0105f404bd812'
        ),
        expect(
            accountInfo.accountCredentials[0].value.contents
                .credentialPublicKeys.keys[0].schemeId
        ).toEqual('Ed25519'),
        expect(
            accountInfo.accountCredentials[0].value.contents
                .credentialPublicKeys.threshold
        ).toEqual(1),
        expect(
            accountInfo.accountCredentials[1].value.contents
                .credentialPublicKeys.keys[0].verifyKey
        ).toEqual(
            '77580ef5f484b69d22a8ede50f21503ec1d4bfff617856c8bc20bb8a9a901585'
        ),
        expect(
            accountInfo.accountCredentials[1].value.contents
                .credentialPublicKeys.keys[0].schemeId
        ).toEqual('Ed25519'),
        expect(
            accountInfo.accountCredentials[1].value.contents
                .credentialPublicKeys.threshold
        ).toEqual(1),
        expect(
            accountInfo.accountCredentials[0].value.contents.ipIdentity
        ).toEqual(0),
        expect(
            accountInfo.accountCredentials[0].value.contents.policy.createdAt
        ).toEqual('202106'),
        expect(
            accountInfo.accountCredentials[0].value.contents.policy.validTo
        ).toEqual('202206'),
        expect(
            accountInfo.accountCredentials[0].value.contents.policy
                .revealedAttributes['nationality']
        ).toEqual('DK'),
        expect(
            accountInfo.accountCredentials[0].value.contents.policy
                .revealedAttributes['idDocType']
        ).toEqual('1'),

        normalAccountCredentialExpects,
    ]);
});

test('next account nonce for unknown address returns undefined', async () => {
    const accountAddress = '3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwGGYt';
    const nextAccountNonce = await client.getNextAccountNonce(accountAddress);
    return expect(nextAccountNonce).toBeUndefined();
});

test('retrieves the next account nonce', async () => {
    const accountAddress = '3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt';
    const nextAccountNonce = await client.getNextAccountNonce(accountAddress);
    if (!nextAccountNonce) {
        throw new Error(
            'Test could not find next account nonce that was expected to be available.'
        );
    }
    return Promise.all([
        expect(nextAccountNonce.nonce).toEqual(6n),
        expect(nextAccountNonce.allFinal).toBeTruthy(),
    ]);
});

test('transaction status for invalid hash fails', async () => {
    const invalidTransactionHash = 'P{L}GDA';
    await expect(
        client.getTransactionStatus(invalidTransactionHash)
    ).rejects.toEqual(
        new Error('The input was not a valid hash: ' + invalidTransactionHash)
    );
});

test('transaction status for unknown transaction hash returns undefined', async () => {
    const transactionHash =
        '7f7409679e53875567e2ae812c9fcefe90ced8961d08554756f42bf268a42749';
    const transactionStatus = await client.getTransactionStatus(
        transactionHash
    );
    return expect(transactionStatus).toBeUndefined();
});

test('retrieves transaction status', async () => {
    const transactionHash =
        'f1f5f966e36b95d5474e6b85b85c273c81bac347c38621a0d8fefe68b69a430f';
    const transactionStatus = await client.getTransactionStatus(
        transactionHash
    );

    if (transactionStatus === undefined || !transactionStatus.outcomes) {
        throw new Error('Test failed to find transaction status!');
    }

    const outcome = Object.values(transactionStatus.outcomes)[0];

    return Promise.all([
        expect(transactionStatus.status).toEqual('finalized'),
        expect(outcome.hash).toEqual(
            'f1f5f966e36b95d5474e6b85b85c273c81bac347c38621a0d8fefe68b69a430f'
        ),
        expect(outcome.sender).toEqual(
            '3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'
        ),
        expect(outcome.cost).toEqual(5010n),
        expect(outcome.energyCost).toEqual(501n),
        expect(outcome.type.type).toEqual('accountTransaction'),
        expect(outcome.index).toEqual(0n),
    ]);
});

test('invalid block hash fails', async () => {
    const invalidBlockHash = 'P{L}GDA';
    await expect(client.getBlockInfo(invalidBlockHash)).rejects.toEqual(
        new Error('The input was not a valid hash: ' + invalidBlockHash)
    );
});

test('unknown block hash returns undefined', async () => {
    const blockHash =
        '7f7409679e53875567e2ae812c9fcefe90ced8961d08554756f42bf268a42749';
    const blockInfo = await client.getBlockInfo(blockHash);
    return expect(blockInfo).toBeUndefined();
});

test('retrieves block info', async () => {
    const blockHash =
        '7f7409679e53875567e2ae812c9fcefe90ced8761d08554756f42bf268a42749';
    const blockInfo = await client.getBlockInfo(blockHash);

    if (!blockInfo) {
        throw new Error('Test was unable to get block info');
    }

    return Promise.all([
        expect(blockInfo.transactionsSize).toEqual(0n),
        expect(blockInfo.blockParent).toEqual(
            '2633deb76d59bb4d3d78cdfaa3ab1920bb88332ae98bd2d7d52adfd8e553996f'
        ),
        expect(blockInfo.blockHash).toEqual(
            '7f7409679e53875567e2ae812c9fcefe90ced8761d08554756f42bf268a42749'
        ),
        expect(blockInfo.finalized).toBeTruthy(),
        expect(blockInfo.blockStateHash).toEqual(
            'b40762eb4abb9701ee133c465f934075d377c0d09bfe209409e80bbb51af1771'
        ),
        expect(blockInfo.blockArriveTime).toEqual(
            new Date('2021-07-05T09:16:46.000Z')
        ),
        expect(blockInfo.blockReceiveTime).toEqual(
            new Date('2021-07-05T09:16:46.000Z')
        ),
        expect(blockInfo.transactionCount).toEqual(0n),
        expect(blockInfo.transactionEnergyCost).toEqual(0n),
        expect(blockInfo.blockSlot).toEqual(1915967n),
        expect(blockInfo.blockLastFinalized).toEqual(
            '2633deb76d59bb4d3d78cdfaa3ab1920bb88332ae98bd2d7d52adfd8e553996f'
        ),
        expect(blockInfo.blockSlotTime).toEqual(
            new Date('2021-05-13T01:03:11.750Z')
        ),
        expect(blockInfo.blockHeight).toEqual(22737n),
        expect(blockInfo.blockBaker).toEqual(3n),
    ]);
});

test('negative block height throws an error', async () => {
    const blockHeight = -431n;
    await expect(client.getBlocksAtHeight(blockHeight)).rejects.toEqual(
        new Error(
            'The block height has to be a positive integer, but it was: ' +
                blockHeight
        )
    );
});

test('no blocks returned for height not yet reached', async () => {
    const blockHeight = 18446744073709551615n;
    const blocksAtHeight = await client.getBlocksAtHeight(blockHeight);
    return expect(blocksAtHeight.length).toEqual(0);
});

test('retrieves blocks at block height', async () => {
    const blockHeight = 314n;
    const blocksAtHeight: string[] = await client.getBlocksAtHeight(
        blockHeight
    );
    return Promise.all([
        expect(blocksAtHeight.length).toEqual(1),
        expect(blocksAtHeight[0]).toEqual(
            '072a02694ec6539d022e616eeb9f05bacea60e1d7278d34457daeca5e6380b61'
        ),
    ]);
});

test('retrieves the consensus status from the node with correct types', async () => {
    const consensusStatus: ConsensusStatus = await client.getConsensusStatus();
    return Promise.all([
        expect(isHex(consensusStatus.bestBlock)).toBeTruthy(),
        expect(isHex(consensusStatus.genesisBlock)).toBeTruthy(),
        expect(isHex(consensusStatus.lastFinalizedBlock)).toBeTruthy(),
        expect(
            typeof consensusStatus.finalizationCount === 'bigint'
        ).toBeTruthy(),
        expect(
            typeof consensusStatus.blocksVerifiedCount === 'bigint'
        ).toBeTruthy(),
        expect(
            typeof consensusStatus.blocksReceivedCount === 'bigint'
        ).toBeTruthy(),
        expect(consensusStatus.blockLastArrivedTime).toBeInstanceOf(Date),
        expect(consensusStatus.blockLastReceivedTime).toBeInstanceOf(Date),
        expect(consensusStatus.genesisTime).toBeInstanceOf(Date),
        expect(consensusStatus.lastFinalizedTime).toBeInstanceOf(Date),

        expect(
            Number.isNaN(consensusStatus.blockArriveLatencyEMSD)
        ).toBeFalsy(),
        expect(Number.isNaN(consensusStatus.blockArriveLatencyEMA)).toBeFalsy(),
        expect(
            Number.isNaN(consensusStatus.blockReceiveLatencyEMSD)
        ).toBeFalsy(),
        expect(
            Number.isNaN(consensusStatus.blockReceiveLatencyEMA)
        ).toBeFalsy(),
        expect(
            Number.isNaN(consensusStatus.transactionsPerBlockEMSD)
        ).toBeFalsy(),
        expect(
            Number.isNaN(consensusStatus.transactionsPerBlockEMA)
        ).toBeFalsy(),

        expect(Number.isNaN(consensusStatus.blockReceivePeriodEMA)).toBeFalsy(),
        expect(
            Number.isNaN(consensusStatus.blockReceivePeriodEMSD)
        ).toBeFalsy(),
        expect(Number.isNaN(consensusStatus.blockArrivePeriodEMA)).toBeFalsy(),
        expect(Number.isNaN(consensusStatus.blockArrivePeriodEMSD)).toBeFalsy(),
        expect(Number.isNaN(consensusStatus.finalizationPeriodEMA)).toBeFalsy(),
        expect(
            Number.isNaN(consensusStatus.finalizationPeriodEMSD)
        ).toBeFalsy(),

        expect(typeof consensusStatus.epochDuration === 'bigint').toBeTruthy(),
        expect(typeof consensusStatus.slotDuration === 'bigint').toBeTruthy(),
        expect(
            typeof consensusStatus.bestBlockHeight === 'bigint'
        ).toBeTruthy(),
        expect(
            typeof consensusStatus.lastFinalizedBlockHeight === 'bigint'
        ).toBeTruthy(),
    ]);
});
