export const accountInfo = {
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
                arData: {
                    1: {
                        encIdCredPubShare:
                            'qR5XDlS57nwwRXC8OgZup13YMwhsaDpCHBHlZUgt4B/8L7dCQIzx29bHRM3eiDVGkSDOag4MEvv9U+m+gWVpAKlRCfgEGOfLulEMRX8VoMs0e9w/VQjUbOyHqSFGhqYd',
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

export const stakingInfoBaker = {
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

export const stakingInfoDelegator = {
    delegator: {
        stakedAmount: { value: '620942412516' },
        restakeEarnings: true,
        target: { passive: {} },
    },
};

export const blockItemStatusUpdate = {
    status: 'finalized',
    outcome: {
        blockHash:
            '2d9e1a081819ad8dbf81d5a882ea2f5352cb3429fc12b0ec18c131a360751a66',
        summary: {
            index: 0n,
            energyCost: 0n,
            hash: '3de823b876d05cdd33a311a0f84124079f5f677afb2534c4943f830593edc650',
            type: 'updateTransaction',
            effectiveTime: 0n,
            payload: {
                updateType: 'microGtuPerEuro',
                update: {
                    numerator: 17592435270983729152n,
                    denominator: 163844642115n,
                },
            },
        },
    },
};

export const blockItemStatusTransfer = {
    status: 'finalized',
    outcome: {
        blockHash:
            '577513ab772da146c7abb9f30c521668d7ef4fa01f4838cc51d5f59e27c7a5fc',
        summary: {
            type: 'accountTransaction',
            index: 0n,
            cost: 1480606n,
            energyCost: 501n,
            hash: '502332239efc0407eebef5c73c390080e5d7e1b127ff29f786a62b3c9ab6cfe7',
            sender: '4fKPBDf9r5vhEpoeNY7SJbZv8bAJvYYyJSEggZkNyQPgao8iLy',
            transactionType: 'transfer',
            event: {
                amount: 1000000n,
                tag: 'Transferred',
                to: {
                    address:
                        '3BpVX13dw29JruyMzCfde96hoB7DtQ53WMGVDMrmPtuYAbzADj',
                    type: 'AddressAccount',
                },
            },
        },
    },
};

export const instanceInfo = {
    v1: {
        owner: {
            value: '0YBPp1cC7ISiGOEh3OLFvm9rCgolsXjymRwBmxeX1R4=',
        },
        amount: {},
        methods: [
            {
                value: 'weather.get',
            },
            {
                value: 'weather.set',
            },
        ],
        name: {
            value: 'init_weather',
        },
        sourceModule: {
            value: 'Z9VoQzvXLkMmJB8mIhPXf0RtuLoD37o1GuNcGy5+UQk=',
        },
    },
};

export const invokeInstanceResponseV0 = {
    tag: 'success',
    usedEnergy: 342n,
    returnValue: undefined,
    events: [
        {
            tag: "Updated",
            events: [],
            amount: 1n,
            address: {
                index: 6n,
                subindex: 0n,
            },
            contractVersion: 0,
            instigator: {
                type: "AddressAccount",
                address: "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G",
            },
            message: '',
            receiveName: 'PiggyBank.insert',
        },
    ]
};
