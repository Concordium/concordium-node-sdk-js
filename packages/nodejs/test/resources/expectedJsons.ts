import {
    AccountAddress,
    CcdAmount,
    ModuleReference,
} from '@concordium/common-sdk';

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
            transfer: {
                amount: 1000000n,
                tag: 'Transferred',
                to: '3BpVX13dw29JruyMzCfde96hoB7DtQ53WMGVDMrmPtuYAbzADj',
            },
        },
    },
};

export const instanceInfo = {
    version: 1,
    owner: new AccountAddress(
        '4Y1c27ZRpRut9av69n3i1uhfeDp4XGuvsm9fkEjFvgpoxXWxQB'
    ),
    amount: new CcdAmount(0n),
    methods: ['weather.get', 'weather.set'],
    name: 'init_weather',
    sourceModule: new ModuleReference(
        '67d568433bd72e4326241f262213d77f446db8ba03dfba351ae35c1b2e7e5109'
    ),
};

export const invokeInstanceResponseV0 = {
    tag: 'success',
    usedEnergy: 342n,
    returnValue: undefined,
    events: [
        {
            tag: 'Updated',
            events: [],
            amount: 1n,
            address: {
                index: 6n,
                subindex: 0n,
            },
            contractVersion: 0,
            instigator: {
                type: 'AddressAccount',
                address: '3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G',
            },
            message: '',
            receiveName: 'PiggyBank.insert',
        },
    ],
};

export const accountList = [
    '3QK1rxUXV7GRk4Ng7Bs7qnbkdjyBdjzCytpTrSQN7BaJkiEfgZ',
    '3U4sfVSqGG6XK8g6eho2qRYtnHc4MWJBG1dfxdtPGbfHwFxini',
    '3gGBYDSpx2zWL3YMcqD48U5jVXYG4pJBDZqeY5CbMMKpxVBbc3',
    '3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G',
    '3ntvNGT6tDuLYiSb5gMJSQAZfLPUJnzoizcFiVRWqLoctuXxpK',
    '3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV',
    '3y9DtDUL8xpf8i2yj9k44zMVkf4H1hkpBEQcXbJhrgcwYSGg41',
    '42tFTDWvTmBd7hEacohuCfGFa9TsBKhsmXKeViQ7q7NoY7UadV',
    '44Axe5eHnMkBinX7GKvUm5w6mX83JGdasijhvsMv5ZW2Wmgphg',
    '48XGRnvQoG92T1AwETvW5pnJ1aRSPMKsWtGdKhTqyiNZzMk3Qn',
    '4AnukgcopMC4crxfL1L9fUYw9MAkoo1yKLvH7eA1NAX7SxgyRY',
    '4BTFaHx8CioLi8Xe7YiimpAK1oQMkbx5Wj6B8N7d7NXgmLvEZs',
    '4EJJ1hVhbVZT2sR9xPzWUwFcJWK3fPX54z94zskTozFVk8Xd4L',
];

export const moduleList = [
    '67d568433bd72e4326241f262213d77f446db8ba03dfba351ae35c1b2e7e5109',
    '6f0524700ed808a8fe0d7e23014c5138e4fac1fd8ec85c5e3591096f48609206',
    'ceb018e4cd3456c0ccc0bca14285a69fd55f4cb09c322195d49c5c22f85930fe',
];

export const ancestorList = [
    'fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e',
    '28d92ec42dbda119f0b0207d3400b0573fe8baf4b0d3dbe44b86781ad6b655cf',
    'abc98d4866e92b0ac4722d523aee96cafcdd127694d565c532e149616dbad96c',
];

export const instanceStateList = [
    {
        key: '',
        value: '3b00000068747470733a2f2f72656c617965722d746573746e65742e746f6e692e73797374656d732f746f6b656e2f6d657461646174612f4d4f434b2e657402000000000000000300000000000000',
    },
    {
        key: '0000000000000000',
        value: '0500000000000000',
    },
    {
        key: '0300000000000000008ffbe4209190c92b68b4f9d59cfb64305337a9cad018ac71156cc8f6e41f9fa5',
        value: '0400000000000000',
    },
    {
        key: '040000000000000000',
        value: '',
    },
];

export const ipList = [
    {
        ipIdentity: 0,
        ipDescription: {
            name: 'Concordium testnet IP',
            url: '',
            description: 'Concordium testnet identity provider',
        },
        ipVerifyKey: '',
        ipCdiVerifyKey:
            '2e1cff3988174c379432c1fad7ccfc385c897c4477c06617262cec7193226eca',
    },
    {
        ipIdentity: 1,
        ipDescription: {
            name: 'Notabene (Staging)',
            url: 'https://notabene.studio',
            description: 'Notabene Identity Issuer (Staging Service)',
        },
        ipVerifyKey: '',
        ipCdiVerifyKey:
            '4810d66439a25d9b345cf5c7ac11f9e512548c278542d9b24dc73541626d6197',
    },
    {
        ipIdentity: 3,
        ipDescription: {
            name: 'Digital Trust Solutions TestNet',
            url: 'https://www.digitaltrustsolutions.nl',
            description:
                'Identity verified by Digital Trust Solutions on behalf of Concordium',
        },
        ipVerifyKey: '',
        ipCdiVerifyKey:
            '534858c8990f225b34be324c74c03ce8745080d5d5ea4fde2468157b4892b690',
    },
];

export const arList = [
    {
        arIdentity: 1,
        arDescription: {
            name: 'Testnet AR 1',
            url: '',
            description: 'Testnet anonymity revoker 1',
        },
        arPublicKey:
            'b14cbfe44a02c6b1f78711176d5f437295367aa4f2a8c2551ee10d25a03adc69d61a332a058971919dad7312e1fc94c58ed5281b5d117cb74068a5deef28f027c9055dd424b07043568ac040a4e51f3307f268a77eaebc36bd4bf7cdbbe238b8',
    },
    {
        arIdentity: 2,
        arDescription: {
            name: 'Testnet AR 2',
            url: '',
            description: 'Testnet anonymity revoker 2',
        },
        arPublicKey:
            'b14cbfe44a02c6b1f78711176d5f437295367aa4f2a8c2551ee10d25a03adc69d61a332a058971919dad7312e1fc94c5aefb2334688a2ecc95e7c49e9ccbc7218b5c9e151ac22462d064f564ffa56bb8b3685fcdc8d7d8cb43f43d608e7e8515',
    },
    {
        arIdentity: 3,
        arDescription: {
            name: 'Testnet AR 3',
            url: '',
            description: 'Testnet anonymity revoker 3',
        },
        arPublicKey:
            'b14cbfe44a02c6b1f78711176d5f437295367aa4f2a8c2551ee10d25a03adc69d61a332a058971919dad7312e1fc94c5a791a28a6d3e7ca0857c0f996f94e65da78b8d9b5de5e32164e291e553ed103bf14d6fab1f21749d59664e34813afe77',
    },
];
