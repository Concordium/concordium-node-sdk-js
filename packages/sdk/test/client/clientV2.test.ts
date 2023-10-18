import * as v1 from '../../src/index.js';
import * as v2 from '../../src/grpc-api/v2/concordium/types.js';
import { testnetBulletproofGenerators } from './resources/bulletproofgenerators.js';
import {
    buildBasicAccountSigner,
    calculateEnergyCost,
    getAccountTransactionHandler,
    getCredentialDeploymentSignDigest,
    sha256,
    signTransaction,
    serializeAccountTransactionPayload,
    createCredentialDeploymentTransaction,
    serializeAccountTransaction,
    streamToList,
    BlockHash,
} from '../../src/index.js';
import {
    getIdentityInput,
    getNodeClientV2,
    getNodeClientWeb,
} from './testHelpers.js';
import * as ed from '@noble/ed25519';
import * as expected from './resources/expectedJsons.js';

import { TextEncoder, TextDecoder } from 'util';
import { getModuleBuffer } from '../../src/nodejs/index.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

const clientV2 = getNodeClientV2();
const clientWeb = getNodeClientWeb();

const testAccount = v1.AccountAddress.fromBase58(
    '3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G'
);
const testCredId = v1.CredentialRegistrationId.fromHexString(
    'aa730045bcd20bb5c24349db29d949f767e72f7cce459dc163c4b93c780a7d7f65801dda8ff7e4fc06fdf1a1b246276f'
);
const testAccBaker = v1.AccountAddress.fromBase58(
    '4EJJ1hVhbVZT2sR9xPzWUwFcJWK3fPX54z94zskTozFVk8Xd4L'
);
const testAccDeleg = v1.AccountAddress.fromBase58(
    '3bFo43GiPnkk5MmaSdsRVboaX2DNSKaRkLseQbyB3WPW1osPwh'
);
const testBlockHash = v1.BlockHash.fromHexString(
    'fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e'
);

// Retrieves the account info for the given account in the GRPCv2 type format.
function getAccountInfoV2(
    client: v1.ConcordiumGRPCClient,
    accountIdentifier: v1.AccountIdentifierInput
): Promise<v2.AccountInfo> {
    const accountInfoRequest = {
        blockHash: v1.getBlockHashInput(testBlockHash),
        accountIdentifier: v1.getAccountIdentifierInput(accountIdentifier),
    };

    return client.client.getAccountInfo(accountInfoRequest).response;
}

test.each([clientV2, clientWeb])(
    'getCryptographicParameters',
    async (client) => {
        const parameters = await client.getCryptographicParameters(
            testBlockHash
        );
        expect(parameters.genesisString).toEqual(
            'Concordium Testnet Version 5'
        );
        expect(parameters.onChainCommitmentKey).toEqual(
            'b14cbfe44a02c6b1f78711176d5f437295367aa4f2a8c2551ee10d25a03adc69d61a332a058971919dad7312e1fc94c5a8d45e64b6f917c540eee16c970c3d4b7f3caf48a7746284878e2ace21c82ea44bf84609834625be1f309988ac523fac'
        );

        expect(parameters.bulletproofGenerators).toEqual(
            Buffer.from(testnetBulletproofGenerators, 'base64').toString('hex')
        );
    }
);

test.each([clientV2, clientWeb])('nextAccountNonce', async (client) => {
    const nan = await client.getNextAccountNonce(testAccount);
    expect(nan.nonce.value).toBeGreaterThanOrEqual(19n);
    expect(nan.allFinal).toBeDefined();
});

test.each([clientV2, clientWeb])('getAccountInfo', async (client) => {
    const accountInfo = await getAccountInfoV2(client, testAccount);

    expect(v2.AccountInfo.toJson(accountInfo)).toEqual(expected.accountInfo);
});

test.each([clientV2, clientWeb])('getAccountInfo for baker', async (client) => {
    const accInfo = await getAccountInfoV2(client, testAccBaker);
    const accountIndexInfo = await getAccountInfoV2(client, 5n);

    if (accInfo.stake && accountIndexInfo.stake) {
        const stake = v2.AccountStakingInfo.toJson(accInfo.stake);
        const stakeAccountIndex = v2.AccountStakingInfo.toJson(
            accountIndexInfo.stake
        );
        expect(stake).toEqual(expected.stakingInfoBaker);
        expect(stake).toEqual(stakeAccountIndex);
    } else {
        throw Error('Stake field not found in accountInfo.');
    }
});

