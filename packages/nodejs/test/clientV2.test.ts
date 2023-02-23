import * as v1 from '@concordium/common-sdk';
import * as v2 from '../../common/grpc/v2/concordium/types';
import { testnetBulletproofGenerators } from './resources/bulletproofgenerators';
import ConcordiumNodeClientV2, {
    getAccountIdentifierInput,
    getBlockHashInput,
} from '@concordium/common-sdk/lib/GRPCClient';
import {
    buildBasicAccountSigner,
    calculateEnergyCost,
    createCredentialDeploymentTransaction,
    getAccountTransactionHandler,
    sha256,
    getCredentialDeploymentSignDigest,
    signTransaction,
} from '@concordium/common-sdk';
import { serializeAccountTransactionPayload } from '@concordium/common-sdk/src';
import {
    getModuleBuffer,
    getIdentityInput,
    getNodeClient,
} from './testHelpers';
import * as ed from '@noble/ed25519';
import * as expected from './resources/expectedJsons';
import { Buffer } from 'buffer/';

import { serializeAccountTransaction } from '@concordium/common-sdk/lib/serialization';

import { TextEncoder, TextDecoder } from 'util';
import 'isomorphic-fetch';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import { asyncIterableToList } from '@concordium/common-sdk/src/util';

/* eslint-disable @typescript-eslint/no-explicit-any */
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

// TODO find nice way to move this to web/common
export function getNodeClientWeb(
    address = 'http://node.testnet.concordium.com',
    port = 20000
): ConcordiumNodeClientV2 {
    const transport = new GrpcWebFetchTransport({
        baseUrl: `${address}:${port}`,
        timeout: 15000,
    });
    return new v1.ConcordiumGRPCClient(transport);
}

const clientV2 = getNodeClient();
const clientWeb = getNodeClientWeb();

const testAccount = new v1.AccountAddress(
    '3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G'
);
const testCredId = new v1.CredentialRegistrationId(
    'aa730045bcd20bb5c24349db29d949f767e72f7cce459dc163c4b93c780a7d7f65801dda8ff7e4fc06fdf1a1b246276f'
);
const testAccBaker = new v1.AccountAddress(
    '4EJJ1hVhbVZT2sR9xPzWUwFcJWK3fPX54z94zskTozFVk8Xd4L'
);
const testAccDeleg = new v1.AccountAddress(
    '3bFo43GiPnkk5MmaSdsRVboaX2DNSKaRkLseQbyB3WPW1osPwh'
);
const testBlockHash =
    'fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e';

// Retrieves the account info for the given account in the GRPCv2 type format.
function getAccountInfoV2(
    client: ConcordiumNodeClientV2,
    accountIdentifier: v1.AccountIdentifierInput
): Promise<v2.AccountInfo> {
    const accountInfoRequest = {
        blockHash: getBlockHashInput(testBlockHash),
        accountIdentifier: getAccountIdentifierInput(accountIdentifier),
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
    expect(nan.nonce).toBeGreaterThanOrEqual(19n);
    expect(nan.allFinal).toBeDefined();
});

test.each([clientV2, clientWeb])('getAccountInfo', async (client) => {
    const accountInfo = await getAccountInfoV2(client, testAccount);

    expect(v2.AccountInfo.toJson(accountInfo)).toEqual(expected.accountInfo);
});

test.each([clientV2, clientWeb])(
    'getAccountInfo: Invalid hash throws error',
    async (client) => {
        const invalidBlockHash = '1010101010';
        await expect(
            client.getAccountInfo(testAccount, invalidBlockHash)
        ).rejects.toEqual(
            new Error(
                'The input was not a valid hash, must be 32 bytes: ' +
                    invalidBlockHash
            )
        );
    }
);

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
        const oldBlockHash =
            'ed2507c4d05108038741e87757ab1c3acdeeb3327027cd2972666807c9c4a20d';
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
        const changeHash =
            '2aa7c4a54ad403a9f9b48de2469e5f13a64c95f2cf7a8e72c0f9f7ae0718f642';
        const changedAccount = 1879n;

        const poolStatus = await client.getPoolInfo(changedAccount, changeHash);

        expect(poolStatus).toEqual(expected.bakerPoolStatusWithPendingChange);
    }
);

test.each([clientV2, clientWeb])(
    'getBlockItemStatus on chain update',
    async (client) => {
        const transactionHash =
            '3de823b876d05cdd33a311a0f84124079f5f677afb2534c4943f830593edc650';
        const blockItemStatus = await client.getBlockItemStatus(
            transactionHash
        );

        expect(blockItemStatus).toEqual(expected.blockItemStatusUpdate);
    }
);

test.each([clientV2, clientWeb])(
    'getBlockItemStatus on simple transfer',
    async (client) => {
        const transactionHash =
            '502332239efc0407eebef5c73c390080e5d7e1b127ff29f786a62b3c9ab6cfe7';
        const blockItemStatus = await client.getBlockItemStatus(
            transactionHash
        );

        expect(blockItemStatus).toEqual(expected.blockItemStatusTransfer);
    }
);

