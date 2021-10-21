import {
    ConsensusStatus,
    instanceOfTransferWithMemoTransactionSummary,
    NormalAccountCredential,
    TransferredWithScheduleEvent,
} from '../src/types';
import { AccountAddress } from '../src/types/accountAddress';
import { isHex } from '../src/util';
import { isValidDate, getNodeClient } from './testHelpers';
import { bulletProofGenerators } from './resources/bulletproofgenerators';
import { ipVerifyKey1, ipVerifyKey2 } from './resources/ipVerifyKeys';
import { PeerElement } from '../grpc/concordium_p2p_rpc_pb';

const client = getNodeClient();

test('updated event is parsed correctly', async () => {
    const blockHash =
        '7838e431c1495a05a8c3d74f16cf31ae84ebfee3e0acc0fe2362cf597d9b0e91';
    const blockSummary = await client.getBlockSummary(blockHash);

    if (!blockSummary) {
        throw new Error(
            'The block summary should exist for the provided block.'
        );
    }

    if (blockSummary.transactionSummaries[0].result.outcome !== 'success') {
        throw new Error('Unexpected outcome');
    }

    if (
        blockSummary.transactionSummaries[0].result.events[0].tag === 'Updated'
    ) {
        expect(
            blockSummary.transactionSummaries[0].result.events[0].amount
        ).toBe(2000000n);
        expect(
            blockSummary.transactionSummaries[0].result.events[0].instigator
                .address
        ).toBe('4XXTkvZHRg8S62TQcoqZLbZbAEDKYrdH5zLERpsEbtrnJoM7TG');
        expect(
            blockSummary.transactionSummaries[0].result.events[0].instigator
                .type
        ).toBe('AddressAccount');
        expect(
            blockSummary.transactionSummaries[0].result.events[0].address.index
        ).toBe(8n);
        expect(
            blockSummary.transactionSummaries[0].result.events[0].address
                .subindex
        ).toBe(0n);
        expect(
            blockSummary.transactionSummaries[0].result.events[0].receiveName
        ).toBe('XO.join_player_one');
        expect(
            blockSummary.transactionSummaries[0].result.events[0].events
        ).toEqual([]);
        expect(
            blockSummary.transactionSummaries[0].result.events[0].message
        ).toBe('');
    } else {
        throw new Error('The summary should be for an Updated event');
    }
});

test('transferred event is parsed correctly', async () => {
    const blockHash =
        '4b39a13d326f422c76f12e20958a90a4af60a2b7e098b2a59d21d402fff44bfc';
    const blockSummary = await client.getBlockSummary(blockHash);

    if (!blockSummary) {
        throw new Error(
            'The block summary should exist for the provided block.'
        );
    }

    if (blockSummary.transactionSummaries[0].result.outcome !== 'success') {
        throw new Error('Unexpected outcome');
    }

    if (
        blockSummary.transactionSummaries[0].result.events[0].tag ===
        'Transferred'
    ) {
        expect(
            blockSummary.transactionSummaries[0].result.events[0].amount
        ).toBe(2000000000n);
        expect(
            blockSummary.transactionSummaries[0].result.events[0].to.address
        ).toBe('4KDqzVUMCP2oc7qmMqu4wVsqYCCyju1g3apqy2xakGaEGJKtyr');
        expect(
            blockSummary.transactionSummaries[0].result.events[0].to.type
        ).toBe('AddressAccount');
        expect(
            blockSummary.transactionSummaries[0].result.events[0].from.address
        ).toBe('4KDqzVUMCP2oc7qmMqu4wVsqYCCyju1g3apqy2xakGaEGJKtyr');
        expect(
            blockSummary.transactionSummaries[0].result.events[0].from.type
        ).toBe('AddressAccount');
    } else {
        throw new Error('The summary should be for a Transferred event');
    }
});