test.each([clientV2, clientWeb])(
    'getAccountInfo for delegator',
    async (client) => {
        const accInfo = await getAccountInfoV2(client, testAccDeleg);

        if (accInfo.stake) {
            expect(v2.AccountStakingInfo.toJson(accInfo.stake)).toEqual(
                expected.stakingInfoDelegator
            );
        } else {
            throw Error('Stake field not found in accountInfo.');
        }
    }
);

test.each([clientV2, clientWeb])(
    'getAccountInfo: Account Address and CredentialRegistrationId is equal',
    async (client) => {
        const accInfo = await client.getAccountInfo(testAccount, testBlockHash);
        const credIdInfo = await client.getAccountInfo(
            testCredId,
            testBlockHash
        );

        expect(accInfo).toEqual(credIdInfo);
    }
);

test.each([clientV2, clientWeb])(
    // TODO: fails..
    'accountInfo implementations is the same',
    async (client) => {
        const regular = await client.getAccountInfo(testAccount, testBlockHash);
        const credId = await client.getAccountInfo(testCredId, testBlockHash);
        const baker = await client.getAccountInfo(testAccBaker, testBlockHash);
        const deleg = await client.getAccountInfo(testAccDeleg, testBlockHash);
        expect(regular).toEqual(expected.regularAccountInfo);
        expect(credId).toEqual(expected.credIdAccountInfo);
        expect(baker).toEqual(expected.bakerAccountInfo);
        expect(deleg).toEqual(expected.delegatorAccountInfo);
    }
);

test.each([clientV2, clientWeb])(
    'getChainParameters corresponds to GetBlockSummary subset',
    async (client) => {
        const chainParameters = await client.getBlockChainParameters(
            testBlockHash
        );

        expect(chainParameters).toEqual(expected.chainParameters);
    }
);

test.each([clientV2, clientWeb])(
    'getChainParameters corresponds to GetBlockSummary subset on protocol level < 4',
    async (client) => {
        const oldBlockHash = v1.BlockHash.fromHexString(
            'ed2507c4d05108038741e87757ab1c3acdeeb3327027cd2972666807c9c4a20d'
        );
        const oldChainParameters = await client.getBlockChainParameters(
            oldBlockHash
        );

        expect(oldChainParameters).toEqual(expected.oldChainParameters);
    }
);

test.each([clientV2, clientWeb])(
    'getPoolInfo corresponds to getPoolStatus with a bakerId',
    async (client) => {
        const bakerPoolStatus = await client.getPoolInfo(1n, testBlockHash);

        expect(bakerPoolStatus).toEqual(expected.bakerPoolStatus);
    }
);

test.each([clientV2, clientWeb])(
    'getPassiveDelegationInfo corresponds to getPoolStatus with no bakerId',
    async (client) => {
        const status = await client.getPassiveDelegationInfo(testBlockHash);
        expect(status).toEqual(expected.passiveDelegationStatus);
    }
);

test.each([clientV2, clientWeb])(
    'getPoolInfo corresponds to getPoolStatus with bakerId (with pending change)',
    async (client) => {
        const changeHash = v1.BlockHash.fromHexString(
            '2aa7c4a54ad403a9f9b48de2469e5f13a64c95f2cf7a8e72c0f9f7ae0718f642'
        );
        const changedAccount = 1879n;

        const poolStatus = await client.getPoolInfo(changedAccount, changeHash);

        expect(poolStatus).toEqual(expected.bakerPoolStatusWithPendingChange);
    }
);

test.each([clientV2, clientWeb])(
    'getBlockItemStatus on chain update',
    async (client) => {
        const transactionHash = v1.TransactionHash.fromHexString(
            '3de823b876d05cdd33a311a0f84124079f5f677afb2534c4943f830593edc650'
        );
        const blockItemStatus = await client.getBlockItemStatus(
            transactionHash
        );

        expect(blockItemStatus).toEqual(expected.blockItemStatusUpdate);
    }
);

