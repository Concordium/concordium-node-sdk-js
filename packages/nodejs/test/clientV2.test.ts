import { credentials, Metadata } from '@grpc/grpc-js/';
import ConcordiumNodeClient from '../src/clientV2';
import { testnetBulletproofGenerators } from './resources/bulletproofgenerators';
import {
    AccountAddress,
    CredentialRegistrationId,
} from '@concordium/common-sdk';
import { AccountInfo, AccountStakingInfo } from '../grpc/v2/concordium/types';

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

const client = getNodeClient();

const testAccount = new AccountAddress(
    '3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G'
);
const testBlockHash = Buffer.from(
    '/oj/NUVAecPfEdiuE9V3e6vWHyi+WElO/lG2WT4wcW4=',
    'base64'
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
    const accountInfo = await client.getAccountInfo(testAccount, testBlockHash);

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
    const accountInfo = await client.getAccountInfo(5n, testBlockHash);

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
    if (accountInfo.stake) {
        const stake = AccountStakingInfo.toJson(accountInfo.stake);
        expect(stake).toEqual(expected);
    }
});

test('getAccountInfo for delegator', async () => {
    const delegator = '3bFo43GiPnkk5MmaSdsRVboaX2DNSKaRkLseQbyB3WPW1osPwh';
    const accountInfo = await client.getAccountInfo(
        new AccountAddress(delegator),
        testBlockHash
    );

    const expected = {
        delegator: {
            stakedAmount: { value: '620942412516' },
            restakeEarnings: true,
            target: { passive: {} },
        },
    };

    if (accountInfo.stake) {
        const stakeJson = AccountStakingInfo.toJson(accountInfo.stake);
        expect(stakeJson).toEqual(expected);
    }
});

test('getAccountInfo: Account Address and CredentialRegistrationId is equal', async () => {
    const credId =
        'aa730045bcd20bb5c24349db29d949f767e72f7cce459dc163c4b93c780a7d7f65801dda8ff7e4fc06fdf1a1b246276f';
    const accountInfoAddress = await client.getAccountInfo(
        new CredentialRegistrationId(credId),
        testBlockHash
    );

    const accountInfoCredId = await client.getAccountInfo(
        new CredentialRegistrationId(credId),
        testBlockHash
    );

    expect(accountInfoAddress).toEqual(accountInfoCredId);
});