test('block summary for valid block hash retrieves block summary', async () => {
    const blockHash =
        '4b39a13d326f422c76f12e20958a90a4af60a2b7e098b2a59d21d402fff44bfc';
    const blockSummary = await client.getBlockSummary(blockHash);
    if (!blockSummary) {
        throw new Error('The block could not be found by the test');
    }
    return Promise.all([
        expect(blockSummary.finalizationData.finalizationIndex).toBe(15436n),
        expect(blockSummary.finalizationData.finalizationDelay).toBe(0n),
        expect(blockSummary.finalizationData.finalizationBlockPointer).toBe(
            'ccc4e8781fe07ec25e9fadb5e2e1d57fc7654327bc911783a17921a70f44ab42'
        ),
        expect(blockSummary.finalizationData.finalizers.length).toBe(10),
        expect(blockSummary.finalizationData.finalizers[0].bakerId).toBe(0n),
        expect(blockSummary.finalizationData.finalizers[0].signed).toBe(true),
        expect(blockSummary.finalizationData.finalizers[0].weight).toBe(
            700946588805952n
        ),

        expect(blockSummary.transactionSummaries[0].cost).toBe(6010n),
        expect(blockSummary.transactionSummaries[0].energyCost).toBe(601n),
        expect(blockSummary.transactionSummaries[0].hash).toBe(
            'e2df806768b6f6a52f8654a12be2e6c832fedabe1d1a27eb278dc4e5f9d8631f'
        ),
        expect(blockSummary.transactionSummaries[0].sender).toBe(
            '4KDqzVUMCP2oc7qmMqu4wVsqYCCyju1g3apqy2xakGaEGJKtyr'
        ),
        expect(blockSummary.transactionSummaries[0].index).toBe(0n),

        expect(
            blockSummary.updates.chainParameters.rewardParameters
                .transactionFeeDistribution.baker
        ).toBe(0.45),
        expect(
            blockSummary.updates.chainParameters.rewardParameters
                .transactionFeeDistribution.gasAccount
        ).toBe(0.45),
        expect(
            blockSummary.updates.chainParameters.rewardParameters
                .mintDistribution.bakingReward
        ).toBe(0.6),
        expect(
            blockSummary.updates.chainParameters.rewardParameters
                .mintDistribution.finalizationReward
        ).toBe(0.3),
        expect(
            blockSummary.updates.chainParameters.rewardParameters
                .mintDistribution.mintPerSlot
        ).toBe(7.555665e-10),
        expect(
            blockSummary.updates.chainParameters.rewardParameters.gASRewards
                .chainUpdate
        ).toBe(0.005),
        expect(
            blockSummary.updates.chainParameters.rewardParameters.gASRewards
                .accountCreation
        ).toBe(0.02),
        expect(
            blockSummary.updates.chainParameters.rewardParameters.gASRewards
                .baker
        ).toBe(0.25),
        expect(
            blockSummary.updates.chainParameters.rewardParameters.gASRewards
                .finalizationProof
        ).toBe(0.005),

        expect(
            blockSummary.updates.chainParameters.minimumThresholdForBaking
        ).toBe(15000000000n),
        expect(
            blockSummary.updates.chainParameters.microGTUPerEuro.numerator
        ).toBe(500000n),
        expect(
            blockSummary.updates.chainParameters.microGTUPerEuro.denominator
        ).toBe(1n),
        expect(
            blockSummary.updates.chainParameters.euroPerEnergy.numerator
        ).toBe(1n),
        expect(
            blockSummary.updates.chainParameters.euroPerEnergy.denominator
        ).toBe(50000n),

        expect(
            blockSummary.updates.chainParameters.foundationAccountIndex
        ).toBe(10n),
        expect(blockSummary.updates.chainParameters.bakerCooldownEpochs).toBe(
            166n
        ),
        expect(blockSummary.updates.chainParameters.accountCreationLimit).toBe(
            10
        ),
        expect(blockSummary.updates.chainParameters.electionDifficulty).toBe(
            0.025
        ),

        expect(
            blockSummary.updates.updateQueues.addAnonymityRevoker
                .nextSequenceNumber
        ).toBe(1n),
        expect(
            blockSummary.updates.updateQueues.addIdentityProvider
                .nextSequenceNumber
        ).toBe(1n),
        expect(
            blockSummary.updates.updateQueues.bakerStakeThreshold
                .nextSequenceNumber
        ).toBe(1n),
        expect(
            blockSummary.updates.updateQueues.electionDifficulty
                .nextSequenceNumber
        ).toBe(1n),
        expect(
            blockSummary.updates.updateQueues.euroPerEnergy.nextSequenceNumber
        ).toBe(1n),
        expect(
            blockSummary.updates.updateQueues.foundationAccount
                .nextSequenceNumber
        ).toBe(1n),
        expect(
            blockSummary.updates.updateQueues.gasRewards.nextSequenceNumber
        ).toBe(1n),
        expect(
            blockSummary.updates.updateQueues.level1Keys.nextSequenceNumber
        ).toBe(1n),
        expect(
            blockSummary.updates.updateQueues.level2Keys.nextSequenceNumber
        ).toBe(1n),
        expect(
            blockSummary.updates.updateQueues.microGTUPerEuro.nextSequenceNumber
        ).toBe(1n),
        expect(
            blockSummary.updates.updateQueues.mintDistribution
                .nextSequenceNumber
        ).toBe(1n),
        expect(
            blockSummary.updates.updateQueues.protocol.nextSequenceNumber
        ).toBe(1n),
        expect(
            blockSummary.updates.updateQueues.rootKeys.nextSequenceNumber
        ).toBe(1n),
        expect(
            blockSummary.updates.updateQueues.transactionFeeDistribution
                .nextSequenceNumber
        ).toBe(1n),

        expect(blockSummary.updates.keys.rootKeys.threshold).toBe(5),
        expect(blockSummary.updates.keys.rootKeys.keys[0].verifyKey).toBe(
            '2c3c756d25998fda4781bdc491896eb9be626955826f457248d5c1aacf4e8d72'
        ),
        expect(blockSummary.updates.keys.level1Keys.threshold).toBe(7),
        expect(blockSummary.updates.keys.level1Keys.keys[0].verifyKey).toBe(
            '221936c1197cd6ec5da314896af0bc384bd8ec54f543609ee5089fda5d9ee16b'
        ),
        expect(
            blockSummary.updates.keys.level2Keys.addAnonymityRevoker.threshold
        ).toBe(7),
        expect(
            blockSummary.updates.keys.level2Keys.addAnonymityRevoker
                .authorizedKeys[0]
        ).toBe(0),
    ]);
});