test.each([clientV2, clientWeb])(
    'getBlockItemStatus on simple transfer',
    async (client) => {
        const transactionHash = v1.TransactionHash.fromHexString(
            '502332239efc0407eebef5c73c390080e5d7e1b127ff29f786a62b3c9ab6cfe7'
        );
        const blockItemStatus = await client.getBlockItemStatus(
            transactionHash
        );

        expect(blockItemStatus).toEqual(expected.blockItemStatusTransfer);
    }
);

test.each([clientV2, clientWeb])('getInstanceInfo', async (client) => {
    const contractAddress = v1.ContractAddress.create(0, 0);
    const instanceInfo = await client.getInstanceInfo(
        contractAddress,
        testBlockHash
    );

    expect(instanceInfo).toEqual(expected.instanceInfo);
});

test.each([clientV2, clientWeb])('Failed invoke contract', async (client) => {
    const result = await client.invokeContract(
        {
            invoker: testAccount,
            contract: v1.ContractAddress.create(6),
            method: v1.ReceiveName.fromStringUnchecked('PiggyBank.smash'),
            amount: v1.CcdAmount.zero(),
            parameter: undefined,
            energy: v1.Energy.create(30000),
        },
        testBlockHash
    );

    if (result.tag !== 'failure') {
        throw new Error('Expected invoke to be fail');
    }

    expect(result.usedEnergy.value).toBe(340n);
    expect(result.reason.tag).toBe(v1.RejectReasonTag.RejectedReceive);
});

test.each([clientV2, clientWeb])(
    'Invoke contract on v0 contract',
    async (client) => {
        const result = await client.invokeContract(
            {
                invoker: testAccount,
                contract: v1.ContractAddress.create(6),
                method: v1.ReceiveName.fromStringUnchecked('PiggyBank.insert'),
                amount: v1.CcdAmount.fromMicroCcd(1n),
                parameter: undefined,
                energy: v1.Energy.create(30000),
            },
            testBlockHash
        );

        expect(result).toEqual(expected.invokeInstanceResponseV0);
    }
);

test.each([clientV2, clientWeb])(
    'Invoke contract same in v1 and v2 on v1 contract',
    async (client) => {
        const context = {
            invoker: testAccount,
            contract: v1.ContractAddress.create(81),
            method: v1.ReceiveName.fromStringUnchecked('PiggyBank.view'),
            amount: v1.CcdAmount.zero(),
            parameter: undefined,
            energy: v1.Energy.create(30000),
        };
        const result = await client.invokeContract(context, testBlockHash);

        expect(result).toEqual(expected.invokeContractResult);
    }
);

test.each([clientV2, clientWeb])('getModuleSource', async (client) => {
    const localModuleBytes = getModuleBuffer(
        'test/client/resources/piggy_bank.wasm'
    );
    const moduleRef = v1.ModuleReference.fromBuffer(
        Buffer.from('foOYrcQGqX202GnD/XrcgToxg2Z6On2weOuub33OX2Q=', 'base64')
    );

    const localModuleHex = Buffer.from(localModuleBytes);
    const versionedModuleSource = await client.getModuleSource(
        moduleRef,
        testBlockHash
    );

    expect(versionedModuleSource.version).toEqual(0);
    expect(new Uint8Array(localModuleHex)).toEqual(
        new Uint8Array(versionedModuleSource.source)
    );
});

test.each([clientV2, clientWeb])('getConsensusStatus', async (client) => {
    const genesisBlock = v1.BlockHash.fromHexString(
        '4221332d34e1694168c2a0c0b3fd0f273809612cb13d000d5c2e00e85f50f796'
    );

    const ci = await client.getConsensusStatus();

    expect(ci.genesisBlock).toEqual(genesisBlock);
    expect(ci.lastFinalizedBlockHeight).toBeGreaterThan(1395315n);
    expect(ci.lastFinalizedTime?.getTime()).toBeGreaterThan(1669214033937n); // 23Nov2022 in milliseconds
});

