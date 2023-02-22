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

export const delegatorInfoList = [
    {
        account: '3uX8g2uzQwBjVSJ6ZDU5cQCKhgsET6kMuRoraQH2ANB9Xa84YR',
        stake: 40000000000n,
    },
    {
        account: '4mAs6xcFw26fb6u8odkJWoe3fAK8bCJ91BwScUc36DFhh3thwD',
        stake: 10000000n,
    },
    {
        account: '3NvUNvVm5puDT2EYbo7hCF3d5AwzzCqKE18Ms6BYkKY9UShdf3',
        stake: 3000000000n,
    },
    {
        account: '3ivPxmqdRk5TX5mKpFshKzrA44bYUW2tg6EwDPvALszNoBGTK9',
        stake: 33000000n,
    },
    {
        account: '37tU96v4MQSaEgVP68M3TBRHMwZpgYSGnMer3ta3FJ8wkXtjDQ',
        stake: 94000000n,
    },
];

export const passiveDelegatorInfoList = [
    {
        account: '4gCvJ91EeYzsTzwiC7Kr4AcFzSuDmf5wxev7FRzU3uw49WamBm',
        stake: 1900000000n,
    },
    {
        account: '4mQweXtq3zHwS7CtK5fjWkpJDUvtUSKycNa8xaEbe6kErGeXcL',
        stake: 1000000000n,
    },
    {
        account: '3irV7FF3BZbz9ejGTm7EHLUi6CQHdJUELDfyhwkHcLqXmQyUfR',
        stake: 100000000n,
        pendingChange: {
            effectiveTime: new Date('2022-06-28T11:47:37.750Z'),
            change: 'RemoveStake',
        },
    },
];

export const passiveDelegatorRewardInfoList = [
    {
        account: '4gCvJ91EeYzsTzwiC7Kr4AcFzSuDmf5wxev7FRzU3uw49WamBm',
        stake: 1900000000n,
    },
    {
        account: '4mQweXtq3zHwS7CtK5fjWkpJDUvtUSKycNa8xaEbe6kErGeXcL',
        stake: 1000000000n,
    },
];

export const electionInfoList = {
    electionDifficulty: 0.025,
    electionNonce:
        '0bb2121015ddd9026d0c31a8b33499ce6049daf5696fe4e2cd94cff83ad331f2',
    bakerElectionInfo: [
        {
            baker: 0n,
            account: '48XGRnvQoG92T1AwETvW5pnJ1aRSPMKsWtGdKhTqyiNZzMk3Qn',
            lotteryPower: 0.09090909090909091,
        },
        {
            baker: 1n,
            account: '3U4sfVSqGG6XK8g6eho2qRYtnHc4MWJBG1dfxdtPGbfHwFxini',
            lotteryPower: 0.09090909090909091,
        },
        {
            baker: 2n,
            account: '3QK1rxUXV7GRk4Ng7Bs7qnbkdjyBdjzCytpTrSQN7BaJkiEfgZ',
            lotteryPower: 0.09090909090909091,
        },
        {
            baker: 3n,
            account: '3gGBYDSpx2zWL3YMcqD48U5jVXYG4pJBDZqeY5CbMMKpxVBbc3',
            lotteryPower: 0.09090909090909091,
        },
        {
            baker: 4n,
            account: '44Axe5eHnMkBinX7GKvUm5w6mX83JGdasijhvsMv5ZW2Wmgphg',
            lotteryPower: 0.09090909090909091,
        },
        {
            baker: 5n,
            account: '4EJJ1hVhbVZT2sR9xPzWUwFcJWK3fPX54z94zskTozFVk8Xd4L',
            lotteryPower: 0.09090909090909091,
        },
        {
            baker: 6n,
            account: '3ntvNGT6tDuLYiSb5gMJSQAZfLPUJnzoizcFiVRWqLoctuXxpK',
            lotteryPower: 0.09090909090909091,
        },
        {
            baker: 7n,
            account: '4BTFaHx8CioLi8Xe7YiimpAK1oQMkbx5Wj6B8N7d7NXgmLvEZs',
            lotteryPower: 0.09090909090909091,
        },
        {
            baker: 8n,
            account: '4AnukgcopMC4crxfL1L9fUYw9MAkoo1yKLvH7eA1NAX7SxgyRY',
            lotteryPower: 0.09090909090909091,
        },
        {
            baker: 9n,
            account: '3y9DtDUL8xpf8i2yj9k44zMVkf4H1hkpBEQcXbJhrgcwYSGg41',
            lotteryPower: 0.09090909090909091,
        },
        {
            baker: 10n,
            account: '42tFTDWvTmBd7hEacohuCfGFa9TsBKhsmXKeViQ7q7NoY7UadV',
            lotteryPower: 0.09090909090909091,
        },
    ],
};