test.each([clientV2, clientWeb])('getInstanceInfo', async (client) => {
    const contractAddress = {
        index: 0n,
        subindex: 0n,
    };
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
            contract: {
                index: 6n,
                subindex: 0n,
            },
            method: 'PiggyBank.smash',
            amount: new v1.CcdAmount(0n),
            parameter: undefined,
            energy: 30000n,
        },
        testBlockHash
    );

    if (result.tag !== 'failure') {
        throw new Error('Expected invoke to be fail');
    }

    expect(result.usedEnergy).toBe(340n);
    expect(result.reason.tag).toBe(v1.RejectReasonTag.RejectedReceive);
});

test.each([clientV2, clientWeb])(
    'Invoke contract on v0 contract',
    async (client) => {
        const result = await client.invokeContract(
            {
                invoker: testAccount,
                contract: {
                    index: 6n,
                    subindex: 0n,
                },
                method: 'PiggyBank.insert',
                amount: new v1.CcdAmount(1n),
                parameter: undefined,
                energy: 30000n,
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
            contract: {
                index: 81n,
                subindex: 0n,
            },
            method: 'PiggyBank.view',
            amount: new v1.CcdAmount(0n),
            parameter: undefined,
            energy: 30000n,
        };
        const result = await client.invokeContract(context, testBlockHash);

        expect(result).toEqual(expected.invokeContractResult);
    }
);

test.each([clientV2, clientWeb])('getModuleSource', async (client) => {
    const localModuleBytes = getModuleBuffer('test/resources/piggy_bank.wasm');
    const moduleRef = new v1.ModuleReference(
        Buffer.from(
            'foOYrcQGqX202GnD/XrcgToxg2Z6On2weOuub33OX2Q=',
            'base64'
        ).toString('hex')
    );

    const localModuleHex = Buffer.from(localModuleBytes);
    const moduleSource = await client.getModuleSource(moduleRef, testBlockHash);

    expect(localModuleHex).toEqual(moduleSource);
});

test.each([clientV2, clientWeb])('getConsensusStatus', async (client) => {
    const genesisBlock =
        '4221332d34e1694168c2a0c0b3fd0f273809612cb13d000d5c2e00e85f50f796';

    const ci = await client.getConsensusStatus();

    expect(ci.genesisBlock).toEqual(genesisBlock);
    expect(ci.lastFinalizedBlockHeight).toBeGreaterThan(1395315n);
    expect(ci.lastFinalizedTime?.getTime()).toBeGreaterThan(1669214033937n); // 23Nov2022 in milliseconds
});

test.each([clientV2, clientWeb])('sendBlockItem', async (client) => {
    const senderAccount = new v1.AccountAddress(
        '37TRfx9PqFX386rFcNThyA3zdoWsjF8Koy6Nh3i8VrPy4duEsA'
    );
    const privateKey =
        '1f7d20585457b542b22b51f218f0636c8e05ead4b64074e6eafd1d418b04e4ac';
    const nextNonce = await client.getNextAccountNonce(senderAccount);

    // Create local transaction
    const header: v1.AccountTransactionHeader = {
        expiry: new v1.TransactionExpiry(new Date(Date.now() + 3600000)),
        nonce: nextNonce.nonce,
        sender: senderAccount,
    };
    const simpleTransfer: v1.SimpleTransferPayload = {
        amount: new v1.CcdAmount(10000000000n),
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
    const senderAccount = new v1.AccountAddress(
        '37TRfx9PqFX386rFcNThyA3zdoWsjF8Koy6Nh3i8VrPy4duEsA'
    );
    const privateKey =
        '1f7d20585457b542b22b51f218f0636c8e05ead4b64074e6eafd1d418b04e4ac';
    const nextNonce = await client.getNextAccountNonce(senderAccount);

    // Create local transaction
    const headerLocal: v1.AccountTransactionHeader = {
        expiry: new v1.TransactionExpiry(new Date(Date.now() + 3600000)),
        nonce: nextNonce.nonce,
        sender: senderAccount,
    };
    const simpleTransfer: v1.SimpleTransferPayload = {
        amount: new v1.CcdAmount(10000000000n),
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
        sender: { value: transaction.header.sender.decodedAddress },
        sequenceNumber: { value: transaction.header.nonce },
        energyAmount: { value: energyCost },
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
    const expiry = new v1.TransactionExpiry(new Date(Date.now() + 3600000));
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

    expect(
        client.sendCredentialDeploymentTransaction(
            credentialDeploymentTransaction,
            signatures
        )
    ).rejects.toThrow('expired');
});

test.each([clientV2, clientWeb])('getAccountList', async (client) => {
    const blocks = await client.getBlocksAtHeight(10n);
    const accountIter = client.getAccountList(blocks[0]);
    const accountList = await asyncIterableToList(accountIter);
    expect(accountList).toEqual(expected.accountList);
});

test.each([clientV2, clientWeb])('getModuleList', async (client) => {
    const blocks = await client.getBlocksAtHeight(5000n);
    const moduleIter = client.getModuleList(blocks[0]);
    const moduleList = await asyncIterableToList(moduleIter);
    expect(moduleList).toEqual(expected.moduleList);
});

test.each([clientV2, clientWeb])('getAncestors', async (client) => {
    const ancestorsIter = client.getAncestors(3n, testBlockHash);
    const ancestorsList = await asyncIterableToList(ancestorsIter);
    expect(ancestorsList).toEqual(expected.ancestorList);
});

test.each([clientV2, clientWeb])('getInstanceState', async (client) => {
    const contract = {
        index: 602n,
        subindex: 0n,
    };
    const instanceStateIter = client.getInstanceState(contract, testBlockHash);
    const instanceStateList = await asyncIterableToList(instanceStateIter);

    expect(instanceStateList).toEqual(expected.instanceStateList);
});

test.each([clientV2, clientWeb])('instanceStateLookup', async (client) => {
    const key = '0000000000000000';
    const expectedValue = '0800000000000000';
    const contract = {
        index: 601n,
        subindex: 0n,
    };
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
    const ipList = await asyncIterableToList(ips);
    ipList.forEach((ip) => (ip.ipVerifyKey = ''));

    expect(ipList).toEqual(expected.ipList);
});

test.each([clientV2, clientWeb])('getAnonymityRevokers', async (client) => {
    const earlyBlock = await client.getBlocksAtHeight(1n);
    const ars = client.getAnonymityRevokers(earlyBlock[0]);
    const arList = await asyncIterableToList(ars);

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
        const expectedBlock =
            '956c3bc5c9d10449e13686a4cc69e8bc7dee450608866242075a6ce37331187c';
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
    const bakers = await asyncIterableToList(bakerAsyncIterable);

    expect(bakers).toEqual(expected.bakers);
});

test.each([clientV2, clientWeb])('getPoolDelegators', async (client) => {
    const delegatorInfoStream = client.getPoolDelegators(15n, testBlockHash);
    const delegatorInfoList = await asyncIterableToList(delegatorInfoStream);

    expect(delegatorInfoList).toEqual(expected.delegatorInfoList);
});

test.each([clientV2, clientWeb])(
    'getPoolDelegatorsRewardPeriod',
    async (client) => {
        const delegatorInfoStream = client.getPoolDelegatorsRewardPeriod(
            15n,
            testBlockHash
        );
        const delegatorInfoList = await asyncIterableToList(
            delegatorInfoStream
        );

        expect(delegatorInfoList).toEqual(expected.delegatorInfoList);
    }
);
test.each([clientV2, clientWeb])('getPassiveDelegators', async (client) => {
    const blocks = await client.getBlocksAtHeight(10000n);
    const passiveDelegatorInfoStream = client.getPassiveDelegators(blocks[0]);
    const passiveDelegatorInfoList = await asyncIterableToList(
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
        const passiveDelegatorRewardInfoList = await asyncIterableToList(
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
        const transactions = await client.getAccountNonFinalizedTransactions(
            testAccount
        );
        const transactionsList = await asyncIterableToList(transactions);

        expect(transactionsList).toBeDefined();
        if (transactionsList[0]) {
            expect(typeof transactionsList[0]).toEqual('string');
        }
    }
);

test.each([clientV2, clientWeb])(
    'getBlockTransactionEvents',
    async (client) => {
        const blockHash =
            '8f3acabb19ef769db4d13ada858a305cc1a3d64adeb78fcbf3bb9f7583de6362';
        const transactionEvents = await client.getBlockTransactionEvents(
            blockHash
        );
        const transactionEventList = await asyncIterableToList(
            transactionEvents
        );

        expect(transactionEventList).toEqual(expected.transactionEventList);
    }
);

test.each([clientV2, clientWeb])(
    'getBlockTransactionEvents',
    async (client) => {
        const blockHash =
            '8f3acabb19ef769db4d13ada858a305cc1a3d64adeb78fcbf3bb9f7583de6362';
        const transactionEvents = await client.getBlockTransactionEvents(
            blockHash
        );
        const transactionEventList = await asyncIterableToList(
            transactionEvents
        );

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
    const specialEventList = await asyncIterableToList(specialEventStream);

    expect(specialEventList).toEqual(expected.specialEventList);
});

test.each([clientV2, clientWeb])('getBlockPendingUpdates', async (client) => {
    const pendingUpdateBlock =
        '39122a9c720cae643b999d93dd7bf09bcf50e99bb716767dd35c39690390db54';
    const pendingUpdateStream =
        client.getBlockPendingUpdates(pendingUpdateBlock);
    const pendingUpdateList = await asyncIterableToList(pendingUpdateStream);

    expect(pendingUpdateList).toEqual(expected.pendingUpdateList);
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

// For tests that take a long time to run, is skipped by default
describe.skip('Long run-time test suite', () => {
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