test.each([clientV2, clientWeb])('sendBlockItem', async (client) => {
    const senderAccount = v1.AccountAddress.fromBase58(
        '37TRfx9PqFX386rFcNThyA3zdoWsjF8Koy6Nh3i8VrPy4duEsA'
    );
    const privateKey =
        '1f7d20585457b542b22b51f218f0636c8e05ead4b64074e6eafd1d418b04e4ac';
    const nextNonce = await client.getNextAccountNonce(senderAccount);

    // Create local transaction
    const header: v1.AccountTransactionHeader = {
        expiry: v1.TransactionExpiry.futureMinutes(60),
        nonce: nextNonce.nonce,
        sender: senderAccount,
    };
    const simpleTransfer: v1.SimpleTransferPayload = {
        amount: v1.CcdAmount.fromCcd(10_000),
        toAddress: testAccount,
    };
    const accountTransaction: v1.AccountTransaction = {
        header: header,
        payload: simpleTransfer,
        type: v1.AccountTransactionType.Transfer,
    };

    // Sign transaction
    const signer = buildBasicAccountSigner(privateKey);
    const signature: v1.AccountTransactionSignature = await signTransaction(
        accountTransaction,
        signer
    );

    expect(
        client.sendAccountTransaction(accountTransaction, signature)
    ).rejects.toThrow('costs');
});

test.each([clientV2, clientWeb])('transactionHash', async (client) => {
    const senderAccount = v1.AccountAddress.fromBase58(
        '37TRfx9PqFX386rFcNThyA3zdoWsjF8Koy6Nh3i8VrPy4duEsA'
    );
    const privateKey =
        '1f7d20585457b542b22b51f218f0636c8e05ead4b64074e6eafd1d418b04e4ac';
    const nextNonce = await client.getNextAccountNonce(senderAccount);

    // Create local transaction
    const headerLocal: v1.AccountTransactionHeader = {
        expiry: v1.TransactionExpiry.futureMinutes(60),
        nonce: nextNonce.nonce,
        sender: senderAccount,
    };
    const simpleTransfer: v1.SimpleTransferPayload = {
        amount: v1.CcdAmount.fromCcd(10_000),
        toAddress: testAccount,
    };
    const transaction: v1.AccountTransaction = {
        header: headerLocal,
        payload: simpleTransfer,
        type: v1.AccountTransactionType.Transfer,
    };

    const rawPayload = serializeAccountTransactionPayload(transaction);

    // Energy cost
    const accountTransactionHandler = getAccountTransactionHandler(
        transaction.type
    );
    const baseEnergyCost = accountTransactionHandler.getBaseEnergyCost(
        transaction.payload
    );
    const energyCost = calculateEnergyCost(
        1n,
        BigInt(rawPayload.length),
        baseEnergyCost
    );

    // Sign transaction
    const signer = buildBasicAccountSigner(privateKey);
    const signature: v1.AccountTransactionSignature = await signTransaction(
        transaction,
        signer
    );

    // Put together sendBlockItemRequest
    const header: v2.AccountTransactionHeader = {
        sender: v1.AccountAddress.toProto(transaction.header.sender),
        sequenceNumber: v1.SequenceNumber.toProto(transaction.header.nonce),
        energyAmount: v1.Energy.toProto(energyCost),
        expiry: { value: transaction.header.expiry.expiryEpochSeconds },
    };
    const accountTransaction: v2.PreAccountTransaction = {
        header: header,
        payload: {
            payload: { oneofKind: 'rawPayload', rawPayload: rawPayload },
        },
    };

    const serializedAccountTransaction = serializeAccountTransaction(
        transaction,
        signature
    ).slice(71);
    const localHash = Buffer.from(
        sha256([serializedAccountTransaction])
    ).toString('hex');
    const nodeHash = await client.client.getAccountTransactionSignHash(
        accountTransaction
    ).response;

    expect(localHash).toEqual(Buffer.from(nodeHash.value).toString('hex'));
});