export const transactionEventList = [
    {
        type: 'updateTransaction',
        index: 0n,
        energyCost: 0n,
        hash: '49d7b5c3234dc17bd904af0b63712dc0a6680b96ad556c5ac1103d8cdd128891',
        effectiveTime: 0n,
        payload: {
            updateType: 'microGtuPerEuro',
            update: {
                denominator: 126230907181n,
                numerator: 9397474320418127872n,
            },
        },
    },
];
export const seqNums = {
    rootKeys: 1n,
    level1Keys: 1n,
    level2Keys: 1n,
    protocol: 2n,
    electionDifficulty: 1n,
    euroPerEnergy: 1n,
    microCcdPerEuro: 7053n,
    foundationAccount: 1n,
    mintDistribution: 1n,
    transactionFeeDistribution: 1n,
    gasRewards: 1n,
    poolParameters: 1n,
    addAnonymityRevoker: 1n,
    addIdentityProvider: 1n,
    cooldownParameters: 1n,
    timeParameters: 1n,
};

export const specialEventList = [
    {
        tag: 'blockAccrueReward',
        transactionFees: 0n,
        oldGasAccount: 293604n,
        newGasAccount: 219102n,
        bakerReward: 74502n,
        passiveReward: 0n,
        foundationCharge: 0n,
        baker: 4n,
    },
];

export const pendingUpdateList = [
    {
        updateType: 'protocol',
        update: {
            message: 'Enable protocol version 5',
            specificationHash:
                'af5684e70c1438e442066d017e4410af6da2b53bfa651a07d81efa2aa668db20',
            specificationUrl:
                'https://github.com/Concordium/concordium-update-proposals/blob/main/updates/P5.txt',
            specificationAuxiliaryData: '',
        },
    },
];

export const blockFinalizationSummary = {
    tag: 'record',
    record: {
        block: '28d92ec42dbda119f0b0207d3400b0573fe8baf4b0d3dbe44b86781ad6b655cf',
        index: 1131614n,
        delay: 0n,
        finalizers: [
            { baker: 1n, weight: 4605214437901336n, signed: true },
            { baker: 3n, weight: 4605214437901336n, signed: true },
            { baker: 4n, weight: 4605214437901336n, signed: true },
            { baker: 5n, weight: 4605214437901336n, signed: true },
            { baker: 6n, weight: 4605214437901336n, signed: true },
            { baker: 8n, weight: 4605214437901336n, signed: true },
            { baker: 1004n, weight: 507612256350096n, signed: true },
            { baker: 1010n, weight: 507901387892080n, signed: true },
            { baker: 1016n, weight: 507513359855434n, signed: true },
            { baker: 1370n, weight: 450114678242347n, signed: false },
        ],
    },
};

export const accountCreationEvent = {
    type: 'accountCreation',
    index: 0n,
    energyCost: 54100n,
    hash: '9931f541e166d86916354fc98759fcad604d447041142c0897f473093aaafdb5',
    credentialType: 'normal',
    address: '32YGU1j7Z3xwA5URGYFrMamKj7JtfGvXFiXH4p3gAKdrpJcdg2',
    regId: '9015cfd6c1bd06f0e0355fc5355a0c18fe0cb37632d469b07d6fbfa9c05facc271c975466d8dfe3144c683f44fd0af71',
};