test('block summary for invalid block hash throws error', async () => {
    const invalidBlockHash =
        'fd4915edca67b4e8f6521641a638a3abdbdd7934e42a9a52d8673861e2ebdd2';
    await expect(client.getBlockSummary(invalidBlockHash)).rejects.toEqual(
        new Error('The input was not a valid hash: ' + invalidBlockHash)
    );
});

test('block summary for unknown block is undefined', async () => {
    const unknownBlockHash =
        'fd4915edca67b4e8f6521641a638a3abdbdd7934e4f2a9a52d8673861e2ebdd2';
    const blockSummary = await client.getBlockSummary(unknownBlockHash);
    return expect(blockSummary).toBeUndefined();
});

test('block summary with memo transactions', async () => {
    const blockHash =
        'b49bb1c06c697b7d6539c987082c5a0dc6d86d91208874517ab17da752472edf';
    const blockSummary = await client.getBlockSummary(blockHash);
    if (!blockSummary) {
        throw new Error('Block not found');
    }
    const transactionSummaries = blockSummary.transactionSummaries;

    for (const transactionSummary of transactionSummaries) {
        if (instanceOfTransferWithMemoTransactionSummary(transactionSummary)) {
            const [transferredEvent, memoEvent] =
                transactionSummary.result.events;

            const toAddress = transferredEvent.to.address;
            const amount = transferredEvent.amount;
            const memo = memoEvent.memo;

            return Promise.all([
                expect(toAddress).toBe(
                    '4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf'
                ),
                expect(amount).toEqual(100n),
                expect(memo).toBe('546869732069732061206d656d6f2e'),
            ]);
        }
    }

    throw new Error('A memo transaction was not found in the block');
});