// Todo: verify that accounts can actually be created.
test.each([clientV2, clientWeb])('createAccount', async (client) => {
    // Get information from node
    const lastFinalizedBlockHash = (await client.getConsensusStatus())
        .lastFinalizedBlock;
    if (!lastFinalizedBlockHash) {
        throw new Error('Could not find latest finalized block.');
    }
    const cryptoParams = await client.getCryptographicParameters(
        lastFinalizedBlockHash
    );
    if (!cryptoParams) {
        throw new Error(
            'Cryptographic parameters were not found on a block that has been finalized.'
        );
    }

    // Create credentialDeploymentTransaction
    const identityInput: v1.IdentityInput = getIdentityInput();
    const threshold = 1;
    const credentialIndex = 1;
    const expiry = v1.TransactionExpiry.futureMinutes(60);
    const revealedAttributes: v1.AttributeKey[] = [];
    const publicKeys: v1.VerifyKey[] = [
        {
            schemeId: 'Ed25519',
            verifyKey:
                'c8cd7623c5a9316d8e2fccb51e1deee615bdb5d324fb4a6d33801848fb5e459e',
        },
    ];

    const credentialDeploymentTransaction: v1.CredentialDeploymentTransaction =
        createCredentialDeploymentTransaction(
            identityInput,
            cryptoParams,
            threshold,
            publicKeys,
            credentialIndex,
            revealedAttributes,
            expiry
        );

    // Sign transaction
    const hashToSign = getCredentialDeploymentSignDigest(
        credentialDeploymentTransaction
    );
    const signingKey1 =
        '1053de23867e0f92a48814aabff834e2ca0b518497abaef71cad4e1be506334a';
    const signature = Buffer.from(
        await ed.sign(hashToSign, signingKey1)
    ).toString('hex');
    const signatures: string[] = [signature];
    const payload = v1.serializeCredentialDeploymentPayload(
        signatures,
        credentialDeploymentTransaction
    );

    expect(
        client.sendCredentialDeploymentTransaction(payload, expiry)
    ).rejects.toThrow('expired');
});

test.each([clientV2, clientWeb])('getAccountList', async (client) => {
    const blocks = await client.getBlocksAtHeight(10n);
    const accountIter = client.getAccountList(blocks[0]);
    const accountList = await streamToList(accountIter);
    expect(accountList).toEqual(expected.accountList);
});

test.each([clientV2, clientWeb])('getModuleList', async (client) => {
    const blocks = await client.getBlocksAtHeight(5000n);
    const moduleIter = client.getModuleList(blocks[0]);
    const moduleList = await streamToList(moduleIter);
    expect(moduleList).toEqual(expected.moduleList);
});

test.each([clientV2, clientWeb])('getAncestors', async (client) => {
    const ancestorsIter = client.getAncestors(3n, testBlockHash);
    const ancestorsList = await streamToList(ancestorsIter);
    expect(ancestorsList).toEqual(expected.ancestorList);
});

test.each([clientV2, clientWeb])('getInstanceState', async (client) => {
    const contract = v1.ContractAddress.create(602);
    const instanceStateIter = client.getInstanceState(contract, testBlockHash);
    const instanceStateList = await streamToList(instanceStateIter);

    expect(instanceStateList).toEqual(expected.instanceStateList);
});

test.each([clientV2, clientWeb])('instanceStateLookup', async (client) => {
    const key = '0000000000000000';
    const expectedValue = '0800000000000000';
    const contract = v1.ContractAddress.create(601);
    const value = await client.instanceStateLookup(
        contract,
        key,
        testBlockHash
    );

    expect(value).toEqual(expectedValue);
});

test.each([clientV2, clientWeb])('getIdentityProviders', async (client) => {
    const earlyBlock = await client.getBlocksAtHeight(1n);
    const ips = client.getIdentityProviders(earlyBlock[0]);
    const ipList = await streamToList(ips);
    ipList.forEach((ip) => (ip.ipVerifyKey = ''));

    expect(ipList).toEqual(expected.ipList);
});

test.each([clientV2, clientWeb])('getAnonymityRevokers', async (client) => {
    const earlyBlock = await client.getBlocksAtHeight(1n);
    const ars = client.getAnonymityRevokers(earlyBlock[0]);
    const arList = await streamToList(ars);

    expect(arList).toEqual(expected.arList);
});