export const transferToPublicEvent = [
    {
        tag: 'EncryptedAmountsRemoved',
        account: '3BpVX13dw29JruyMzCfde96hoB7DtQ53WMGVDMrmPtuYAbzADj',
        inputAmount:
            'b74e0a607e30eefc5e9323befdbebae158f66c0f6767d3c3f3ff4b1a9d5b9f0e5e565d734141bd82bfca4bcf32e2bec182e895b7afde650cd2e51c2d704d58965b0c462ffef2fca87204ac5248b111290b699dfe84887aa11ab357dab4b2ba00b3301a5e0fbc6cd3f9ac58bbf19abcc9a56ecc83a16738508fb9ec60da2818d5360dbf66839c6a4037e37c2a4a64956ab5c30c0bf1ed90713838dd8a6cce803111698f9c0e145cae6be38e4136ebdc6205ac4ca2f43852dac7e7f6d37fc55cdc',
        newAmount:
            '82b3675ff0e54bcd646df7d80c50d82da17bcd91fba1ed08e2577711cf5cc00fab65cecc6d7ed62bd9f9c07c68512e2bb871bb789eaef79797724bc17b036966ba88a6e2e83e4685ed6a10b78009faff42a5ed991825a67bc58762c09e9b5779b4b32bee19e9828d4b4bf1c5096afe4fa20c995356e9e34d3657f66ac5d96c051770ba3cfce01aaba3dcadc771e1787aa5cfa1d522fb3be9135f0906a77233fe7c98023b45c76cde3a37be3972377933618c7f7f36bcbac71ce14053171700da',
        upToIndex: 0,
    },
    {
        tag: 'AmountAddedByDecryption',
        account: '3BpVX13dw29JruyMzCfde96hoB7DtQ53WMGVDMrmPtuYAbzADj',
        amount: 1000000n,
    },
];

export const configureBaker = [
    {
        tag: 'BakerAdded',
        account: '2zdNDFqqn6pGPzEVRLTLNfBX6FTyQECjAgdLWqYEvBsv7uRjSS',
        aggregationKey:
            '802f086e91d71a4d8e1437229b4b7f39c2f45ee1a075e4b786f60af7ec278fa0052318f3f65989cd0cdd0e9ef17b865710b59ef9b894f1f4fb6a58ebbef7b07a04a503421cfa37229c66a9fe8e943be47fba7b15eb263227224e35e0ff088fda',
        bakerId: 2561n,
        electionKey:
            'fc8ed2131072701dd78707c3414b410fe222957dceb04e3ff7483e5211ac312b',
        restakeEarnings: true,
        signKey:
            '0055703a2615746700b58e312aa428e5526993d6d3f3f109db92436115d63818',
        stake: 15000000000n,
    },
    {
        tag: 'BakerSetRestakeEarnings',
        account: '2zdNDFqqn6pGPzEVRLTLNfBX6FTyQECjAgdLWqYEvBsv7uRjSS',
        bakerId: 2561n,
        restakeEarnings: true,
    },
    {
        tag: 'BakerSetOpenStatus',
        account: '2zdNDFqqn6pGPzEVRLTLNfBX6FTyQECjAgdLWqYEvBsv7uRjSS',
        bakerId: 2561n,
        openStatus: 'openForAll',
    },
    {
        tag: 'BakerSetMetadataURL',
        account: '2zdNDFqqn6pGPzEVRLTLNfBX6FTyQECjAgdLWqYEvBsv7uRjSS',
        bakerId: 2561n,
        metadataURL: '',
    },
    {
        tag: 'BakerSetTransactionFeeCommission',
        account: '2zdNDFqqn6pGPzEVRLTLNfBX6FTyQECjAgdLWqYEvBsv7uRjSS',
        bakerId: 2561n,
        transactionFeeCommission: 0.1,
    },
    {
        tag: 'BakerSetBakingRewardCommission',
        account: '2zdNDFqqn6pGPzEVRLTLNfBX6FTyQECjAgdLWqYEvBsv7uRjSS',
        bakerId: 2561n,
        bakingRewardCommission: 0.1,
    },
    {
        tag: 'BakerSetFinalizationRewardCommission',
        account: '2zdNDFqqn6pGPzEVRLTLNfBX6FTyQECjAgdLWqYEvBsv7uRjSS',
        bakerId: 2561n,
        finalizationRewardCommission: 1,
    },
];

export const bakerRemoved = {
    tag: 'BakerRemoved',
    bakerId: 1879n,
    account: '4aCoaW3qkQRnY3fUGThQcEMGSPLUEQ7XL9Yagx2UR91QpvtoAe',
};

export const configureDelegation = [
    {
        account: '3BpVX13dw29JruyMzCfde96hoB7DtQ53WMGVDMrmPtuYAbzADj',
        delegatorId: 2059,
        tag: 'DelegationAdded',
    },
    {
        account: '3BpVX13dw29JruyMzCfde96hoB7DtQ53WMGVDMrmPtuYAbzADj',
        delegationTarget: { delegateType: 'Passive' },
        delegatorId: 2059,
        tag: 'DelegationSetDelegationTarget',
    },
    {
        account: '3BpVX13dw29JruyMzCfde96hoB7DtQ53WMGVDMrmPtuYAbzADj',
        delegatorId: 2059,
        restakeEarnings: true,
        tag: 'DelegationSetRestakeEarnings',
    },
    {
        account: '3BpVX13dw29JruyMzCfde96hoB7DtQ53WMGVDMrmPtuYAbzADj',
        delegatorId: 2059,
        newStake: 1000000n,
        tag: 'DelegationStakeIncreased',
    },
];

