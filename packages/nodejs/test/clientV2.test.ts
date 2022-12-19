import { credentials, Metadata } from '@grpc/grpc-js/';
import ConcordiumNodeClient from '../src/clientV2';
import { testnetBulletproofGenerators } from './resources/bulletproofgenerators';
import {
    AccountAddress,
    CredentialRegistrationId,
} from '@concordium/common-sdk';
import { AccountInfo, AccountStakingInfo } from '../grpc/v2/concordium/types';
import OldConcordiumNodeClient from '../src/client';

/**
 * Creates a client to communicate with a local concordium-node
 * used for automatic tests.
 */
export function getNodeClient(
    address = 'service.internal.testnet.concordium.com',
    port = 20000
): ConcordiumNodeClient {
    const metadata = new Metadata();
    return new ConcordiumNodeClient(
        address,
        port,
        credentials.createInsecure(),
        metadata,
        15000
    );
}

export function getOldNodeClient(
    address = 'service.internal.testnet.concordium.com'
): OldConcordiumNodeClient {
    const metadata = new Metadata();
    metadata.add('authentication', 'rpcadmin');
    return new OldConcordiumNodeClient(
        address,
        10000,
        credentials.createInsecure(),
        metadata,
        15000
    );
}

const client = getNodeClient();
const oldClient = getOldNodeClient();

const testAccount = new AccountAddress(
    '3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G'
);
const testBlockHash = Buffer.from(
    '/oj/NUVAecPfEdiuE9V3e6vWHyi+WElO/lG2WT4wcW4=',
    'base64'
);
const testCredId = new CredentialRegistrationId(
    'aa730045bcd20bb5c24349db29d949f767e72f7cce459dc163c4b93c780a7d7f65801dda8ff7e4fc06fdf1a1b246276f'
);
const testAccBaker = new AccountAddress(
    '4EJJ1hVhbVZT2sR9xPzWUwFcJWK3fPX54z94zskTozFVk8Xd4L'
);
const testAccDeleg = new AccountAddress(
    '3bFo43GiPnkk5MmaSdsRVboaX2DNSKaRkLseQbyB3WPW1osPwh'
);

test('getCryptographicParameters', async () => {
    const parameters = await client.getCryptographicParameters(testBlockHash);
    expect(parameters.genesisString).toEqual('Concordium Testnet Version 5');
    expect(parameters.onChainCommitmentKey).toEqual(
        Buffer.from(
            'sUy/5EoCxrH3hxEXbV9DcpU2eqTyqMJVHuENJaA63GnWGjMqBYlxkZ2tcxLh/JTFqNReZLb5F8VA7uFslww9S388r0indGKEh44qziHILqRL+EYJg0Ylvh8wmYisUj+s',
            'base64'
        )
    );

    expect(parameters.bulletproofGenerators).toEqual(
        Buffer.from(testnetBulletproofGenerators, 'base64')
    );
});

test('NextAccountSequenceNumber', async () => {
    const nextAccountSequenceNumber = await client.getNextAccountSequenceNumber(
        testAccount
    );
    expect(
        nextAccountSequenceNumber.sequenceNumber?.value
    ).toBeGreaterThanOrEqual(19n);
    expect(nextAccountSequenceNumber.allFinal).toBeDefined();
});

test('AccountInfo', async () => {
    const accountInfo = await client.getAccountInfoV2(
        testAccount,
        testBlockHash
    );

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

    expect(AccountInfo.toJson(accountInfo)).toEqual(expected);
});

test('getAccountInfo: Invalid hash throws error', async () => {
    const invalidBlockHash = Buffer.from('1010101010', 'hex');
    await expect(
        client.getAccountInfo(testAccount, invalidBlockHash)
    ).rejects.toEqual(
        new Error(
            'The input was not a valid hash, must be 32 bytes: ' +
                Buffer.from(invalidBlockHash).toString('hex')
        )
    );
});

test('getAccountInfo for baker', async () => {
    const accInfo = await client.getAccountInfoV2(testAccBaker, testBlockHash);
    const accountIndexInfo = await client.getAccountInfoV2(5n, testBlockHash);

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
        const stake = AccountStakingInfo.toJson(accInfo.stake);
        const stakeAccountIndex = AccountStakingInfo.toJson(
            accountIndexInfo.stake
        );
        expect(stake).toEqual(expected);
        expect(stake).toEqual(stakeAccountIndex);
    }
});

test('getAccountInfo for delegator', async () => {
    const accInfo = await client.getAccountInfoV2(testAccDeleg, testBlockHash);

    const expected = {
        delegator: {
            stakedAmount: { value: '620942412516' },
            restakeEarnings: true,
            target: { passive: {} },
        },
    };

    if (accInfo.stake) {
        const stakeJson = AccountStakingInfo.toJson(accInfo.stake);
        expect(stakeJson).toEqual(expected);
    }
});

test('getAccountInfo: Account Address and CredentialRegistrationId is equal', async () => {
    const accInfo = await client.getAccountInfo(testAccount, testBlockHash);
    const credIdInfo = await client.getAccountInfo(testCredId, testBlockHash);

    expect(accInfo).toEqual(credIdInfo);
});

// Todo: test ARData
test('accountInfo arData check', async () => {
    const newInfoLog = await client.getAccountInfoV2(
        testAccount,
        testBlockHash
    );
    console.debug(AccountInfo.toJsonString(newInfoLog));

    const oldInfo = await oldClient.getAccountInfo(
        testAccount,
        testBlockHash.toString('hex')
    );
    const newInfo = await client.getAccountInfo(testAccount, testBlockHash);

    console.debug(JSON.stringify(newInfo.accountCredentials));

    if (
        newInfoLog.creds[0].credentialValues.oneofKind === 'normal' &&
        oldInfo?.accountCredentials[0].value.type === 'normal'
    ) {
        //oldInfo.accountCredentials[0].value.contents.arData = {};
        console.debug(
            'new ArData:',
            newInfoLog.creds[0].credentialValues.normal.arData[1]
        );
        console.debug(
            'old ArData',
            oldInfo?.accountCredentials[0].value.contents.arData
        );
    }

    expect(oldInfo).toEqual(newInfo);
});

test('accountInfo implementations is the same', async () => {
    const hexBlockHash = testBlockHash.toString('hex');
    const oldReg = await oldClient.getAccountInfo(testAccount, hexBlockHash);
    const newReg = await client.getAccountInfo(testAccount, testBlockHash);

    const oldCredId = await oldClient.getAccountInfo(testCredId, hexBlockHash);
    const newCredId = await client.getAccountInfo(testCredId, testBlockHash);

    const oldBaker = await oldClient.getAccountInfo(testAccBaker, hexBlockHash);
    const newBaker = await client.getAccountInfo(testAccBaker, testBlockHash);

    const oldDeleg = await oldClient.getAccountInfo(testAccDeleg, hexBlockHash);
    const newDeleg = await client.getAccountInfo(testAccDeleg, testBlockHash);

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
});