test.each([clientV2, clientWeb])('getBlocksAtHeight', async (client) => {
    const blocks = await client.getBlocksAtHeight(1n);

    expect(blocks).toEqual(expected.blocksAtHeight);
});

test.each([clientV2, clientWeb])(
    'getBlocksAtHeight different request',
    async (client) => {
        const request: v1.BlocksAtHeightRequest = {
            genesisIndex: 1,
            height: 100n,
            restrict: true,
        };
        const expectedBlock = v1.BlockHash.fromHexString(
            '956c3bc5c9d10449e13686a4cc69e8bc7dee450608866242075a6ce37331187c'
        );
        const blocks = await client.getBlocksAtHeight(request);

        expect(blocks[0]).toEqual(expectedBlock);
    }
);

test.each([clientV2, clientWeb])('getBlockInfo', async (client) => {
    const blockInfo = await client.getBlockInfo(testBlockHash);

    expect(blockInfo).toEqual(expected.blockInfo);
});

test.each([clientV2, clientWeb])('getBakerList', async (client) => {
    const bakerAsyncIterable = client.getBakerList(testBlockHash);
    const bakers = await streamToList(bakerAsyncIterable);

    expect(bakers).toEqual(expected.bakers);
});

test.each([clientV2, clientWeb])('getPoolDelegators', async (client) => {
    const delegatorInfoStream = client.getPoolDelegators(15n, testBlockHash);
    const delegatorInfoList = await streamToList(delegatorInfoStream);

    expect(delegatorInfoList).toEqual(expected.delegatorInfoList);
});

test.each([clientV2, clientWeb])(
    'getPoolDelegatorsRewardPeriod',
    async (client) => {
        const delegatorInfoStream = client.getPoolDelegatorsRewardPeriod(
            15n,
            testBlockHash
        );
        const delegatorInfoList = await streamToList(delegatorInfoStream);

        expect(delegatorInfoList).toEqual(expected.delegatorInfoList);
    }
);
test.each([clientV2, clientWeb])('getPassiveDelegators', async (client) => {
    const blocks = await client.getBlocksAtHeight(10000n);
    const passiveDelegatorInfoStream = client.getPassiveDelegators(blocks[0]);
    const passiveDelegatorInfoList = await streamToList(
        passiveDelegatorInfoStream
    );

    expect(passiveDelegatorInfoList).toEqual(expected.passiveDelegatorInfoList);
});

test.each([clientV2, clientWeb])(
    'getPassiveDelegatorsRewardPeriod',
    async (client) => {
        const blocks = await client.getBlocksAtHeight(10000n);
        const passiveDelegatorRewardInfoStream =
            client.getPassiveDelegatorsRewardPeriod(blocks[0]);
        const passiveDelegatorRewardInfoList = await streamToList(
            passiveDelegatorRewardInfoStream
        );

        expect(passiveDelegatorRewardInfoList).toEqual(
            expected.passiveDelegatorRewardInfoList
        );
    }
);

test.each([clientV2, clientWeb])('getBranches', async (client) => {
    const branch = await client.getBranches();

    expect(branch).toBeDefined();
    expect(branch.blockHash).toBeDefined();
    expect(branch.children).toBeDefined();
});

test.each([clientV2, clientWeb])('getElectionInfo', async (client) => {
    const blocks = await client.getBlocksAtHeight(10n);
    const electionInfo = await client.getElectionInfo(blocks[0]);

    expect(electionInfo).toEqual(expected.electionInfoList);
});

test.each([clientV2, clientWeb])(
    'getAccountNonFinalizedTransactions',
    async (client) => {
        const transactions =
            client.getAccountNonFinalizedTransactions(testAccount);
        const transactionsList = await streamToList(transactions);

        expect(transactionsList).toBeDefined();
        if (transactionsList[0]) {
            expect(typeof transactionsList[0]).toEqual('string');
        }
    }
);