export const updateEvent = [
    {
        address: { index: 866n, subindex: 0n },
        events: [],
        tag: 'Interrupted',
    },
    {
        address: { index: 865n, subindex: 0n },
        events: [],
        tag: 'Interrupted',
    },
    {
        address: { index: 864n, subindex: 0n },
        amount: 0n,
        contractVersion: 1,
        events: [],
        instigator: {
            address: { index: 865n, subindex: 0n },
            type: 'AddressContract',
        },
        message: '0000',
        receiveName: 'CIS2-wCCD-State.getPaused',
        tag: 'Updated',
    },
    {
        address: { index: 865n, subindex: 0n },
        success: true,
        tag: 'Resumed',
    },
    {
        address: { index: 865n, subindex: 0n },
        events: [],
        tag: 'Interrupted',
    },
    {
        address: { index: 864n, subindex: 0n },
        amount: 0n,
        contractVersion: 1,
        events: [],
        instigator: {
            address: { index: 865n, subindex: 0n },
            type: 'AddressContract',
        },
        message:
            '00e9f89f76878691716298685f21637d86fd8c98de7baa1d67e0ce11241be00083',
        receiveName: 'CIS2-wCCD-State.getBalance',
        tag: 'Updated',
    },
    {
        address: { index: 865n, subindex: 0n },
        success: true,
        tag: 'Resumed',
    },
    {
        address: { index: 865n, subindex: 0n },
        events: [],
        tag: 'Interrupted',
    },
    {
        address: { index: 864n, subindex: 0n },
        amount: 0n,
        contractVersion: 1,
        events: [],
        instigator: {
            address: { index: 865n, subindex: 0n },
            type: 'AddressContract',
        },
        message:
            '00e9f89f76878691716298685f21637d86fd8c98de7baa1d67e0ce11241be00083c0843d00',
        receiveName: 'CIS2-wCCD-State.setBalance',
        tag: 'Updated',
    },
    {
        address: { index: 865n, subindex: 0n },
        success: true,
        tag: 'Resumed',
    },
    {
        address: { index: 865n, subindex: 0n },
        events: [],
        tag: 'Interrupted',
    },
    {
        address: { index: 866n, subindex: 0n },
        events: [],
        tag: 'Interrupted',
    },
    {
        amount: 1000000n,
        from: {
            address: { index: 866n, subindex: 0n },
            type: 'AddressContract',
        },
        tag: 'Transferred',
        to: {
            address: '4inf4g36xDEQmjxDbbkqeHD2HNg9v7dohXUDH5S9en4Th53kxm',
            type: 'AddressAccount',
        },
    },
    {
        address: { index: 866n, subindex: 0n },
        success: true,
        tag: 'Resumed',
    },
    {
        address: { index: 866n, subindex: 0n },
        amount: 0n,
        contractVersion: 1,
        events: [],
        instigator: {
            address: { index: 865n, subindex: 0n },
            type: 'AddressContract',
        },
        message:
            'c0843d00e9f89f76878691716298685f21637d86fd8c98de7baa1d67e0ce11241be000830000',
        receiveName: 'CIS2-wCCD-Proxy.transferCCD',
        tag: 'Updated',
    },
    {
        address: { index: 865n, subindex: 0n },
        success: true,
        tag: 'Resumed',
    },
    {
        address: { index: 865n, subindex: 0n },
        events: [],
        tag: 'Interrupted',
    },
    {
        address: { index: 866n, subindex: 0n },
        amount: 0n,
        contractVersion: 1,
        events: [
            'fd00c0843d00e9f89f76878691716298685f21637d86fd8c98de7baa1d67e0ce11241be00083',
        ],
        instigator: {
            address: { index: 865n, subindex: 0n },
            type: 'AddressContract',
        },
        message:
            'fd00c0843d00e9f89f76878691716298685f21637d86fd8c98de7baa1d67e0ce11241be00083',
        receiveName: 'CIS2-wCCD-Proxy.logEvent',
        tag: 'Updated',
    },
    {
        address: { index: 865n, subindex: 0n },
        success: true,
        tag: 'Resumed',
    },
    {
        address: { index: 865n, subindex: 0n },
        amount: 0n,
        contractVersion: 1,
        events: [],
        instigator: {
            address: { index: 866n, subindex: 0n },
            type: 'AddressContract',
        },
        message:
            'c0843d00e9f89f76878691716298685f21637d86fd8c98de7baa1d67e0ce11241be0008300e9f89f76878691716298685f21637d86fd8c98de7baa1d67e0ce11241be00083000000e9f89f76878691716298685f21637d86fd8c98de7baa1d67e0ce11241be00083',
        receiveName: 'CIS2-wCCD.unwrap',
        tag: 'Updated',
    },
    {
        address: { index: 866n, subindex: 0n },
        success: true,
        tag: 'Resumed',
    },
    {
        address: { index: 866n, subindex: 0n },
        amount: 0n,
        contractVersion: 1,
        events: [],
        instigator: {
            address: '4inf4g36xDEQmjxDbbkqeHD2HNg9v7dohXUDH5S9en4Th53kxm',
            type: 'AddressAccount',
        },
        message:
            'c0843d00e9f89f76878691716298685f21637d86fd8c98de7baa1d67e0ce11241be0008300e9f89f76878691716298685f21637d86fd8c98de7baa1d67e0ce11241be000830000',
        receiveName: 'CIS2-wCCD-Proxy.unwrap',
        tag: 'Updated',
    },
];

