import { credentials, Metadata } from '@grpc/grpc-js/';
import * as v1 from '@concordium/common-sdk';
import * as v2 from '../grpc/v2/concordium/types';
import ConcordiumNodeClientV1 from '../src/client';
import ConcordiumNodeClientV2 from '../src/clientV2';
import { testnetBulletproofGenerators } from './resources/bulletproofgenerators';
import { getAccountIdentifierInput, getBlockHashInput } from '../src/util';

/**
 * Creates a client to communicate with a local concordium-node
 * used for automatic tests.
 */
export function getNodeClientV2(
    address = 'service.internal.testnet.concordium.com',
    port = 20000
): ConcordiumNodeClientV2 {
    const metadata = new Metadata();
    return new ConcordiumNodeClientV2(
        address,
        port,
        credentials.createInsecure(),
        metadata,
        15000
    );
}

export function getNodeClientV1(
    address = 'service.internal.testnet.concordium.com'
): ConcordiumNodeClientV1 {
    const metadata = new Metadata();
    metadata.add('authentication', 'rpcadmin');
    return new ConcordiumNodeClientV1(
        address,
        10000,
        credentials.createInsecure(),
        metadata,
        15000
    );
}

const clientV1 = getNodeClientV1();
const clientV2 = getNodeClientV2();

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

test('getCryptographicParameters', async () => {
    const parameters = await clientV2.getCryptographicParameters(testBlockHash);
    expect(parameters.genesisString).toEqual('Concordium Testnet Version 5');
    expect(parameters.onChainCommitmentKey).toEqual(
        'b14cbfe44a02c6b1f78711176d5f437295367aa4f2a8c2551ee10d25a03adc69d61a332a058971919dad7312e1fc94c5a8d45e64b6f917c540eee16c970c3d4b7f3caf48a7746284878e2ace21c82ea44bf84609834625be1f309988ac523fac'
    );

    expect(parameters.bulletproofGenerators).toEqual(
        Buffer.from(testnetBulletproofGenerators, 'base64').toString('hex')
    );
});

test('NextAccountSequenceNumber', async () => {
    const nan = await clientV2.getNextAccountNonce(testAccount);
    expect(nan.nonce).toBeGreaterThanOrEqual(19n);
    expect(nan.allFinal).toBeDefined();
});