test.each([clientV2, clientWeb])(
    'getBlockTransactionEvents',
    async (client) => {
        const blockHash = v1.BlockHash.fromHexString(
            '8f3acabb19ef769db4d13ada858a305cc1a3d64adeb78fcbf3bb9f7583de6362'
        );
        const transactionEvents = client.getBlockTransactionEvents(blockHash);
        const transactionEventList = await streamToList(transactionEvents);

        expect(transactionEventList).toEqual(expected.transactionEventList);
    }
);

test.each([clientV2, clientWeb])(
    'getBlockTransactionEvents',
    async (client) => {
        const blockHash = v1.BlockHash.fromHexString(
            '8f3acabb19ef769db4d13ada858a305cc1a3d64adeb78fcbf3bb9f7583de6362'
        );
        const transactionEvents = client.getBlockTransactionEvents(blockHash);
        const transactionEventList = await streamToList(transactionEvents);

        expect(transactionEventList).toEqual(expected.transactionEventList);
    }
);

test.each([clientV2, clientWeb])(
    'getNextUpdateSequenceNumbers',
    async (client) => {
        const seqNums = await client.getNextUpdateSequenceNumbers(
            testBlockHash
        );

        expect(seqNums).toEqual(expected.seqNums);
    }
);

test.each([clientV2, clientWeb])('getBlockSpecialEvents', async (client) => {
    const specialEventStream = client.getBlockSpecialEvents(testBlockHash);
    const specialEventList = await streamToList(specialEventStream);

    expect(specialEventList).toEqual(expected.specialEventList);
});

test.each([clientV2, clientWeb])('getBlockPendingUpdates', async (client) => {
    const pendingUpdateBlock = v1.BlockHash.fromHexString(
        '39122a9c720cae643b999d93dd7bf09bcf50e99bb716767dd35c39690390db54'
    );
    const pendingUpdateStream =
        client.getBlockPendingUpdates(pendingUpdateBlock);
    const pendingUpdateList = await streamToList(pendingUpdateStream);

    expect(pendingUpdateList.length).toEqual(1);
    expect(pendingUpdateList[0].effectiveTime.value).toEqual(
        expected.pendingUpdate.effectiveTime.value
    );
    expect(pendingUpdateList[0].effect).toEqual(expected.pendingUpdate.effect);
});

test.each([clientV2, clientWeb])(
    'getBlockFinalizationSummary',
    async (client) => {
        const finalizationSummary = await client.getBlockFinalizationSummary(
            testBlockHash
        );

        expect(finalizationSummary).toEqual(expected.blockFinalizationSummary);
    }
);

test.each([clientV2, clientWeb])('getEmbeddedSchema', async (client) => {
    const contract = v1.ContractAddress.create(4422);
    const moduleRef = v1.ModuleReference.fromHexString(
        '44434352ddba724930d6b1b09cd58bd1fba6ad9714cf519566d5fe72d80da0d1'
    );

    const schema = await client.getEmbeddedSchema(moduleRef);

    const context = {
        contract,
        method: v1.ReceiveName.fromStringUnchecked('weather.get'),
    };
    const invoked = await client.invokeContract(context);

    if (invoked.tag === 'success' && invoked.returnValue) {
        const rawReturnValue = invoked.returnValue;
        const returnValue = v1.deserializeReceiveReturnValue(
            v1.ReturnValue.toBuffer(rawReturnValue),
            schema,
            v1.ContractName.fromStringUnchecked('weather'),
            v1.EntrypointName.fromStringUnchecked('get')
        );
        expect(returnValue).toEqual({ Sunny: [] });
    } else {
        throw Error('Could not deserialize correctly with schema.');
    }
});

// For tests that take a long time to run, is skipped by default
describe('Long run-time test suite', () => {
    const longTestTime = 45000;

    // Sometimes fails as there is no guarantee that a new block comes fast enough.
    test.each([clientV2, clientWeb])(
        'getFinalizedBlocks',
        async (client) => {
            const ac = new AbortController();
            const blockStream = client.getFinalizedBlocks(ac.signal);

            for await (const block of blockStream) {
                expect(block.height).toBeGreaterThan(1553503n);
                ac.abort();
                break;
            }
        },
        longTestTime
    );

    // Sometimes fails as there is no guarantee that a new block comes fast enough.
    test.each([clientV2, clientWeb])(
        'getBlocks',
        async (client) => {
            const ac = new AbortController();
            const blockStream = client.getBlocks(ac.signal);

            for await (const block of blockStream) {
                expect(block.height).toBeGreaterThan(1553503n);
                ac.abort();
                break;
            }
        },
        longTestTime
    );
});