export const encryptedSelfAmountAddedEvent = {
    account: '3BpVX13dw29JruyMzCfde96hoB7DtQ53WMGVDMrmPtuYAbzADj',
    amount: 10000000n,
    newAmount:
        'c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000098c71824023d5fb1bca5accb3ac010551e4af7e9988cd0ef309ee37149ef7843af6f294e79b8fcbda9b4f4ed094d66cbc00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    tag: 'EncryptedSelfAmountAdded',
};

export const updateEnqueuedEvent = {
    type: 'updateTransaction',
    index: 0n,
    energyCost: 0n,
    hash: 'f296a32603fc14aa679001c49a4db1b2133787ae37743536938ec51382fb8392',
    effectiveTime: 1669115100n,
    payload: {
        updateType: 'protocol',
        update: {
            message: 'Enable protocol version 5',
            specificationHash:
                'af5684e70c1438e442066d017e4410af6da2b53bfa651a07d81efa2aa668db20',
            specificationUrl:
                'https://github.com/Concordium/concordium-update-proposals/blob/main/updates/P5.txt',
            specificationAuxiliaryData: '',
        },
    },
};
export const transferWithScheduleEvent = {
    index: 0n,
    energyCost: 954n,
    hash: '2ab476a902868f47408ca16e167013ed0b5e995dc99271657e0e74549b426290',
    type: 'accountTransaction',
    cost: 2819356n,
    sender: '3BpVX13dw29JruyMzCfde96hoB7DtQ53WMGVDMrmPtuYAbzADj',
    transactionType: 'transferWithSchedule',
    event: {
        tag: 'TransferredWithSchedule',
        to: '3ySdbNTPogmvUBD5g42FaZqYht78jQZ2jose9yZFkCj8zyCGWt',
        amount: [
            {
                timestamp: new Date('2023-01-10T12:00:00.919Z'),
                amount: 500000n,
            },
            {
                timestamp: new Date('2023-02-10T12:00:00.919Z'),
                amount: 500000n,
            },
        ],
    },
};

export const contractInitializedEvent = {
    tag: 'ContractInitialized',
    address: { index: 3132n, subindex: 0n },
    amount: 0n,
    contractVersion: 1,
    events: [],
    initName: 'init_CIS2-Fractionalizer',
    ref: 'e80161061e5074e850dd1fabbabbf80008fc5d3ffae554744aedc4704ee7b412',
};

export const moduleDeployedEvent = {
    tag: 'ModuleDeployed',
    contents:
        '3c532ed32dcb3b9f49afb442457a63465987994e400fd5023c8471c26a858ab4',
};

export const delegationRemovedEvent = {
    tag: 'DelegationRemoved',
    account: '4nvFUvdF3Ki7M6Xc2vHejX7iQW5Gtu7UBu6RaPRZV7LorLToPG',
    delegatorId: 4002,
};