test('block summary with a scheduled transfer', async () => {
    const blockHash =
        'd0d330b424095386b253c8ccd007b366f3d5ec4fa8630c77838d8982c73b4b70';
    const blockSummary = await client.getBlockSummary(blockHash);
    if (!blockSummary) {
        throw new Error('Block not found');
    }

    if (blockSummary.transactionSummaries[0].result.outcome !== 'success') {
        throw new Error('Unexpected outcome');
    }

    const event: TransferredWithScheduleEvent = blockSummary
        .transactionSummaries[0].result
        .events[0] as TransferredWithScheduleEvent;
    expect(event.amount[0].timestamp).toEqual(
        new Date('2021-08-04T12:00:00.000Z')
    );
    expect(event.amount[0].amount).toEqual(10000000n);
});

test('account info for invalid hash throws error', async () => {
    const accountAddress = new AccountAddress(
        '3sAHwfehRNEnXk28W7A3XB3GzyBiuQkXLNRmDwDGPUe8JsoAcU'
    );
    const invalidBlockHash = 'P{L}GDA';
    await expect(
        client.getAccountInfo(accountAddress, invalidBlockHash)
    ).rejects.toEqual(
        new Error('The input was not a valid hash: ' + invalidBlockHash)
    );
});

test('account info for unknown block hash is undefined', async () => {
    const accountAddress = new AccountAddress(
        '33aAwqhbFU1teSpLtan34zTox7gYBmjUSRiZKEv4tKd2wkEbhw'
    );
    const blockHash =
        'fd4915edca67b4e8f6521641a638a3abdbdd7934e4f2a9a52d8673861e2ebdd2';

    const accountInfo = await client.getAccountInfo(accountAddress, blockHash);
    return expect(accountInfo).toBeUndefined();
});

test('account info for unknown account address is undefined', async () => {
    const accountAddress = new AccountAddress(
        '33aAwqhbFU1teSpLtan34zTox7gYBmjUSRiZKEv4tKd2wkEbhw'
    );
    const blockHash =
        '6b01f2043d5621192480f4223644ef659dd5cda1e54a78fc64ad642587c73def';

    const accountInfo = await client.getAccountInfo(accountAddress, blockHash);
    return expect(accountInfo).toBeUndefined();
});

test('account info with a release schedule', async () => {
    const accountAddress = new AccountAddress(
        '3V1LSu3AZ6o45xcjqRr3PzviUQUfK2tXq2oFnaHgDbY8Ledu2Z'
    );
    const blockHash =
        'cc6081868b96aa6acffeb152ef8feb7d4ef145c56d8e80def934fab443559eff';

    const accountInfo = await client.getAccountInfo(accountAddress, blockHash);

    if (!accountInfo) {
        throw new Error('Test failed to find account info');
    }

    for (const schedule of accountInfo.accountReleaseSchedule.schedule) {
        expect(schedule.transactions[0]).toEqual(
            '937a107c92ba702e3522618563457fa9f6a1b9c2ee7e037ede8cb9dc069518f0'
        );
        expect(schedule.amount).toEqual(200000n);
        expect(isValidDate(schedule.timestamp)).toBeTruthy();
    }
});