test.each([clientV2, clientWeb])('getFinalizedBlocksFrom', async (client) => {
    const expectedValues = [
        {
            height: 123n,
            hash: v1.BlockHash.fromHexString(
                'd2f69ff78b898c4eb0863bcbc179764b3ed20ed142e93eb3ed0cfc730c77f4ca'
            ),
        },
        {
            height: 124n,
            hash: v1.BlockHash.fromHexString(
                'fc86847a2482d5eb36028fe4a4702d1cd52d6d6f953d5effe4855acc974dfc64'
            ),
        },
        {
            height: 125n,
            hash: v1.BlockHash.fromHexString(
                'bc5e6aadad1bd5d107a8a02e7df5532f6c758ec456f709cfba1f402c408e7256'
            ),
        },
    ];

    const bis = await streamToList(client.getFinalizedBlocksFrom(123n, 125n));

    expect(bis.length).toBe(3);
    bis.forEach((bi, i) => {
        expect(bi.height).toBe(expectedValues[i].height);
        expect(bi.hash).toEqual(expectedValues[i].hash);
    });
});

describe('findEarliestFinalized', () => {
    test.each([clientV2, clientWeb])(
        'Finds expected result',
        async (client) => {
            const [genesisBlockHash] = await client.getBlocksAtHeight(0n);
            const genesisAccounts = await streamToList(
                client.getAccountList(genesisBlockHash)
            );

            const firstAccount = await client.findEarliestFinalized(
                async (bi) => {
                    const accounts = await streamToList(
                        client.getAccountList(bi.hash)
                    );

                    if (accounts.length > genesisAccounts.length) {
                        return accounts.filter(
                            (a) =>
                                !genesisAccounts.some(
                                    v1.AccountAddress.equals.bind(undefined, a)
                                )
                        )[0];
                    }
                },
                0n,
                10000n
            );

            if (firstAccount === undefined) {
                throw new Error('Expected firstAccount to be defined');
            }
            expect(
                v1.AccountAddress.equals(
                    firstAccount,
                    v1.AccountAddress.fromBase58(
                        '3sPayiQEQHrJUpwYUAnYCLWUTkk3JvEW5x6Vn6mD4raBgPAuSp'
                    )
                )
            ).toBeTruthy();
        }
    );

    test.each([clientV2, clientWeb])(
        'Works on single block range',
        async (client) => {
            const blockHash = await client.findEarliestFinalized(
                async (bi) => bi.hash,
                10000n,
                10000n
            );
            if (blockHash === undefined) {
                throw new Error('Expected blockHash to be defined');
            }

            expect(blockHash).toEqual(
                BlockHash.fromHexString(
                    'e4f7f5512e55183f56efe31c1a9da6e5c7f93f24d5b746180e3b5076e54811c1'
                )
            );
        }
    );
});

test.each([clientV2, clientWeb])('findInstanceCreation', async (client) => {
    const blockFirstContract = await client.findInstanceCreation(
        v1.ContractAddress.create(0),
        0n,
        10000n
    );

    expect(blockFirstContract?.height).toBe(2589n);
});

describe('findFirstFinalizedBlockNoLaterThan', () => {
    test.each([clientV2, clientWeb])(
        'Returns lowest block in range on date earlier than genesis',
        async (client) => {
            const time = new Date('11/5/2000');
            const bi = await client.findFirstFinalizedBlockNoLaterThan(
                time,
                10n,
                1500n
            );

            expect(bi?.blockHeight).toBe(10n);
        }
    );

    test.each([clientV2, clientWeb])(
        'Returns undefined on future date',
        async (client) => {
            const time = new Date(Date.now() + 10000);
            const bi = await client.findFirstFinalizedBlockNoLaterThan(
                time,
                1000000n,
                1500000n
            );

            expect(bi).toBe(undefined);
        }
    );
});