export const transferWithMemoSummary = {
    index: 0n,
    energyCost: 508n,
    hash: '8bfd6c5d3006ea005531d90e88af1075c1a5d0bce1f2befa7abb3ec8b3fb60b5',
    type: 'accountTransaction',
    cost: 879395n,
    sender: '4nJU5pCM49KmrYQ1tsUTEBNBJVxs3X2qo8nKj8CQYsgBmUACHG',
    transactionType: 'transferWithMemo',
    transfer: {
        tag: 'Transferred',
        amount: 250000000n,
        to: '4fxkFceRT3XyUpb4yW3C2c9RnEBhunyNrKprYarr7htKmMvztG',
    },
    memo: { tag: 'TransferMemo', memo: '6474657374' },
};

export const upgradedEvent = {
    address: { index: 3143n, subindex: 0n },
    from: '7371d1039a0e4587a54b8959eaabf11da83fad24650ee6af380357849648f477',
    tag: 'Upgraded',
    to: '7371d1039a0e4587a54b8959eaabf11da83fad24650ee6af380357849648f477',
};

export const dataRegisteredEvent = {
    data: '6b68656c6c6f20776f726c64',
    tag: 'DataRegistered',
};

export const newEncryptedAmountEvent = {
    account: '2za2yAXbFiaB151oYqTteZfqiBzibHXizwjNbpdU8hodq9SfEk',
    encryptedAmount:
        '8695a917b4404bfa7cb787297662f610f08758f73bc73028a0ec004626b28e28bb82a69e86b9b985e36c588ff2b36089ab40ecae0a199c53f088e6c75012c1c116600dbd22dc33285a22ad63b0a99e5b8b6bad012d1d88568eaddcbac8bf03938762267b06a3353659e436cad83ac2f2b6961ccbf4a77cffaa20757f69f2ef3a2d2c7e9a4bf7c7373e50fbd5da02c46c9565146ac5b56c1a9eb7ae0b9614ed9475e26d4cfc2cb03014f70a4ba82f1aae131b735eec2dcc5ddafe5fac1ab0dbf4',
    newIndex: 1,
    tag: 'NewEncryptedAmount',
};

export const bakerKeysUpdatedEvent = {
    account: '4Kmo9keJQaiyAuRM2pRh2xK4e75ph7hp4CzxdFAcRDeQRHfaHT',
    aggregationKey:
        '8cf3c6fe9bebc45e9c9bb34442c5baf7bb612adc193525173d6fe36355be29ad69affeb3937f2b819976ecefeb14c3ae04d9c44d0117eda8c7968602f08f266960226c5fe2014c1bda1794b7fdbd5b5f9d31deb2c053d5f9f3734452e1dcb4b8',
    bakerId: 15n,
    electionKey:
        'b40185d794485eeb099bdfb7df58fc64fd303847f2a947884648e535b023fe23',
    signKey: '5cbc1c8ab56047360ff37229760302e03844d48299f4fb1f1247832778f980c0',
    tag: 'BakerKeysUpdated',
};

export const bakerStakeIncreasedEvent = {
    account: '4JzAXhzJKwG3DGoAbgGhZNnRQqeFdp9zbxv6WUjDbVbyKEie8e',
    bakerId: 525n,
    newStake: 14001000000n,
    tag: 'BakerStakeIncreased',
};

export const credentialKeysUpdatedEvent = {
    credId: 'a643d6082a8f80460fff27f3ff27fedbfdc60039527402b8188fc845a849428b5484c82a1589cab7604c1a2be978c39c',
    tag: 'CredentialKeysUpdated',
};

export const credentialsUpdatedEvent = {
    account: '3irV7FF3BZbz9ejGTm7EHLUi6CQHdJUELDfyhwkHcLqXmQyUfR',
    newCredIds: [],
    newThreshold: 1,
    removedCredIds: [],
    tag: 'CredentialsUpdated',
};

export const bakerStakeDecreasedEvent = {
    tag: 'BakerStakeDecreased',
    account: '4Kmo9keJQaiyAuRM2pRh2xK4e75ph7hp4CzxdFAcRDeQRHfaHT',
    bakerId: 15n,
    newStake: 950000000000n,
};

export const delegationStakeDecreasedEvent = {
    tag: 'DelegationStakeDecreased',
    account: '4mAs6xcFw26fb6u8odkJWoe3fAK8bCJ91BwScUc36DFhh3thwD',
    delegatorId: 57,
    newStake: 10000000n,
};