test('retrieves the account info', async () => {
    const accountAddress = new AccountAddress(
        '3sAHwfehRNEnXk28W7A3XB3GzyBiuQkXLNRmDwDGPUe8JsoAcU'
    );
    const blockHash =
        '6b01f2043d5621192480f4223644ef659dd5cda1e54a78fc64ad642587c73def';

    const accountInfo = await client.getAccountInfo(accountAddress, blockHash);

    if (!accountInfo) {
        throw new Error('Test failed to find account info');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let normalAccountCredentialExpects: any[] = [];
    if (accountInfo.accountCredentials[0].value.type === 'normal') {
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

test('retrieves the next account nonce', async () => {
    const accountAddress = new AccountAddress(
        '3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'
    );
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
        expect(isValidDate(blockInfo.blockArriveTime)).toBeTruthy(),
        expect(isValidDate(blockInfo.blockReceiveTime)).toBeTruthy(),

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

test('cryptographic parameters are retrieved at the given block', async () => {
    const blockHash =
        '7f7409679e53875567e2ae812c9fcefe90ced8761d08554756f42bf268a42749';
    const cryptographicParameters = await client.getCryptographicParameters(
        blockHash
    );

    if (!cryptographicParameters) {
        throw new Error('Test was unable to get cryptographic parameters');
    }

    return Promise.all([
        expect(cryptographicParameters.value.genesisString).toEqual(
            'Concordium Testnet Version 5'
        ),
        expect(cryptographicParameters.value.onChainCommitmentKey).toEqual(
            'b14cbfe44a02c6b1f78711176d5f437295367aa4f2a8c2551ee10d25a03adc69d61a332a058971919dad7312e1fc94c5a8d45e64b6f917c540eee16c970c3d4b7f3caf48a7746284878e2ace21c82ea44bf84609834625be1f309988ac523fac'
        ),
        expect(cryptographicParameters.value.bulletproofGenerators).toEqual(
            bulletProofGenerators
        ),
    ]);
});

test('cryptographic parameters are undefined at unknown block', async () => {
    const blockHash =
        '7f7409679e53875567e2ae812c9fcefe90ced8961d08554756f42bf268a42749';
    const cryptographicParameters = await client.getCryptographicParameters(
        blockHash
    );

    return expect(cryptographicParameters).toBeUndefined();
});

test('peer list can be retrieved', async () => {
    const peerList = await client.getPeerList(false);
    const peersList = peerList.getPeersList();
    const peer = peersList[0];

    return Promise.all([
        expect(typeof peer.getIp === 'string'),
        expect(typeof peer.getPort === 'number'),
        expect(typeof peer.getNodeId === 'string'),
        expect(typeof peer.getJsPbMessageId === 'string'),
        expect(
            [
                PeerElement.CatchupStatus.UPTODATE,
                PeerElement.CatchupStatus.PENDING,
                PeerElement.CatchupStatus.CATCHINGUP,
            ].includes(peer.getCatchupStatus())
        ),
    ]);
});

test('identity providers are undefined at an unknown block', async () => {
    const blockHash =
        '7f7409679e53875567e2ae812c9fcefe90ced8961d08554756f42bf268a42749';
    const identityProviders = await client.getIdentityProviders(blockHash);
    return expect(identityProviders).toBeUndefined();
});

test('identity providers are retrieved at the given block', async () => {
    const blockHash =
        '7f7409679e53875567e2ae812c9fcefe90ced8761d08554756f42bf268a42749';
    const identityProviders = await client.getIdentityProviders(blockHash);

    if (!identityProviders) {
        throw new Error('Test was unable to get identity providers');
    }

    const concordiumTestIp = identityProviders[0];
    const notabeneTestIp = identityProviders[1];

    return Promise.all([
        expect(concordiumTestIp.ipIdentity).toEqual(0),
        expect(concordiumTestIp.ipDescription.name).toEqual(
            'Concordium testnet IP'
        ),
        expect(concordiumTestIp.ipDescription.url).toEqual(''),
        expect(concordiumTestIp.ipDescription.description).toEqual(
            'Concordium testnet identity provider'
        ),
        expect(concordiumTestIp.ipCdiVerifyKey).toEqual(
            '2e1cff3988174c379432c1fad7ccfc385c897c4477c06617262cec7193226eca'
        ),
        expect(concordiumTestIp.ipVerifyKey).toEqual(ipVerifyKey1),

        expect(notabeneTestIp.ipIdentity).toEqual(1),
        expect(notabeneTestIp.ipDescription.name).toEqual('Notabene (Staging)'),
        expect(notabeneTestIp.ipDescription.url).toEqual(
            'https://notabene.studio'
        ),
        expect(notabeneTestIp.ipDescription.description).toEqual(
            'Notabene Identity Issuer (Staging Service)'
        ),
        expect(notabeneTestIp.ipCdiVerifyKey).toEqual(
            '4810d66439a25d9b345cf5c7ac11f9e512548c278542d9b24dc73541626d6197'
        ),
        expect(notabeneTestIp.ipVerifyKey).toEqual(ipVerifyKey2),
    ]);
});

test('anonymity revokers are undefined at an unknown block', async () => {
    const blockHash =
        '7f7409679e53875567e2ae812c9fcefe90ced8961d08554756f42bf268a42749';
    const anonymityRevokers = await client.getAnonymityRevokers(blockHash);
    return expect(anonymityRevokers).toBeUndefined();
});

test('anonymity revokers are retrieved at the given block', async () => {
    const blockHash =
        '7f7409679e53875567e2ae812c9fcefe90ced8761d08554756f42bf268a42749';
    const anonymityRevokers = await client.getAnonymityRevokers(blockHash);

    if (!anonymityRevokers) {
        throw new Error('Test could not find anonymity revokers');
    }

    const ar1 = anonymityRevokers[0];
    const ar2 = anonymityRevokers[1];
    const ar3 = anonymityRevokers[2];

    return Promise.all([
        expect(ar1.arIdentity).toEqual(1),
        expect(ar1.arDescription.name).toEqual('Testnet AR 1'),
        expect(ar1.arDescription.url).toEqual(''),
        expect(ar1.arDescription.description).toEqual(
            'Testnet anonymity revoker 1'
        ),
        expect(ar1.arPublicKey).toEqual(
            'b14cbfe44a02c6b1f78711176d5f437295367aa4f2a8c2551ee10d25a03adc69d61a332a058971919dad7312e1fc94c58ed5281b5d117cb74068a5deef28f027c9055dd424b07043568ac040a4e51f3307f268a77eaebc36bd4bf7cdbbe238b8'
        ),

        expect(ar2.arIdentity).toEqual(2),
        expect(ar2.arDescription.name).toEqual('Testnet AR 2'),
        expect(ar2.arDescription.url).toEqual(''),
        expect(ar2.arDescription.description).toEqual(
            'Testnet anonymity revoker 2'
        ),
        expect(ar2.arPublicKey).toEqual(
            'b14cbfe44a02c6b1f78711176d5f437295367aa4f2a8c2551ee10d25a03adc69d61a332a058971919dad7312e1fc94c5aefb2334688a2ecc95e7c49e9ccbc7218b5c9e151ac22462d064f564ffa56bb8b3685fcdc8d7d8cb43f43d608e7e8515'
        ),

        expect(ar3.arIdentity).toEqual(3),
        expect(ar3.arDescription.name).toEqual('Testnet AR 3'),
        expect(ar3.arDescription.url).toEqual(''),
        expect(ar3.arDescription.description).toEqual(
            'Testnet anonymity revoker 3'
        ),
        expect(ar3.arPublicKey).toEqual(
            'b14cbfe44a02c6b1f78711176d5f437295367aa4f2a8c2551ee10d25a03adc69d61a332a058971919dad7312e1fc94c5a791a28a6d3e7ca0857c0f996f94e65da78b8d9b5de5e32164e291e553ed103bf14d6fab1f21749d59664e34813afe77'
        ),
    ]);
});