test('AccountInfo', async () => {
    const accountInfo = await getAccountInfoV2(clientV2, testAccount);

    const expected = {
        sequenceNumber: {
            value: '19',
        },
        amount: {
            value: '35495453082577742',
        },
        schedule: {
            total: {},
        },
        creds: {
            '0': {
                normal: {
                    keys: {
                        keys: {
                            '0': {
                                ed25519Key:
                                    'npdcg40DcTbP9U9/W3QZIt2bwx5d08nreToCa30fUSU=',
                            },
                            '1': {
                                ed25519Key:
                                    'LTIrh0T6XQGCOtzj9qE7vr3XuFA8CMzD2El+bEYCGXY=',
                            },
                            '2': {
                                ed25519Key:
                                    'mnffP4aSBqfAhbwauCHx4kh2KiK7N0cbPO/Lg3QHZMk=',
                            },
                        },
                        threshold: {
                            value: 2,
                        },
                    },
                    credId: {
                        value: 'qnMARbzSC7XCQ0nbKdlJ92fnL3zORZ3BY8S5PHgKfX9lgB3aj/fk/Ab98aGyRidv',
                    },
                    ipId: {},
                    policy: {
                        createdAt: {
                            year: 2022,
                            month: 6,
                        },
                        validTo: {
                            year: 2023,
                            month: 6,
                        },
                    },
                    arThreshold: {
                        value: 1,
                    },
                    commitments: {
                        prf: {
                            value: 'uJMOSJdpAvZ/DLtQuMKRH8wGRvvM9L+2pELvfUCoNR9IrnIG7oCD4o01e+gIgD+C',
                        },
                        credCounter: {
                            value: 'sKpl9CCp8/q2HT+HXuvMIh5DFUv68bY2Xazpm/8gd43nADQ3YxIi6EX9mRfI0odL',
                        },
                        maxAccounts: {
                            value: 'hp4r3bLGBwPs1RK1W3crr3VpH4G7xFNi+I5avNq4WiNxSpLUb+QEVzZNUGq8IgKj',
                        },
                        idCredSecSharingCoeff: [
                            {
                                value: 'i6xECi5GzL+/p2jGrZnyq/JfizJ6eV7PI7K4BMMnAi8G0KztC17tZYmaPvMCmATs',
                            },
                        ],
                    },
                },
            },
        },
        threshold: {
            value: 1,
        },
        encryptedBalance: {
            selfAmount: {
                value: 'wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            },
        },
        encryptionKey: {
            value: 'sUy/5EoCxrH3hxEXbV9DcpU2eqTyqMJVHuENJaA63GnWGjMqBYlxkZ2tcxLh/JTFqnMARbzSC7XCQ0nbKdlJ92fnL3zORZ3BY8S5PHgKfX9lgB3aj/fk/Ab98aGyRidv',
        },
        index: {
            value: '11',
        },
        address: {
            value: 'aXUkBsyTn8kMpqc7V87hCZY1R/lCAG0hkUSST4SF+w0=',
        },
    };

    expect(v2.AccountInfo.toJson(accountInfo)).toEqual(expected);
});

test('getAccountInfo: Invalid hash throws error', async () => {
    const invalidBlockHash = '1010101010';
    await expect(
        clientV2.getAccountInfo(testAccount, invalidBlockHash)
    ).rejects.toEqual(
        new Error(
            'The input was not a valid hash, must be 32 bytes: ' +
                invalidBlockHash
        )
    );
});

test('getAccountInfo for baker', async () => {
    const accInfo = await getAccountInfoV2(clientV2, testAccBaker);
    const accountIndexInfo = await getAccountInfoV2(clientV2, 5n);

    const expected = {
        baker: {
            stakedAmount: { value: '7349646704751788' },
            restakeEarnings: true,
            bakerInfo: {
                bakerId: { value: '5' },
                electionKey: {
                    value: 'oJBoHsezXvOnce1D67Zyj9leSyZ6vt+pXx3BdyAZPcs=',
                },
                signatureKey: {
                    value: 'w4XMtcigcQoWLywQcSN0RlD/NfAAQL+iYtl0v7PD+PE=',
                },
                aggregationKey: {
                    value: 'sYoC3nSCblX26twPMdDZpu37KZPQMOZRNvHhJWppulI6y0D6TTBNBmiqMHwZJXoKEHJucBSckE4e8prtsmecglmX4/FO3TA78nbywLDFpMSHD/8MBDFQvga3FUZr5WTE',
                },
            },
            poolInfo: {
                openStatus: 'OPEN_STATUS_CLOSED_FOR_ALL',
                commissionRates: {
                    finalization: { partsPerHundredThousand: 100000 },
                    baking: { partsPerHundredThousand: 10000 },
                    transaction: { partsPerHundredThousand: 10000 },
                },
            },
        },
    };
    if (accInfo.stake && accountIndexInfo.stake) {
        const stake = v2.AccountStakingInfo.toJson(accInfo.stake);
        const stakeAccountIndex = v2.AccountStakingInfo.toJson(
            accountIndexInfo.stake
        );
        expect(stake).toEqual(expected);
        expect(stake).toEqual(stakeAccountIndex);
    }
});

test('getAccountInfo for delegator', async () => {
    const accInfo = await getAccountInfoV2(clientV2, testAccDeleg);

    const expected = {
        delegator: {
            stakedAmount: { value: '620942412516' },
            restakeEarnings: true,
            target: { passive: {} },
        },
    };

    if (accInfo.stake) {
        const stakeJson = v2.AccountStakingInfo.toJson(accInfo.stake);
        expect(stakeJson).toEqual(expected);
    }
});

test('getAccountInfo: Account Address and CredentialRegistrationId is equal', async () => {
    const accInfo = await clientV2.getAccountInfo(testAccount, testBlockHash);
    const credIdInfo = await clientV2.getAccountInfo(testCredId, testBlockHash);

    expect(accInfo).toEqual(credIdInfo);
});

test('accountInfo implementations is the same', async () => {
    const oldReg = await clientV1.getAccountInfo(testAccount, testBlockHash);
    const newReg = await clientV2.getAccountInfo(testAccount, testBlockHash);

    const oldCredId = await clientV1.getAccountInfo(testCredId, testBlockHash);
    const newCredId = await clientV2.getAccountInfo(testCredId, testBlockHash);

    const oldBaker = await clientV1.getAccountInfo(testAccBaker, testBlockHash);
    const newBaker = await clientV2.getAccountInfo(testAccBaker, testBlockHash);

    const oldDeleg = await clientV1.getAccountInfo(testAccDeleg, testBlockHash);
    const newDeleg = await clientV2.getAccountInfo(testAccDeleg, testBlockHash);

    // Tempoary
    if (oldReg?.accountCredentials[0].value.type === 'normal') {
        oldReg.accountCredentials[0].value.contents.arData = {};
    }
    if (oldCredId?.accountCredentials[0].value.type === 'normal') {
        oldCredId.accountCredentials[0].value.contents.arData = {};
    }
    if (oldBaker?.accountCredentials[0].value.type === 'normal') {
        oldBaker.accountCredentials[0].value.contents.arData = {};
    }
    if (oldDeleg?.accountCredentials[0].value.type === 'normal') {
        oldDeleg.accountCredentials[0].value.contents.arData = {};
    }

    expect(oldReg).toEqual(newReg);
    expect(oldCredId).toEqual(newCredId);
    expect(oldDeleg).toEqual(newDeleg);
    expect(oldBaker).toEqual(newBaker);
})

test('getBlockItemStatus', async () => {
    const transactionHash = '3de823b876d05cdd33a311a0f84124079f5f677afb2534c4943f830593edc650';
    const blockItemStatus = await clientV2.getBlockItemStatus(transactionHash);

    const expected = {
        finalized: {
            outcome: {
                blockHash: {
                    value: 'LZ4aCBgZrY2/gdWoguovU1LLNCn8ErDsGMExo2B1GmY=',
                },
                outcome: {
                    index: {},
                    energyCost: {},
                    hash: {
                        value: 'PegjuHbQXN0zoxGg+EEkB59fZ3r7JTTElD+DBZPtxlA=',
                    },
                    update: {
                        effectiveTime: {},
                        payload: {
                            microCcdPerEuroUpdate: {
                                value: {
                                    numerator: '17592435270983729152',
                                    denominator: '163844642115',
                                },
                            },
                        },
                    },
                },
            },
        },
    };

    expect(v2.BlockItemStatus.toJson(blockItemStatus)).toEqual(expected);
});
