import {
    AccountAddress,
    AccountCreationSummary,
    AccountInfoBaker,
    AccountInfoDelegator,
    AccountInfoSimple,
    AccountInfoType,
    AmountAddedByDecryptionEvent,
    AmountTooLarge,
    BakerEvent,
    BakerPoolPendingChangeType,
    BakerPoolStatus,
    BaseAccountTransactionSummary,
    BlockFinalizationSummary,
    BlockHash,
    BlockInfoV0,
    BlockItemStatus,
    BlockItemSummary,
    BlockSpecialEvent,
    BlockSpecialEventBakingRewards,
    BlockSpecialEventBlockAccrueReward,
    BlockSpecialEventBlockReward,
    BlockSpecialEventFinalizationRewards,
    BlockSpecialEventPaydayAccountReward,
    BlockSpecialEventPaydayFoundationReward,
    BlockSpecialEventPaydayPoolReward,
    CcdAmount,
    ChainParametersV0,
    ChainParametersV1,
    ContractAddress,
    ContractEvent,
    ContractInitializedEvent,
    ContractTraceEvent,
    CredentialKeysUpdatedEvent,
    CredentialsUpdatedEvent,
    DataRegisteredEvent,
    DelegationEvent,
    DelegationTargetType,
    DelegatorInfo,
    DelegatorRewardPeriodInfo,
    ElectionInfoV0,
    EncryptedAmountsRemovedEvent,
    EncryptedSelfAmountAddedEvent,
    Energy,
    EpochFinalizationEntry,
    InitName,
    InstanceInfo,
    InvalidContractAddress,
    InvokeContractResult,
    ModuleDeployedEvent,
    ModuleReference,
    NewEncryptedAmountEvent,
    NextUpdateSequenceNumbers,
    OpenStatusText,
    Parameter,
    PassiveDelegationStatus,
    PendingUpdate,
    PoolStatusType,
    QuorumCertificate,
    ReceiveName,
    RejectReason,
    RejectReasonTag,
    RejectedReceive,
    ReturnValue,
    SequenceNumber,
    StakePendingChangeType,
    TimeoutCertificate,
    Timestamp,
    TransactionEventTag,
    TransactionHash,
    TransactionKindString,
    TransactionStatusEnum,
    TransactionSummaryType,
    TransferWithMemoSummary,
    TransferredWithScheduleEvent,
    UpdateSummary,
    UpdateType,
} from '../../../src/index.js';

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
                            ed25519Key: 'npdcg40DcTbP9U9/W3QZIt2bwx5d08nreToCa30fUSU=',
                        },
                        '1': {
                            ed25519Key: 'LTIrh0T6XQGCOtzj9qE7vr3XuFA8CMzD2El+bEYCGXY=',
                        },
                        '2': {
                            ed25519Key: 'mnffP4aSBqfAhbwauCHx4kh2KiK7N0cbPO/Lg3QHZMk=',
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
    availableBalance: {
        value: '35495453082577742',
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

export const blockItemStatusUpdate: BlockItemStatus = {
    status: TransactionStatusEnum.Finalized,
    outcome: {
        blockHash: BlockHash.fromHexString('2d9e1a081819ad8dbf81d5a882ea2f5352cb3429fc12b0ec18c131a360751a66'),
        summary: {
            index: 0n,
            energyCost: Energy.create(0),
            hash: TransactionHash.fromHexString('3de823b876d05cdd33a311a0f84124079f5f677afb2534c4943f830593edc650'),
            type: TransactionSummaryType.UpdateTransaction,
            effectiveTime: 0n,
            payload: {
                updateType: UpdateType.MicroGtuPerEuro,
                update: {
                    numerator: 17592435270983729152n,
                    denominator: 163844642115n,
                },
            },
        },
    },
};

export const blockItemStatusTransfer: BlockItemStatus = {
    status: TransactionStatusEnum.Finalized,
    outcome: {
        blockHash: BlockHash.fromHexString('577513ab772da146c7abb9f30c521668d7ef4fa01f4838cc51d5f59e27c7a5fc'),
        summary: {
            type: TransactionSummaryType.AccountTransaction,
            index: 0n,
            cost: 1480606n,
            energyCost: Energy.create(501),
            hash: TransactionHash.fromHexString('502332239efc0407eebef5c73c390080e5d7e1b127ff29f786a62b3c9ab6cfe7'),
            sender: AccountAddress.fromBase58('4fKPBDf9r5vhEpoeNY7SJbZv8bAJvYYyJSEggZkNyQPgao8iLy'),
            transactionType: TransactionKindString.Transfer,
            transfer: {
                amount: CcdAmount.fromMicroCcd(1000000),
                tag: TransactionEventTag.Transferred,
                to: AccountAddress.fromBase58('3BpVX13dw29JruyMzCfde96hoB7DtQ53WMGVDMrmPtuYAbzADj'),
            },
        },
    },
};

export const instanceInfo: InstanceInfo = {
    version: 1,
    owner: AccountAddress.fromBase58('4Y1c27ZRpRut9av69n3i1uhfeDp4XGuvsm9fkEjFvgpoxXWxQB'),
    amount: CcdAmount.zero(),
    methods: ['weather.get', 'weather.set'].map(ReceiveName.fromStringUnchecked),
    name: InitName.fromStringUnchecked('init_weather'),
    sourceModule: ModuleReference.fromHexString('67d568433bd72e4326241f262213d77f446db8ba03dfba351ae35c1b2e7e5109'),
};

export const invokeInstanceResponseV0: InvokeContractResult = {
    tag: 'success',
    usedEnergy: Energy.create(342),
    returnValue: undefined,
    events: [
        {
            tag: TransactionEventTag.Updated,
            events: [],
            amount: CcdAmount.fromMicroCcd(1),
            address: ContractAddress.create(6),
            contractVersion: 0,
            instigator: {
                type: 'AddressAccount',
                address: AccountAddress.fromBase58('3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G'),
            },
            message: Parameter.empty(),
            receiveName: ReceiveName.fromStringUnchecked('PiggyBank.insert'),
        },
    ],
};

export const accountList: AccountAddress.Type[] = [
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
].map(AccountAddress.fromBase58);

export const moduleList: ModuleReference.Type[] = [
    '67d568433bd72e4326241f262213d77f446db8ba03dfba351ae35c1b2e7e5109',
    '6f0524700ed808a8fe0d7e23014c5138e4fac1fd8ec85c5e3591096f48609206',
    'ceb018e4cd3456c0ccc0bca14285a69fd55f4cb09c322195d49c5c22f85930fe',
].map(ModuleReference.fromHexString);

export const ancestorList: BlockHash.Type[] = [
    'fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e',
    '28d92ec42dbda119f0b0207d3400b0573fe8baf4b0d3dbe44b86781ad6b655cf',
    'abc98d4866e92b0ac4722d523aee96cafcdd127694d565c532e149616dbad96c',
].map(BlockHash.fromHexString);

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
        ipCdiVerifyKey: '2e1cff3988174c379432c1fad7ccfc385c897c4477c06617262cec7193226eca',
    },
    {
        ipIdentity: 1,
        ipDescription: {
            name: 'Notabene (Staging)',
            url: 'https://notabene.studio',
            description: 'Notabene Identity Issuer (Staging Service)',
        },
        ipVerifyKey: '',
        ipCdiVerifyKey: '4810d66439a25d9b345cf5c7ac11f9e512548c278542d9b24dc73541626d6197',
    },
    {
        ipIdentity: 3,
        ipDescription: {
            name: 'Digital Trust Solutions TestNet',
            url: 'https://www.digitaltrustsolutions.nl',
            description: 'Identity verified by Digital Trust Solutions on behalf of Concordium',
        },
        ipVerifyKey: '',
        ipCdiVerifyKey: '534858c8990f225b34be324c74c03ce8745080d5d5ea4fde2468157b4892b690',
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

export const delegatorInfoList: DelegatorInfo[] = [
    {
        account: AccountAddress.fromBase58('3uX8g2uzQwBjVSJ6ZDU5cQCKhgsET6kMuRoraQH2ANB9Xa84YR'),
        stake: CcdAmount.fromMicroCcd(40_000_000_000),
    },
    {
        account: AccountAddress.fromBase58('4mAs6xcFw26fb6u8odkJWoe3fAK8bCJ91BwScUc36DFhh3thwD'),
        stake: CcdAmount.fromMicroCcd(10_000_000),
    },
    {
        account: AccountAddress.fromBase58('3NvUNvVm5puDT2EYbo7hCF3d5AwzzCqKE18Ms6BYkKY9UShdf3'),
        stake: CcdAmount.fromMicroCcd(3000_000_000),
    },
    {
        account: AccountAddress.fromBase58('3ivPxmqdRk5TX5mKpFshKzrA44bYUW2tg6EwDPvALszNoBGTK9'),
        stake: CcdAmount.fromMicroCcd(33_000_000),
    },
    {
        account: AccountAddress.fromBase58('37tU96v4MQSaEgVP68M3TBRHMwZpgYSGnMer3ta3FJ8wkXtjDQ'),
        stake: CcdAmount.fromMicroCcd(94_000_000),
    },
];

export const passiveDelegatorInfoList: DelegatorInfo[] = [
    {
        account: AccountAddress.fromBase58('4gCvJ91EeYzsTzwiC7Kr4AcFzSuDmf5wxev7FRzU3uw49WamBm'),
        stake: CcdAmount.fromMicroCcd(1_900_000_000),
    },
    {
        account: AccountAddress.fromBase58('4mQweXtq3zHwS7CtK5fjWkpJDUvtUSKycNa8xaEbe6kErGeXcL'),
        stake: CcdAmount.fromMicroCcd(1_000_000_000),
    },
    {
        account: AccountAddress.fromBase58('3irV7FF3BZbz9ejGTm7EHLUi6CQHdJUELDfyhwkHcLqXmQyUfR'),
        stake: CcdAmount.fromMicroCcd(100_000_000),
        pendingChange: {
            effectiveTime: new Date('2022-06-28T11:47:37.750Z'),
            change: StakePendingChangeType.RemoveStake,
        },
    },
];

export const passiveDelegatorRewardInfoList: DelegatorRewardPeriodInfo[] = [
    {
        account: AccountAddress.fromBase58('4gCvJ91EeYzsTzwiC7Kr4AcFzSuDmf5wxev7FRzU3uw49WamBm'),
        stake: CcdAmount.fromMicroCcd(1_900_000_000),
    },
    {
        account: AccountAddress.fromBase58('4mQweXtq3zHwS7CtK5fjWkpJDUvtUSKycNa8xaEbe6kErGeXcL'),
        stake: CcdAmount.fromMicroCcd(1_000_000_000),
    },
];

export const electionInfoList: ElectionInfoV0 = {
    version: 0,
    electionDifficulty: 0.025,
    electionNonce: '0bb2121015ddd9026d0c31a8b33499ce6049daf5696fe4e2cd94cff83ad331f2',
    bakerElectionInfo: [
        {
            baker: 0n,
            account: AccountAddress.fromBase58('48XGRnvQoG92T1AwETvW5pnJ1aRSPMKsWtGdKhTqyiNZzMk3Qn'),
            lotteryPower: 0.09090909090909091,
        },
        {
            baker: 1n,
            account: AccountAddress.fromBase58('3U4sfVSqGG6XK8g6eho2qRYtnHc4MWJBG1dfxdtPGbfHwFxini'),
            lotteryPower: 0.09090909090909091,
        },
        {
            baker: 2n,
            account: AccountAddress.fromBase58('3QK1rxUXV7GRk4Ng7Bs7qnbkdjyBdjzCytpTrSQN7BaJkiEfgZ'),
            lotteryPower: 0.09090909090909091,
        },
        {
            baker: 3n,
            account: AccountAddress.fromBase58('3gGBYDSpx2zWL3YMcqD48U5jVXYG4pJBDZqeY5CbMMKpxVBbc3'),
            lotteryPower: 0.09090909090909091,
        },
        {
            baker: 4n,
            account: AccountAddress.fromBase58('44Axe5eHnMkBinX7GKvUm5w6mX83JGdasijhvsMv5ZW2Wmgphg'),
            lotteryPower: 0.09090909090909091,
        },
        {
            baker: 5n,
            account: AccountAddress.fromBase58('4EJJ1hVhbVZT2sR9xPzWUwFcJWK3fPX54z94zskTozFVk8Xd4L'),
            lotteryPower: 0.09090909090909091,
        },
        {
            baker: 6n,
            account: AccountAddress.fromBase58('3ntvNGT6tDuLYiSb5gMJSQAZfLPUJnzoizcFiVRWqLoctuXxpK'),
            lotteryPower: 0.09090909090909091,
        },
        {
            baker: 7n,
            account: AccountAddress.fromBase58('4BTFaHx8CioLi8Xe7YiimpAK1oQMkbx5Wj6B8N7d7NXgmLvEZs'),
            lotteryPower: 0.09090909090909091,
        },
        {
            baker: 8n,
            account: AccountAddress.fromBase58('4AnukgcopMC4crxfL1L9fUYw9MAkoo1yKLvH7eA1NAX7SxgyRY'),
            lotteryPower: 0.09090909090909091,
        },
        {
            baker: 9n,
            account: AccountAddress.fromBase58('3y9DtDUL8xpf8i2yj9k44zMVkf4H1hkpBEQcXbJhrgcwYSGg41'),
            lotteryPower: 0.09090909090909091,
        },
        {
            baker: 10n,
            account: AccountAddress.fromBase58('42tFTDWvTmBd7hEacohuCfGFa9TsBKhsmXKeViQ7q7NoY7UadV'),
            lotteryPower: 0.09090909090909091,
        },
    ],
};

export const transactionEventList: BlockItemSummary[] = [
    {
        type: TransactionSummaryType.UpdateTransaction,
        index: 0n,
        energyCost: Energy.create(0),
        hash: TransactionHash.fromHexString('49d7b5c3234dc17bd904af0b63712dc0a6680b96ad556c5ac1103d8cdd128891'),
        effectiveTime: 0n,
        payload: {
            updateType: UpdateType.MicroGtuPerEuro,
            update: {
                denominator: 126230907181n,
                numerator: 9397474320418127872n,
            },
        },
    },
];
export const seqNums: NextUpdateSequenceNumbers = {
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
    timeoutParameters: 1n,
    blockEnergyLimit: 1n,
    minBlockTime: 1n,
    finalizationCommiteeParameters: 1n,
    validatorScoreParameters: 1n,
};

export const specialEventList: BlockSpecialEvent[] = [
    {
        tag: 'blockAccrueReward',
        transactionFees: CcdAmount.zero(),
        oldGasAccount: CcdAmount.fromMicroCcd(293604),
        newGasAccount: CcdAmount.fromMicroCcd(219102),
        bakerReward: CcdAmount.fromMicroCcd(74502),
        passiveReward: CcdAmount.zero(),
        foundationCharge: CcdAmount.zero(),
        baker: 4n,
    },
];

export const pendingUpdate: PendingUpdate = {
    effectiveTime: Timestamp.fromMillis(1669115100n),
    effect: {
        updateType: UpdateType.Protocol,
        update: {
            message: 'Enable protocol version 5',
            specificationHash: 'af5684e70c1438e442066d017e4410af6da2b53bfa651a07d81efa2aa668db20',
            specificationUrl: 'https://github.com/Concordium/concordium-update-proposals/blob/main/updates/P5.txt',
            specificationAuxiliaryData: '',
        },
    },
};

export const blockFinalizationSummary: BlockFinalizationSummary = {
    tag: 'record',
    record: {
        block: BlockHash.fromHexString('28d92ec42dbda119f0b0207d3400b0573fe8baf4b0d3dbe44b86781ad6b655cf'),
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

export const accountCreationEvent: AccountCreationSummary = {
    type: TransactionSummaryType.AccountCreation,
    index: 0n,
    energyCost: Energy.create(54100),
    hash: TransactionHash.fromHexString('9931f541e166d86916354fc98759fcad604d447041142c0897f473093aaafdb5'),
    credentialType: 'normal',
    address: AccountAddress.fromBase58('32YGU1j7Z3xwA5URGYFrMamKj7JtfGvXFiXH4p3gAKdrpJcdg2'),
    regId: '9015cfd6c1bd06f0e0355fc5355a0c18fe0cb37632d469b07d6fbfa9c05facc271c975466d8dfe3144c683f44fd0af71',
};

export const transferToPublicEvent: [EncryptedAmountsRemovedEvent, AmountAddedByDecryptionEvent] = [
    {
        tag: TransactionEventTag.EncryptedAmountsRemoved,
        account: AccountAddress.fromBase58('3BpVX13dw29JruyMzCfde96hoB7DtQ53WMGVDMrmPtuYAbzADj'),
        inputAmount:
            'b74e0a607e30eefc5e9323befdbebae158f66c0f6767d3c3f3ff4b1a9d5b9f0e5e565d734141bd82bfca4bcf32e2bec182e895b7afde650cd2e51c2d704d58965b0c462ffef2fca87204ac5248b111290b699dfe84887aa11ab357dab4b2ba00b3301a5e0fbc6cd3f9ac58bbf19abcc9a56ecc83a16738508fb9ec60da2818d5360dbf66839c6a4037e37c2a4a64956ab5c30c0bf1ed90713838dd8a6cce803111698f9c0e145cae6be38e4136ebdc6205ac4ca2f43852dac7e7f6d37fc55cdc',
        newAmount:
            '82b3675ff0e54bcd646df7d80c50d82da17bcd91fba1ed08e2577711cf5cc00fab65cecc6d7ed62bd9f9c07c68512e2bb871bb789eaef79797724bc17b036966ba88a6e2e83e4685ed6a10b78009faff42a5ed991825a67bc58762c09e9b5779b4b32bee19e9828d4b4bf1c5096afe4fa20c995356e9e34d3657f66ac5d96c051770ba3cfce01aaba3dcadc771e1787aa5cfa1d522fb3be9135f0906a77233fe7c98023b45c76cde3a37be3972377933618c7f7f36bcbac71ce14053171700da',
        upToIndex: 0,
    },
    {
        tag: TransactionEventTag.AmountAddedByDecryption,
        account: AccountAddress.fromBase58('3BpVX13dw29JruyMzCfde96hoB7DtQ53WMGVDMrmPtuYAbzADj'),
        amount: CcdAmount.fromMicroCcd(1_000_000),
    },
];

export const configureBaker: BakerEvent[] = [
    {
        tag: TransactionEventTag.BakerAdded,
        account: AccountAddress.fromBase58('2zdNDFqqn6pGPzEVRLTLNfBX6FTyQECjAgdLWqYEvBsv7uRjSS'),
        aggregationKey:
            '802f086e91d71a4d8e1437229b4b7f39c2f45ee1a075e4b786f60af7ec278fa0052318f3f65989cd0cdd0e9ef17b865710b59ef9b894f1f4fb6a58ebbef7b07a04a503421cfa37229c66a9fe8e943be47fba7b15eb263227224e35e0ff088fda',
        bakerId: 2561n,
        electionKey: 'fc8ed2131072701dd78707c3414b410fe222957dceb04e3ff7483e5211ac312b',
        restakeEarnings: true,
        signKey: '0055703a2615746700b58e312aa428e5526993d6d3f3f109db92436115d63818',
        stake: CcdAmount.fromMicroCcd(15000000000n),
    },
    {
        tag: TransactionEventTag.BakerSetRestakeEarnings,
        account: AccountAddress.fromBase58('2zdNDFqqn6pGPzEVRLTLNfBX6FTyQECjAgdLWqYEvBsv7uRjSS'),
        bakerId: 2561n,
        restakeEarnings: true,
    },
    {
        tag: TransactionEventTag.BakerSetOpenStatus,
        account: AccountAddress.fromBase58('2zdNDFqqn6pGPzEVRLTLNfBX6FTyQECjAgdLWqYEvBsv7uRjSS'),
        bakerId: 2561n,
        openStatus: OpenStatusText.OpenForAll,
    },
    {
        tag: TransactionEventTag.BakerSetMetadataURL,
        account: AccountAddress.fromBase58('2zdNDFqqn6pGPzEVRLTLNfBX6FTyQECjAgdLWqYEvBsv7uRjSS'),
        bakerId: 2561n,
        metadataURL: '',
    },
    {
        tag: TransactionEventTag.BakerSetTransactionFeeCommission,
        account: AccountAddress.fromBase58('2zdNDFqqn6pGPzEVRLTLNfBX6FTyQECjAgdLWqYEvBsv7uRjSS'),
        bakerId: 2561n,
        transactionFeeCommission: 0.1,
    },
    {
        tag: TransactionEventTag.BakerSetBakingRewardCommission,
        account: AccountAddress.fromBase58('2zdNDFqqn6pGPzEVRLTLNfBX6FTyQECjAgdLWqYEvBsv7uRjSS'),
        bakerId: 2561n,
        bakingRewardCommission: 0.1,
    },
    {
        tag: TransactionEventTag.BakerSetFinalizationRewardCommission,
        account: AccountAddress.fromBase58('2zdNDFqqn6pGPzEVRLTLNfBX6FTyQECjAgdLWqYEvBsv7uRjSS'),
        bakerId: 2561n,
        finalizationRewardCommission: 1,
    },
];

export const bakerRemoved: BakerEvent = {
    tag: TransactionEventTag.BakerRemoved,
    bakerId: 1879n,
    account: AccountAddress.fromBase58('4aCoaW3qkQRnY3fUGThQcEMGSPLUEQ7XL9Yagx2UR91QpvtoAe'),
};

export const configureDelegation: DelegationEvent[] = [
    {
        account: AccountAddress.fromBase58('3BpVX13dw29JruyMzCfde96hoB7DtQ53WMGVDMrmPtuYAbzADj'),
        delegatorId: 2059n,
        tag: TransactionEventTag.DelegationAdded,
    },
    {
        account: AccountAddress.fromBase58('3BpVX13dw29JruyMzCfde96hoB7DtQ53WMGVDMrmPtuYAbzADj'),
        delegationTarget: {
            delegateType: DelegationTargetType.PassiveDelegation,
        },
        delegatorId: 2059n,
        tag: TransactionEventTag.DelegationSetDelegationTarget,
    },
    {
        account: AccountAddress.fromBase58('3BpVX13dw29JruyMzCfde96hoB7DtQ53WMGVDMrmPtuYAbzADj'),
        delegatorId: 2059n,
        restakeEarnings: true,
        tag: TransactionEventTag.DelegationSetRestakeEarnings,
    },
    {
        account: AccountAddress.fromBase58('3BpVX13dw29JruyMzCfde96hoB7DtQ53WMGVDMrmPtuYAbzADj'),
        delegatorId: 2059n,
        newStake: CcdAmount.fromMicroCcd(1000000n),
        tag: TransactionEventTag.DelegationStakeIncreased,
    },
];

export const updateEvent: ContractTraceEvent[] = [
    {
        address: ContractAddress.create(866),
        events: [],
        tag: TransactionEventTag.Interrupted,
    },
    {
        address: ContractAddress.create(865),
        events: [],
        tag: TransactionEventTag.Interrupted,
    },
    {
        address: ContractAddress.create(864),
        amount: CcdAmount.zero(),
        contractVersion: 1,
        events: [],
        instigator: {
            address: ContractAddress.create(865),
            type: 'AddressContract',
        },
        message: Parameter.fromHexString('0000'),
        receiveName: ReceiveName.fromStringUnchecked('CIS2-wCCD-State.getPaused'),
        tag: TransactionEventTag.Updated,
    },
    {
        address: ContractAddress.create(865),
        success: true,
        tag: TransactionEventTag.Resumed,
    },
    {
        address: ContractAddress.create(865),
        events: [],
        tag: TransactionEventTag.Interrupted,
    },
    {
        address: ContractAddress.create(864),
        amount: CcdAmount.zero(),
        contractVersion: 1,
        events: [],
        instigator: {
            address: ContractAddress.create(865),
            type: 'AddressContract',
        },
        message: Parameter.fromHexString('00e9f89f76878691716298685f21637d86fd8c98de7baa1d67e0ce11241be00083'),
        receiveName: ReceiveName.fromStringUnchecked('CIS2-wCCD-State.getBalance'),
        tag: TransactionEventTag.Updated,
    },
    {
        address: ContractAddress.create(865),
        success: true,
        tag: TransactionEventTag.Resumed,
    },
    {
        address: ContractAddress.create(865),
        events: [],
        tag: TransactionEventTag.Interrupted,
    },
    {
        address: ContractAddress.create(864),
        amount: CcdAmount.zero(),
        contractVersion: 1,
        events: [],
        instigator: {
            address: ContractAddress.create(865),
            type: 'AddressContract',
        },
        message: Parameter.fromHexString('00e9f89f76878691716298685f21637d86fd8c98de7baa1d67e0ce11241be00083c0843d00'),
        receiveName: ReceiveName.fromStringUnchecked('CIS2-wCCD-State.setBalance'),
        tag: TransactionEventTag.Updated,
    },
    {
        address: ContractAddress.create(865),
        success: true,
        tag: TransactionEventTag.Resumed,
    },
    {
        address: ContractAddress.create(865),
        events: [],
        tag: TransactionEventTag.Interrupted,
    },
    {
        address: ContractAddress.create(866),
        events: [],
        tag: TransactionEventTag.Interrupted,
    },
    {
        amount: CcdAmount.fromMicroCcd(1000000n),
        from: ContractAddress.create(866),
        tag: TransactionEventTag.Transferred,
        to: AccountAddress.fromBase58('4inf4g36xDEQmjxDbbkqeHD2HNg9v7dohXUDH5S9en4Th53kxm'),
    },
    {
        address: ContractAddress.create(866),
        success: true,
        tag: TransactionEventTag.Resumed,
    },
    {
        address: ContractAddress.create(866),
        amount: CcdAmount.zero(),
        contractVersion: 1,
        events: [],
        instigator: {
            address: ContractAddress.create(865),
            type: 'AddressContract',
        },
        message: Parameter.fromHexString(
            'c0843d00e9f89f76878691716298685f21637d86fd8c98de7baa1d67e0ce11241be000830000'
        ),
        receiveName: ReceiveName.fromStringUnchecked('CIS2-wCCD-Proxy.transferCCD'),
        tag: TransactionEventTag.Updated,
    },
    {
        address: ContractAddress.create(865),
        success: true,
        tag: TransactionEventTag.Resumed,
    },
    {
        address: ContractAddress.create(865),
        events: [],
        tag: TransactionEventTag.Interrupted,
    },
    {
        address: ContractAddress.create(866),
        amount: CcdAmount.zero(),
        contractVersion: 1,
        events: ['fd00c0843d00e9f89f76878691716298685f21637d86fd8c98de7baa1d67e0ce11241be00083'].map(
            ContractEvent.fromHexString
        ),
        instigator: {
            address: ContractAddress.create(865),
            type: 'AddressContract',
        },
        message: Parameter.fromHexString(
            'fd00c0843d00e9f89f76878691716298685f21637d86fd8c98de7baa1d67e0ce11241be00083'
        ),
        receiveName: ReceiveName.fromStringUnchecked('CIS2-wCCD-Proxy.logEvent'),
        tag: TransactionEventTag.Updated,
    },
    {
        address: ContractAddress.create(865),
        success: true,
        tag: TransactionEventTag.Resumed,
    },
    {
        address: ContractAddress.create(865),
        amount: CcdAmount.zero(),
        contractVersion: 1,
        events: [],
        instigator: {
            address: ContractAddress.create(866),
            type: 'AddressContract',
        },
        message: Parameter.fromHexString(
            'c0843d00e9f89f76878691716298685f21637d86fd8c98de7baa1d67e0ce11241be0008300e9f89f76878691716298685f21637d86fd8c98de7baa1d67e0ce11241be00083000000e9f89f76878691716298685f21637d86fd8c98de7baa1d67e0ce11241be00083'
        ),
        receiveName: ReceiveName.fromStringUnchecked('CIS2-wCCD.unwrap'),
        tag: TransactionEventTag.Updated,
    },
    {
        address: ContractAddress.create(866),
        success: true,
        tag: TransactionEventTag.Resumed,
    },
    {
        address: ContractAddress.create(866),
        amount: CcdAmount.zero(),
        contractVersion: 1,
        events: [],
        instigator: {
            address: AccountAddress.fromBase58('4inf4g36xDEQmjxDbbkqeHD2HNg9v7dohXUDH5S9en4Th53kxm'),
            type: 'AddressAccount',
        },
        message: Parameter.fromHexString(
            'c0843d00e9f89f76878691716298685f21637d86fd8c98de7baa1d67e0ce11241be0008300e9f89f76878691716298685f21637d86fd8c98de7baa1d67e0ce11241be000830000'
        ),
        receiveName: ReceiveName.fromStringUnchecked('CIS2-wCCD-Proxy.unwrap'),
        tag: TransactionEventTag.Updated,
    },
];

export const encryptedSelfAmountAddedEvent: EncryptedSelfAmountAddedEvent = {
    account: AccountAddress.fromBase58('3BpVX13dw29JruyMzCfde96hoB7DtQ53WMGVDMrmPtuYAbzADj'),
    amount: CcdAmount.fromMicroCcd(10000000n),
    newAmount:
        'c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000098c71824023d5fb1bca5accb3ac010551e4af7e9988cd0ef309ee37149ef7843af6f294e79b8fcbda9b4f4ed094d66cbc00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    tag: TransactionEventTag.EncryptedSelfAmountAdded,
};

export const updateEnqueuedEvent: UpdateSummary = {
    type: TransactionSummaryType.UpdateTransaction,
    index: 0n,
    energyCost: Energy.create(0),
    hash: TransactionHash.fromHexString('f296a32603fc14aa679001c49a4db1b2133787ae37743536938ec51382fb8392'),
    effectiveTime: 1669115100n,
    payload: {
        updateType: UpdateType.Protocol,
        update: {
            message: 'Enable protocol version 5',
            specificationHash: 'af5684e70c1438e442066d017e4410af6da2b53bfa651a07d81efa2aa668db20',
            specificationUrl: 'https://github.com/Concordium/concordium-update-proposals/blob/main/updates/P5.txt',
            specificationAuxiliaryData: '',
        },
    },
};
export const transferWithScheduleEvent: TransferredWithScheduleEvent = {
    tag: TransactionEventTag.TransferredWithSchedule,
    to: AccountAddress.fromBase58('3ySdbNTPogmvUBD5g42FaZqYht78jQZ2jose9yZFkCj8zyCGWt'),
    amount: [
        {
            timestamp: new Date('2023-01-10T12:00:00.919Z'),
            amount: CcdAmount.fromMicroCcd(500000n),
        },
        {
            timestamp: new Date('2023-02-10T12:00:00.919Z'),
            amount: CcdAmount.fromMicroCcd(500000n),
        },
    ],
};

export const contractInitializedEvent: ContractInitializedEvent = {
    tag: TransactionEventTag.ContractInitialized,
    address: ContractAddress.create(3132),
    amount: CcdAmount.zero(),
    contractVersion: 1,
    events: [],
    initName: InitName.fromStringUnchecked('init_CIS2-Fractionalizer'),
    ref: 'e80161061e5074e850dd1fabbabbf80008fc5d3ffae554744aedc4704ee7b412',
};

export const moduleDeployedEvent: ModuleDeployedEvent = {
    tag: TransactionEventTag.ModuleDeployed,
    contents: '3c532ed32dcb3b9f49afb442457a63465987994e400fd5023c8471c26a858ab4',
};

export const delegationRemovedEvent: DelegationEvent = {
    tag: TransactionEventTag.DelegationRemoved,
    account: AccountAddress.fromBase58('4nvFUvdF3Ki7M6Xc2vHejX7iQW5Gtu7UBu6RaPRZV7LorLToPG'),
    delegatorId: 4002n,
};

export const transferWithMemoSummary: BaseAccountTransactionSummary & TransferWithMemoSummary = {
    index: 0n,
    energyCost: Energy.create(508),
    hash: TransactionHash.fromHexString('8bfd6c5d3006ea005531d90e88af1075c1a5d0bce1f2befa7abb3ec8b3fb60b5'),
    type: TransactionSummaryType.AccountTransaction,
    cost: 879395n,
    sender: AccountAddress.fromBase58('4nJU5pCM49KmrYQ1tsUTEBNBJVxs3X2qo8nKj8CQYsgBmUACHG'),
    transactionType: TransactionKindString.TransferWithMemo,
    transfer: {
        tag: TransactionEventTag.Transferred,
        amount: CcdAmount.fromMicroCcd(250000000n),
        to: AccountAddress.fromBase58('4fxkFceRT3XyUpb4yW3C2c9RnEBhunyNrKprYarr7htKmMvztG'),
    },
    memo: { tag: TransactionEventTag.TransferMemo, memo: '6474657374' },
};

export const upgradedEvent: ContractTraceEvent = {
    address: ContractAddress.create(3143),
    from: '7371d1039a0e4587a54b8959eaabf11da83fad24650ee6af380357849648f477',
    tag: TransactionEventTag.Upgraded,
    to: '7371d1039a0e4587a54b8959eaabf11da83fad24650ee6af380357849648f477',
};

export const dataRegisteredEvent: DataRegisteredEvent = {
    data: '6b68656c6c6f20776f726c64',
    tag: TransactionEventTag.DataRegistered,
};

export const newEncryptedAmountEvent: NewEncryptedAmountEvent = {
    account: AccountAddress.fromBase58('2za2yAXbFiaB151oYqTteZfqiBzibHXizwjNbpdU8hodq9SfEk'),
    encryptedAmount:
        '8695a917b4404bfa7cb787297662f610f08758f73bc73028a0ec004626b28e28bb82a69e86b9b985e36c588ff2b36089ab40ecae0a199c53f088e6c75012c1c116600dbd22dc33285a22ad63b0a99e5b8b6bad012d1d88568eaddcbac8bf03938762267b06a3353659e436cad83ac2f2b6961ccbf4a77cffaa20757f69f2ef3a2d2c7e9a4bf7c7373e50fbd5da02c46c9565146ac5b56c1a9eb7ae0b9614ed9475e26d4cfc2cb03014f70a4ba82f1aae131b735eec2dcc5ddafe5fac1ab0dbf4',
    newIndex: 1,
    tag: TransactionEventTag.NewEncryptedAmount,
};

export const bakerKeysUpdatedEvent: BakerEvent = {
    account: AccountAddress.fromBase58('4Kmo9keJQaiyAuRM2pRh2xK4e75ph7hp4CzxdFAcRDeQRHfaHT'),
    aggregationKey:
        '8cf3c6fe9bebc45e9c9bb34442c5baf7bb612adc193525173d6fe36355be29ad69affeb3937f2b819976ecefeb14c3ae04d9c44d0117eda8c7968602f08f266960226c5fe2014c1bda1794b7fdbd5b5f9d31deb2c053d5f9f3734452e1dcb4b8',
    bakerId: 15n,
    electionKey: 'b40185d794485eeb099bdfb7df58fc64fd303847f2a947884648e535b023fe23',
    signKey: '5cbc1c8ab56047360ff37229760302e03844d48299f4fb1f1247832778f980c0',
    tag: TransactionEventTag.BakerKeysUpdated,
};

export const bakerStakeIncreasedEvent: BakerEvent = {
    account: AccountAddress.fromBase58('4JzAXhzJKwG3DGoAbgGhZNnRQqeFdp9zbxv6WUjDbVbyKEie8e'),
    bakerId: 525n,
    newStake: CcdAmount.fromMicroCcd(14001000000n),
    tag: TransactionEventTag.BakerStakeIncreased,
};

export const credentialKeysUpdatedEvent: CredentialKeysUpdatedEvent = {
    credId: 'a643d6082a8f80460fff27f3ff27fedbfdc60039527402b8188fc845a849428b5484c82a1589cab7604c1a2be978c39c',
    tag: TransactionEventTag.CredentialKeysUpdated,
};

export const credentialsUpdatedEvent: CredentialsUpdatedEvent = {
    account: AccountAddress.fromBase58('3irV7FF3BZbz9ejGTm7EHLUi6CQHdJUELDfyhwkHcLqXmQyUfR'),
    newCredIds: [],
    newThreshold: 1,
    removedCredIds: [],
    tag: TransactionEventTag.CredentialsUpdated,
};

export const bakerStakeDecreasedEvent: BakerEvent = {
    tag: TransactionEventTag.BakerStakeDecreased,
    account: AccountAddress.fromBase58('4Kmo9keJQaiyAuRM2pRh2xK4e75ph7hp4CzxdFAcRDeQRHfaHT'),
    bakerId: 15n,
    newStake: CcdAmount.fromMicroCcd(950000000000n),
};

export const delegationStakeDecreasedEvent: DelegationEvent = {
    tag: TransactionEventTag.DelegationStakeDecreased,
    account: AccountAddress.fromBase58('4mAs6xcFw26fb6u8odkJWoe3fAK8bCJ91BwScUc36DFhh3thwD'),
    delegatorId: 57n,
    newStake: CcdAmount.fromMicroCcd(10000000n),
};

export const mintSpecialEvent: BlockSpecialEvent = {
    tag: 'mint',
    mintBakingReward: CcdAmount.fromMicroCcd(12708081798618n),
    mintFinalizationReward: CcdAmount.fromMicroCcd(6354040899309n),
    mintPlatformDevelopmentCharge: CcdAmount.fromMicroCcd(2118013633103n),
    foundationAccount: AccountAddress.fromBase58('3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G'),
};

export const paydayFoundationRewardSpecialEvent: BlockSpecialEventPaydayFoundationReward = {
    tag: 'paydayFoundationReward',
    foundationAccount: AccountAddress.fromBase58('3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G'),
    developmentCharge: CcdAmount.fromMicroCcd(103517862n),
};

export const paydayPoolRewardSpecialEvent: BlockSpecialEventPaydayPoolReward = {
    tag: 'paydayPoolReward',
    transactionFees: CcdAmount.zero(),
    bakerReward: CcdAmount.zero(),
    finalizationReward: CcdAmount.zero(),
};

export const paydayAccountRewardSpecialEvent: BlockSpecialEventPaydayAccountReward = {
    tag: 'paydayAccountReward',
    account: AccountAddress.fromBase58('48XGRnvQoG92T1AwETvW5pnJ1aRSPMKsWtGdKhTqyiNZzMk3Qn'),
    transactionFees: CcdAmount.fromMicroCcd(128913265n),
    bakerReward: CcdAmount.fromMicroCcd(1139222197711n),
    finalizationReward: CcdAmount.fromMicroCcd(577640081755n),
};

export const blockAccrueRewardSpecialEvent: BlockSpecialEventBlockAccrueReward = {
    tag: 'blockAccrueReward',
    transactionFees: CcdAmount.zero(),
    oldGasAccount: CcdAmount.fromMicroCcd(3n),
    newGasAccount: CcdAmount.fromMicroCcd(3n),
    bakerReward: CcdAmount.zero(),
    passiveReward: CcdAmount.zero(),
    foundationCharge: CcdAmount.zero(),
    baker: 6n,
};

export const bakingRewardsSpecialEvent: BlockSpecialEventBakingRewards = {
    tag: 'bakingRewards',
    bakingRewards: [
        {
            account: AccountAddress.fromBase58('3QK1rxUXV7GRk4Ng7Bs7qnbkdjyBdjzCytpTrSQN7BaJkiEfgZ'),
            amount: CcdAmount.fromMicroCcd(56740641000n),
        },
        {
            account: AccountAddress.fromBase58('3U4sfVSqGG6XK8g6eho2qRYtnHc4MWJBG1dfxdtPGbfHwFxini'),
            amount: CcdAmount.fromMicroCcd(32625868575n),
        },
        {
            account: AccountAddress.fromBase58('3gGBYDSpx2zWL3YMcqD48U5jVXYG4pJBDZqeY5CbMMKpxVBbc3'),
            amount: CcdAmount.fromMicroCcd(39718448700n),
        },
        {
            account: AccountAddress.fromBase58('3ntvNGT6tDuLYiSb5gMJSQAZfLPUJnzoizcFiVRWqLoctuXxpK'),
            amount: CcdAmount.fromMicroCcd(41136964725n),
        },
        {
            account: AccountAddress.fromBase58('3y9DtDUL8xpf8i2yj9k44zMVkf4H1hkpBEQcXbJhrgcwYSGg41'),
            amount: CcdAmount.fromMicroCcd(35462900625n),
        },
        {
            account: AccountAddress.fromBase58('42tFTDWvTmBd7hEacohuCfGFa9TsBKhsmXKeViQ7q7NoY7UadV'),
            amount: CcdAmount.fromMicroCcd(49648060875n),
        },
        {
            account: AccountAddress.fromBase58('44Axe5eHnMkBinX7GKvUm5w6mX83JGdasijhvsMv5ZW2Wmgphg'),
            amount: CcdAmount.fromMicroCcd(51066576900n),
        },
        {
            account: AccountAddress.fromBase58('48XGRnvQoG92T1AwETvW5pnJ1aRSPMKsWtGdKhTqyiNZzMk3Qn'),
            amount: CcdAmount.fromMicroCcd(35462900625n),
        },
        {
            account: AccountAddress.fromBase58('4AnukgcopMC4crxfL1L9fUYw9MAkoo1yKLvH7eA1NAX7SxgyRY'),
            amount: CcdAmount.fromMicroCcd(56740641000n),
        },
        {
            account: AccountAddress.fromBase58('4BTFaHx8CioLi8Xe7YiimpAK1oQMkbx5Wj6B8N7d7NXgmLvEZs'),
            amount: CcdAmount.fromMicroCcd(66670253175n),
        },
        {
            account: AccountAddress.fromBase58('4EJJ1hVhbVZT2sR9xPzWUwFcJWK3fPX54z94zskTozFVk8Xd4L'),
            amount: CcdAmount.fromMicroCcd(60996189075n),
        },
    ],
    remainder: CcdAmount.fromMicroCcd(290n),
};

export const finalizationRewardsSpecialEvent: BlockSpecialEventFinalizationRewards = {
    tag: 'finalizationRewards',
    finalizationRewards: [
        {
            account: AccountAddress.fromBase58('3QK1rxUXV7GRk4Ng7Bs7qnbkdjyBdjzCytpTrSQN7BaJkiEfgZ'),
            amount: CcdAmount.fromMicroCcd(359306692n),
        },
        {
            account: AccountAddress.fromBase58('3U4sfVSqGG6XK8g6eho2qRYtnHc4MWJBG1dfxdtPGbfHwFxini'),
            amount: CcdAmount.fromMicroCcd(359306692n),
        },
        {
            account: AccountAddress.fromBase58('3gGBYDSpx2zWL3YMcqD48U5jVXYG4pJBDZqeY5CbMMKpxVBbc3'),
            amount: CcdAmount.fromMicroCcd(359306692n),
        },
        {
            account: AccountAddress.fromBase58('3ntvNGT6tDuLYiSb5gMJSQAZfLPUJnzoizcFiVRWqLoctuXxpK'),
            amount: CcdAmount.fromMicroCcd(359306692n),
        },
        {
            account: AccountAddress.fromBase58('3y9DtDUL8xpf8i2yj9k44zMVkf4H1hkpBEQcXbJhrgcwYSGg41'),
            amount: CcdAmount.fromMicroCcd(359306692n),
        },
        {
            account: AccountAddress.fromBase58('42tFTDWvTmBd7hEacohuCfGFa9TsBKhsmXKeViQ7q7NoY7UadV'),
            amount: CcdAmount.fromMicroCcd(359306692n),
        },
        {
            account: AccountAddress.fromBase58('44Axe5eHnMkBinX7GKvUm5w6mX83JGdasijhvsMv5ZW2Wmgphg'),
            amount: CcdAmount.fromMicroCcd(359306692n),
        },
        {
            account: AccountAddress.fromBase58('48XGRnvQoG92T1AwETvW5pnJ1aRSPMKsWtGdKhTqyiNZzMk3Qn'),
            amount: CcdAmount.fromMicroCcd(359306692n),
        },
        {
            account: AccountAddress.fromBase58('4AnukgcopMC4crxfL1L9fUYw9MAkoo1yKLvH7eA1NAX7SxgyRY'),
            amount: CcdAmount.fromMicroCcd(359306692n),
        },
        {
            account: AccountAddress.fromBase58('4BTFaHx8CioLi8Xe7YiimpAK1oQMkbx5Wj6B8N7d7NXgmLvEZs'),
            amount: CcdAmount.fromMicroCcd(359306692n),
        },
        {
            account: AccountAddress.fromBase58('4EJJ1hVhbVZT2sR9xPzWUwFcJWK3fPX54z94zskTozFVk8Xd4L'),
            amount: CcdAmount.fromMicroCcd(359306692n),
        },
    ],
    remainder: CcdAmount.fromMicroCcd(4n),
};

export const blockRewardSpecialEvent: BlockSpecialEventBlockReward = {
    tag: 'blockReward',
    transactionFees: CcdAmount.zero(),
    oldGasAccount: CcdAmount.zero(),
    newGasAccount: CcdAmount.zero(),
    bakerReward: CcdAmount.zero(),
    foundationCharge: CcdAmount.zero(),
    baker: AccountAddress.fromBase58('44Axe5eHnMkBinX7GKvUm5w6mX83JGdasijhvsMv5ZW2Wmgphg'),
    foundationAccount: AccountAddress.fromBase58('44Axe5eHnMkBinX7GKvUm5w6mX83JGdasijhvsMv5ZW2Wmgphg'),
};

export const insufficientBalanceForDelegationStakeRejectReason = {
    tag: 'InsufficientBalanceForDelegationStake',
};

export const delegationTargetNotABakerRejectReason = {
    contents: 123n,
    tag: 'DelegationTargetNotABaker',
};

export const alreadyABakerRejectReason = {
    contents: 742n,
    tag: 'AlreadyABaker',
};

export const amountTooLargeRejectReason: AmountTooLarge = {
    tag: RejectReasonTag.AmountTooLarge,
    contents: {
        address: {
            type: 'AddressAccount',
            address: AccountAddress.fromBase58('4Qod7UHWmkyz2ahPrWFH1kCqv1cvhT7NtEFbXG7G2soxXSYuMH'),
        },
        amount: CcdAmount.fromMicroCcd(2000000000n),
    },
};

export const scheduledSelfTransferRejectReason = {
    contents: '48x2Uo8xCMMxwGuSQnwbqjzKtVqK5MaUud4vG7QEUgDmYkV85e',
    tag: 'ScheduledSelfTransfer',
};

export const encryptedAmountSelfTransferRejectReason = {
    contents: '48x2Uo8xCMMxwGuSQnwbqjzKtVqK5MaUud4vG7QEUgDmYkV85e',
    tag: 'EncryptedAmountSelfTransfer',
};

export const bakerInCooldownRejectReason = { tag: 'BakerInCooldown' };

export const moduleHashAlreadyExistsRejectReason = {
    contents: '283fd346d23c6982ad6cf4d90508c304f88a8054ec6e345d60c2e8f1338e8424',
    tag: 'ModuleHashAlreadyExists',
};

export const stakeOverMaximumThresholdForPoolRejectReason = {
    tag: 'StakeOverMaximumThresholdForPool',
};

export const invalidEncryptedAmountTransferProofRejectReason = {
    tag: 'InvalidEncryptedAmountTransferProof',
};

export const insufficientBalanceForBakerStakeRejectReason = {
    tag: 'InsufficientBalanceForBakerStake',
};

export const outOfEnergyRejectReason = { tag: 'OutOfEnergy' };

export const invalidInitMethodRejectReason: RejectReason = {
    contents: {
        moduleRef: ModuleReference.fromHexString('c2ddbce88a7acae8bd610abf46afbdcf6264c8777163b345468b8e6f2ff8660f'),
        initName: InitName.fromStringUnchecked('init_cis2_nft'),
    },
    tag: RejectReasonTag.InvalidInitMethod,
};

export const runtimeFailureRejectReason = { tag: 'RuntimeFailure' };

export const rejectedReceiveRejectReason: RejectedReceive = {
    contractAddress: ContractAddress.create(2372),
    parameter: Parameter.empty(),
    receiveName: ReceiveName.fromStringUnchecked('auction.finalize'),
    rejectReason: -1,
    tag: RejectReasonTag.RejectedReceive,
};

export const poolClosedRejectReason = { tag: 'PoolClosed' };

export const invalidReceiveMethodRejectReason: RejectReason = {
    contents: {
        moduleRef: ModuleReference.fromHexString('4065819567755d7d2269acce2a8b0b510cdf30e36f5fb3303be16f8724e9b8b7'),
        receiveName: ReceiveName.fromStringUnchecked('CIS2-TOKEN.mint'),
    },
    tag: RejectReasonTag.InvalidReceiveMethod,
};

export const transactionFeeCommissionNotInRangeRejectReason = {
    tag: 'TransactionFeeCommissionNotInRange',
};

export const invalidModuleReferenceRejectReason = {
    contents: '32aa289796759a6612858d543931923c404f9d33d6f49473ad135590fd7acbb3',
    tag: 'InvalidModuleReference',
};

export const moduleNotWFRejectReason = { tag: 'ModuleNotWF' };

export const nonExistentCredentialIDRejectReason = {
    tag: 'NonExistentCredentialID',
};

export const serializationFailureRejectReason = { tag: 'SerializationFailure' };

export const stakeUnderMinimumThresholdForBakingRejectReason = {
    tag: 'StakeUnderMinimumThresholdForBaking',
};

export const rejectedInitRejectReason = {
    rejectReason: -16,
    tag: 'RejectedInit',
};

export const finalizationRewardCommissionNotInRangeRejectReason = {
    tag: 'FinalizationRewardCommissionNotInRange',
};

export const invalidAccountReferenceRejectReason = {
    contents: '4ATy8qJ5rEAVE8h2sufiW8W6MW9wRHSduczo2Zs7XT9DUQMaVT',
    tag: 'InvalidAccountReference',
};

export const firstScheduledReleaseExpiredRejectReason = {
    tag: 'FirstScheduledReleaseExpired',
};

export const invalidContractAddressRejectReason: InvalidContractAddress = {
    contents: ContractAddress.create(2339),
    tag: RejectReasonTag.InvalidContractAddress,
};

export const missingBakerAddParametersRejectReason = {
    tag: 'MissingBakerAddParameters',
};

export const invalidTransferToPublicProofRejectReason = {
    tag: 'InvalidTransferToPublicProof',
};

export const poolWouldBecomeOverDelegatedRejectReason = {
    tag: 'PoolWouldBecomeOverDelegated',
};
export const bakerAccountInfo: AccountInfoBaker = {
    type: AccountInfoType.Baker,
    accountNonce: SequenceNumber.create(1),
    accountAmount: CcdAmount.fromMicroCcd(7449646704751788n),
    accountReleaseSchedule: { total: CcdAmount.zero(), schedule: [] },
    accountCredentials: {
        '0': {
            v: 0,
            value: {
                contents: {
                    arData: {
                        '1': {
                            encIdCredPubShare:
                                'b0e74e3509bcbceeb27853f6d65ffeb6de9d8ea2c79b6f80e6b24ed519946749feb169319d466893de43272e4e53465f90524b5e6507ced97f2ae4c536c77dcff02383e9a935e6462842874c91bf734b207dcbeb64a6a5432f0e8c050cce8563',
                        },
                    },
                    commitments: {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        cmmAttributes: {},
                        cmmCredCounter:
                            '80e04147024fd25dcab36e535f990d7678fc22d95d3c8b1456e48b8b208289cc00aae180e718d3800d9efb196dccfa7a',
                        cmmIdCredSecSharingCoeff: [
                            '8fbe8f40b171bc4690c0ccac260265773fd1dffaa134a04743704a1d4ed8f1252ade3c6144535d3ecbff427c0cb7eb94',
                        ],
                        cmmMaxAccounts:
                            'a1ef21f3eee719eff465781c779f3371820873308782f1818b30e83fd5600df45a7340b18af61d8b5958ae002f26012a',
                        cmmPrf: 'af57f51b16e999814e11e5eef8f0abff86395fc7c51cdf9fc506e8ef23d20ce7b58d8d9a82151bda0bf9787e376c622f',
                    },
                    credId: 'a33426f86d431f2312b19213ced9df3cc97da9111a312aa1abdecef9327388d4936bc61ef6b1f7f0064b6dfc0630bbed',
                    credentialPublicKeys: {
                        keys: {
                            '0': {
                                schemeId: 'Ed25519',
                                verifyKey: 'b8b4c92d59570a6c9376b72779768cd5cd6f0ee31cf118c2825b10f91987917d',
                            },
                            '1': {
                                schemeId: 'Ed25519',
                                verifyKey: 'e75b3149b6649cecf805f8231d5f596e8f2148bfeaff7fca063cffc2423e8f72',
                            },
                            '2': {
                                schemeId: 'Ed25519',
                                verifyKey: '936dff63b4d178ba28fbfef5e15d5edabad28eb6a2282b6fc56e64480f3e390c',
                            },
                        },
                        threshold: 2,
                    },
                    ipIdentity: 0,
                    policy: {
                        createdAt: '202206',
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        revealedAttributes: {},
                        validTo: '202306',
                    },
                    revocationThreshold: 1,
                },
                type: 'normal',
            },
        },
    },
    accountThreshold: 1,
    accountEncryptedAmount: {
        incomingAmounts: [],
        selfAmount:
            'c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        startIndex: 0n,
    },
    accountEncryptionKey:
        'b14cbfe44a02c6b1f78711176d5f437295367aa4f2a8c2551ee10d25a03adc69d61a332a058971919dad7312e1fc94c5a33426f86d431f2312b19213ced9df3cc97da9111a312aa1abdecef9327388d4936bc61ef6b1f7f0064b6dfc0630bbed',
    accountIndex: 5n,
    accountAddress: AccountAddress.fromBase58('4EJJ1hVhbVZT2sR9xPzWUwFcJWK3fPX54z94zskTozFVk8Xd4L'),
    accountBaker: {
        version: 1,
        bakerAggregationVerifyKey:
            'b18a02de74826e55f6eadc0f31d0d9a6edfb2993d030e65136f1e1256a69ba523acb40fa4d304d0668aa307c19257a0a10726e70149c904e1ef29aedb2679c825997e3f14edd303bf276f2c0b0c5a4c4870fff0c043150be06b715466be564c4',
        bakerElectionVerifyKey: 'a090681ec7b35ef3a771ed43ebb6728fd95e4b267abedfa95f1dc17720193dcb',
        bakerId: 5n,
        bakerPoolInfo: {
            commissionRates: {
                bakingCommission: 0.1,
                finalizationCommission: 1,
                transactionCommission: 0.1,
            },
            metadataUrl: '',
            openStatus: OpenStatusText.ClosedForAll,
        },
        bakerSignatureVerifyKey: 'c385ccb5c8a0710a162f2c107123744650ff35f00040bfa262d974bfb3c3f8f1',
        restakeEarnings: true,
        stakedAmount: CcdAmount.fromMicroCcd(7349646704751788n),
        isSuspended: false,
    },
    accountCooldowns: [],
    accountAvailableBalance: CcdAmount.fromMicroCcd(100000000000000n),
};

export const delegatorAccountInfo: AccountInfoDelegator = {
    type: AccountInfoType.Delegator,
    accountNonce: SequenceNumber.create(11),
    accountAmount: CcdAmount.fromMicroCcd(620948501142n),
    accountReleaseSchedule: { total: CcdAmount.zero(), schedule: [] },
    accountCredentials: {
        '0': {
            v: 0,
            value: {
                contents: {
                    arData: {
                        '1': {
                            encIdCredPubShare:
                                'a4fe79653506f7e57b1da167940e514c65498ef0cc9c2c3a5b4bc610a8ad83483257aa8633b5217fdcafb4afac009eb2a67d26a67df3ed9e9dfcc6d6056b1f2ab3815ca348f9f1f6260dd97f2efa85e5a4657dc829b095fdff4faff31cdc5fad',
                        },
                        '2': {
                            encIdCredPubShare:
                                'aabc3f8cc3579ef17363282436f44e11a86644e18cb186bb82c21fb0d02dc969d8a4ff31522d67bbb9d38200e9fb491ab7fbe8f489508ad265f03af04813d65f7c99b4cc63546e7ea04eeacbe757429b7ce0adbe83b7d738f8168dc9ed5b231f',
                        },
                        '3': {
                            encIdCredPubShare:
                                '83b0f99fd17d81c0ad31b8bc938b45efb56abb7d0acf93aca7dadda40b83cd975f025e683ec5ad8f8a87e35da87dc251a1f8ef7fbf71a41b5c13d3df8a882d02397595f2963e01f179208850c663ee7afaad4849c77ce1ed36b6ea0b5c31d21d',
                        },
                    },
                    commitments: {
                        cmmAttributes: {
                            countryOfResidence:
                                'a67a033cd6f733c865a48f3af6614023ef088f45336fc48aa7dac2308184d4db6a36901308bd19fe734e00734431b9e9',
                            dob: '87bb3611ef2957fbee68bc0ffdfb848f3a8605c4575cce7c0f088e6f860bbfb8856cfb9b61e76d1c452be744fd3d43d2',
                            firstName:
                                'b5b0738ea7723ec58fa660f48c2b0a9434243e792671baf738371da5ff198c0b0a8d163b2b9320a8794476a788ff43c0',
                            idDocExpiresAt:
                                'a806aee9d9363f33311f028b6ea54ae12952bb5db0c960f45790273e00e51e16db7e5b7c222de10c09481bbc70c3110e',
                            idDocIssuedAt:
                                '8e0d2d9b6fe376c91db56b5c527f6e3a0819fae45c3eb4e0689a354027680da959eef743367f56f179356f63834ea4fe',
                            idDocIssuer:
                                '989381f31507df15dbc6ee216e472249c5145f78de235d82a44608b3e17f17a2c89ffe946ce5826018eec058b8328466',
                            idDocNo:
                                'b72417df1454c11ee33a10dcf75827d2ae1ff0743f677565d9ffa28f585a5740eae8b9035cbaeed48e64349be76b79d5',
                            idDocType:
                                '8f25812690d899c9cba173997050dbd0cf1b945b74a1e867762ecf39157b60d5b4deb2364cee0c4acc3d0b3bec9b5516',
                            lastName:
                                '9884a707ba237490e69d036f5e25ec25ec16e66aa1c81f0d34eb13f63460618c04e767780363509add1572b73a4c30db',
                            nationalIdNo:
                                'a798741053123d8c284b8ab4a9db25b3a510a03f98105005e70490360f66e5ad998051eee182e4a2cc159fdd1e793311',
                            nationality:
                                '827d7a6553567da9492c35aa1a0be1463aa3c63b27a37d2512776726ec7af15cb2ecbd6efb4845e6169d2ad964e31521',
                            sex: 'a325c5922568c54eaed8984ac0a24617dbcf6606acc85b66221e1e6390625e7d0d5a9007736fee77f1ad8d1eb46ec754',
                            taxIdNo:
                                '98c3ec5be784b80fbd1f92eb736ff8f13957d94b8b6a8a00c4abcba7d0707d70832021d5253a46aa8125fa902c83ee7f',
                        },
                        cmmCredCounter:
                            'a6447ad504e9f480b0df9dd8f7097152fc8c31d131d777157da4b17467ea8c4f8e58ed6e4f510cc9b76d81a215ff9795',
                        cmmIdCredSecSharingCoeff: [
                            '966fbe0c8e83c23a9819eae914a19237cd33a6750390f1075e29f7cc5f676616391a409a064ff553710f00be7dbb7ba8',
                            'aad9744e39d20e8b7bf9d85cc008d193b0433c5cdb4a6a11af49dd268c6a0eb35674f10ce66e2b062c994cb0060ccedd',
                        ],
                        cmmMaxAccounts:
                            'ae1b56823ddf63bde790607c0d671361f3a52bd3fd0a4d6c21ce1c7e8349260e723439410cc8137d9ca2d327383bdea5',
                        cmmPrf: '8e8d3c50a497445d3d92f62fca9909940d91bb3bad4f68528e94e90a273a8af47ad8ea74bc32cb88ad9a984431fbc6fb',
                    },
                    credId: 'af9816eae1ab8c733e26e790a7d88c5688472dcd8b536668b0d2182e406321499695ae80c8363505a479ffd89daf5fbb',
                    credentialPublicKeys: {
                        keys: {
                            '0': {
                                schemeId: 'Ed25519',
                                verifyKey: '15d5f1668d46971d08d8ddfe42f900385c92211cc4f8f3f2dd9596cbc37851d9',
                            },
                        },
                        threshold: 1,
                    },
                    ipIdentity: 0,
                    policy: {
                        createdAt: '202206',
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        revealedAttributes: {},
                        validTo: '202306',
                    },
                    revocationThreshold: 2,
                },
                type: 'normal',
            },
        },
    },
    accountThreshold: 1,
    accountEncryptedAmount: {
        incomingAmounts: [],
        selfAmount:
            'c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        startIndex: 0n,
    },
    accountEncryptionKey:
        'b14cbfe44a02c6b1f78711176d5f437295367aa4f2a8c2551ee10d25a03adc69d61a332a058971919dad7312e1fc94c5af9816eae1ab8c733e26e790a7d88c5688472dcd8b536668b0d2182e406321499695ae80c8363505a479ffd89daf5fbb',
    accountIndex: 276n,
    accountAddress: AccountAddress.fromBase58('3bFo43GiPnkk5MmaSdsRVboaX2DNSKaRkLseQbyB3WPW1osPwh'),
    accountDelegation: {
        delegationTarget: {
            delegateType: DelegationTargetType.PassiveDelegation,
        },
        restakeEarnings: true,
        stakedAmount: CcdAmount.fromMicroCcd(620942412516n),
    },
    accountCooldowns: [],
    accountAvailableBalance: CcdAmount.fromMicroCcd(6088626n),
};

export const regularAccountInfo: AccountInfoSimple = {
    type: AccountInfoType.Simple,
    accountNonce: SequenceNumber.create(19),
    accountAmount: CcdAmount.fromMicroCcd(35495453082577742n),
    accountReleaseSchedule: { total: CcdAmount.zero(), schedule: [] },
    accountCredentials: {
        '0': {
            v: 0,
            value: {
                contents: {
                    arData: {
                        '1': {
                            encIdCredPubShare:
                                'a91e570e54b9ee7c304570bc3a066ea75dd833086c683a421c11e565482de01ffc2fb742408cf1dbd6c744cdde8835469120ce6a0e0c12fbfd53e9be81656900a95109f80418e7cbba510c457f15a0cb347bdc3f5508d46cec87a9214686a61d',
                        },
                    },
                    commitments: {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        cmmAttributes: {},
                        cmmCredCounter:
                            'b0aa65f420a9f3fab61d3f875eebcc221e43154bfaf1b6365dace99bff20778de7003437631222e845fd9917c8d2874b',
                        cmmIdCredSecSharingCoeff: [
                            '8bac440a2e46ccbfbfa768c6ad99f2abf25f8b327a795ecf23b2b804c327022f06d0aced0b5eed65899a3ef3029804ec',
                        ],
                        cmmMaxAccounts:
                            '869e2bddb2c60703ecd512b55b772baf75691f81bbc45362f88e5abcdab85a23714a92d46fe40457364d506abc2202a3',
                        cmmPrf: 'b8930e48976902f67f0cbb50b8c2911fcc0646fbccf4bfb6a442ef7d40a8351f48ae7206ee8083e28d357be808803f82',
                    },
                    credId: 'aa730045bcd20bb5c24349db29d949f767e72f7cce459dc163c4b93c780a7d7f65801dda8ff7e4fc06fdf1a1b246276f',
                    credentialPublicKeys: {
                        keys: {
                            '0': {
                                schemeId: 'Ed25519',
                                verifyKey: '9e975c838d037136cff54f7f5b741922dd9bc31e5dd3c9eb793a026b7d1f5125',
                            },
                            '1': {
                                schemeId: 'Ed25519',
                                verifyKey: '2d322b8744fa5d01823adce3f6a13bbebdd7b8503c08ccc3d8497e6c46021976',
                            },
                            '2': {
                                schemeId: 'Ed25519',
                                verifyKey: '9a77df3f869206a7c085bc1ab821f1e248762a22bb37471b3cefcb83740764c9',
                            },
                        },
                        threshold: 2,
                    },
                    ipIdentity: 0,
                    policy: {
                        createdAt: '202206',
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        revealedAttributes: {},
                        validTo: '202306',
                    },
                    revocationThreshold: 1,
                },
                type: 'normal',
            },
        },
    },
    accountThreshold: 1,
    accountEncryptedAmount: {
        incomingAmounts: [],
        selfAmount:
            'c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        startIndex: 0n,
    },
    accountEncryptionKey:
        'b14cbfe44a02c6b1f78711176d5f437295367aa4f2a8c2551ee10d25a03adc69d61a332a058971919dad7312e1fc94c5aa730045bcd20bb5c24349db29d949f767e72f7cce459dc163c4b93c780a7d7f65801dda8ff7e4fc06fdf1a1b246276f',
    accountIndex: 11n,
    accountAddress: AccountAddress.fromBase58('3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G'),
    accountCooldowns: [],
    accountAvailableBalance: CcdAmount.fromMicroCcd(35495453082577742n),
};

const rootKeys = {
    keys: [
        {
            schemeId: 'Ed25519',
            verifyKey: 'f4c9fb9da8d2b00cb6e1fd241b6271a0c4afcb3784e7e6c323bda7ed0b80a478',
        },
        {
            schemeId: 'Ed25519',
            verifyKey: 'fb33c5e41da199869d2c841a368afc81ea44c35d099c424a61d4ddc443d24e9e',
        },
        {
            schemeId: 'Ed25519',
            verifyKey: 'aaf42b7dac02066b6d0850ba9aa0ecd9d91b7c7a31e560e2e045dcf15c2c13b9',
        },
        {
            schemeId: 'Ed25519',
            verifyKey: '6bda0894ad593c6abce19d05427b60f6e8fdf63ca1b6c45d0887f141a52feba3',
        },
        {
            schemeId: 'Ed25519',
            verifyKey: '66e1fd747994bf551a67b5e0f63b0c781a56fce210b01e9b4fd1df02eb8663d7',
        },
        {
            schemeId: 'Ed25519',
            verifyKey: '85e281c689809a29dca12cc2d27314074dc49c3882a0e73fdb05709653b7f101',
        },
        {
            schemeId: 'Ed25519',
            verifyKey: 'dd123b22281402437f9aa3d550d106b45b9b963735f6d4591ed9d15eea003b0e',
        },
    ],
    threshold: 5,
};

const level1Keys = {
    keys: [
        {
            schemeId: 'Ed25519',
            verifyKey: '55721372d942742db382c3680737a424fe3234cf82a80d42da008d6b47179500',
        },
        {
            schemeId: 'Ed25519',
            verifyKey: '99b17b4de2e5793e63ec0c9672cca3b4c029d1d958acebd440d46c5851713faf',
        },
        {
            schemeId: 'Ed25519',
            verifyKey: '7cc3e70a4631942123ab7beb219ef442cfb2239b8181bef0454ede3249f8fe9f',
        },
        {
            schemeId: 'Ed25519',
            verifyKey: 'cd8d12dc61a56ab19d881296fdde24caff8a41521ff06ef0a374691e0130bbaa',
        },
        {
            schemeId: 'Ed25519',
            verifyKey: '25117967859fabb264ac525d0d4a5a19a119f4b6cf8f3be791544f75b71f2bf3',
        },
        {
            schemeId: 'Ed25519',
            verifyKey: '0d2190f445402eebb17460fd4d7992f9b016f1e88b165d6853971012dfc3286f',
        },
        {
            schemeId: 'Ed25519',
            verifyKey: '40392e3c2d155a0cac4dd82b9f775851c2e267b069ab586780121fe6e07b1053',
        },
        {
            schemeId: 'Ed25519',
            verifyKey: 'a0a02204ca7cc252c76df1592439c2c144e68ffe8dacfd56826d115d61772a0a',
        },
        {
            schemeId: 'Ed25519',
            verifyKey: '54854dc24f53c0f71f6cfd2c94cf1b92b7018f67b450e334d0d526d74f6b16ec',
        },
        {
            schemeId: 'Ed25519',
            verifyKey: 'd5a10ff8a0d4cd7077064c0475fab3740f41dc9a1b33c6d025b83f99bd2242be',
        },
        {
            schemeId: 'Ed25519',
            verifyKey: '512f0c4a7db3b920b1de13a8083b85ac757f927cf3920027cc874e7a49735296',
        },
        {
            schemeId: 'Ed25519',
            verifyKey: '8b6834f6db50423eb0566621a49ab5cc0b3aec363acb403bd6c2970ece77e532',
        },
        {
            schemeId: 'Ed25519',
            verifyKey: '9528818668372088533186a6113463e3d7c38c101edf5eb9f59e1fa6f9a9b917',
        },
        {
            schemeId: 'Ed25519',
            verifyKey: '5d2d7afd2549e7072216bc21b3ac3ce02eebd5ea5073f147568fa30072f0b59c',
        },
        {
            schemeId: 'Ed25519',
            verifyKey: '9d40193ed95936475bdbe6c2595ab0bc948ee40dad3fb10b0aa1a823f5fc9bcc',
        },
    ],
    threshold: 7,
};

export const chainParameters: ChainParametersV1 = {
    version: 1,
    electionDifficulty: 0.025,
    euroPerEnergy: { numerator: 1n, denominator: 50000n },
    microGTUPerEuro: {
        numerator: 697170112016908288n,
        denominator: 7989497115n,
    },
    accountCreationLimit: 10,
    foundationAccount: AccountAddress.fromBase58('3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G'),
    mintPerPayday: 0.000261157877,
    rewardPeriodLength: 24n,
    delegatorCooldown: 1209600n,
    poolOwnerCooldown: 1814400n,
    passiveFinalizationCommission: 1,
    passiveBakingCommission: 0.12,
    passiveTransactionCommission: 0.12,
    finalizationCommissionRange: { min: 1, max: 1 },
    bakingCommissionRange: { min: 0.1, max: 0.1 },
    transactionCommissionRange: { min: 0.1, max: 0.1 },
    minimumEquityCapital: CcdAmount.fromMicroCcd(14000000000n),
    capitalBound: 0.1,
    leverageBound: { numerator: 3n, denominator: 1n },
    rewardParameters: {
        version: 1,
        transactionFeeDistribution: { baker: 0.45, gasAccount: 0.45 },
        gASRewards: {
            version: 0,
            baker: 0.25,
            finalizationProof: 0.005,
            accountCreation: 0.02,
            chainUpdate: 0.005,
        },
        mintDistribution: {
            version: 1,
            bakingReward: 0.6,
            finalizationReward: 0.3,
        },
    },
    level1Keys,
    level2Keys: {
        version: 1,
        addAnonymityRevoker: {
            authorizedKeys: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
            threshold: 7,
        },
        addIdentityProvider: {
            authorizedKeys: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
            threshold: 7,
        },
        cooldownParameters: {
            authorizedKeys: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
            threshold: 7,
        },
        electionDifficulty: {
            authorizedKeys: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
            threshold: 7,
        },
        emergency: {
            authorizedKeys: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
            threshold: 7,
        },
        euroPerEnergy: {
            authorizedKeys: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
            threshold: 7,
        },
        foundationAccount: {
            authorizedKeys: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
            threshold: 7,
        },
        keys: [
            {
                schemeId: 'Ed25519',
                verifyKey: 'b8ddf4505a37eee2c046671f634b74cf3630f3958ad70a04f39dc843041965be',
            },
            {
                schemeId: 'Ed25519',
                verifyKey: '6f39b453a1f2d04be8e1d34822d4819af1bae7bd10bd0d1f05cbdbfc0907886f',
            },
            {
                schemeId: 'Ed25519',
                verifyKey: 'bf1dbf2070a9af3f469f829817c929ca98349bf383180abf53fa5d349c2ae72f',
            },
            {
                schemeId: 'Ed25519',
                verifyKey: '691dea8d3aeb620e08130d0cddb68156809e894f603763990a2b21af5b17d916',
            },
            {
                schemeId: 'Ed25519',
                verifyKey: 'd6e2ec35c642f52681921b313e4563fda16ab893b8597417778ffd57748a4f30',
            },
            {
                schemeId: 'Ed25519',
                verifyKey: '4fefb5ee8f8f46ecb86accbf44218e7699eb4937122a284d349db9f8e70a9794',
            },
            {
                schemeId: 'Ed25519',
                verifyKey: 'b43e41e008c520c421df2229ea2af816d907d2f085b82b3cadc156165d49ed2a',
            },
            {
                schemeId: 'Ed25519',
                verifyKey: '7386b8a50d01797f95e594112ca1734d2dc2984235c58c9cf5c18a07f7cef98c',
            },
            {
                schemeId: 'Ed25519',
                verifyKey: '56a75f4399a0671fd8a11d88b59c33be00ffb9328a31a41467ce98ddd932dcb1',
            },
            {
                schemeId: 'Ed25519',
                verifyKey: '9974b5868241dd1eee38edda8ad64cfb23722e280ef09286c8a1c7a3c3ba1f40',
            },
            {
                schemeId: 'Ed25519',
                verifyKey: 'fd363dfd04f319848c3d766bc617a5f88f0044f1813cc4a2140a6d28e9b62cce',
            },
            {
                schemeId: 'Ed25519',
                verifyKey: '528281d04d8d74dba67fac53460fa3e2ff2f171f16363d80f679877821b538d2',
            },
            {
                schemeId: 'Ed25519',
                verifyKey: '8ebab6f84c237b331d54a2f611ea8fceeba5b9e0ffff7a096a172f034257999f',
            },
            {
                schemeId: 'Ed25519',
                verifyKey: '616fe3f0441f87e2ba32194faf6c3ea658cac5d31353303a45ca3d1d4164a4f1',
            },
            {
                schemeId: 'Ed25519',
                verifyKey: 'e1f1c6971705da9c2a50be7967609c092fe295a88c71fbf18dd90cc6d81508f2',
            },
        ],
        microGTUPerEuro: {
            authorizedKeys: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
            threshold: 2,
        },
        mintDistribution: {
            authorizedKeys: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
            threshold: 7,
        },
        paramGASRewards: {
            authorizedKeys: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
            threshold: 7,
        },
        poolParameters: {
            authorizedKeys: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
            threshold: 7,
        },
        protocol: {
            authorizedKeys: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
            threshold: 7,
        },
        timeParameters: {
            authorizedKeys: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
            threshold: 7,
        },
        transactionFeeDistribution: {
            authorizedKeys: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
            threshold: 7,
        },
    },
    rootKeys,
};

const { cooldownParameters, timeParameters, version, ...oldLevel2Keys } = chainParameters.level2Keys;

export const oldChainParameters: ChainParametersV0 = {
    version: 0,
    electionDifficulty: 0.025,
    euroPerEnergy: { numerator: 1n, denominator: 50000n },
    microGTUPerEuro: { numerator: 50000000n, denominator: 1n },
    accountCreationLimit: 10,
    foundationAccount: AccountAddress.fromBase58('3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G'),
    bakerCooldownEpochs: 166n,
    minimumThresholdForBaking: CcdAmount.fromMicroCcd(15000000000n),
    rewardParameters: {
        version: 0,
        transactionFeeDistribution: { baker: 0.45, gasAccount: 0.45 },
        gASRewards: {
            version: 0,
            baker: 0.25,
            finalizationProof: 0.005,
            accountCreation: 0.02,
            chainUpdate: 0.005,
        },
        mintDistribution: {
            version: 0,
            bakingReward: 0.6,
            finalizationReward: 0.3,
            mintPerSlot: 7.555665e-10,
        },
    },
    level1Keys,
    level2Keys: { version: 0, ...oldLevel2Keys },
    rootKeys,
};

export const bakerPoolStatus: BakerPoolStatus = {
    poolType: PoolStatusType.BakerPool,
    bakerId: 1n,
    bakerAddress: AccountAddress.fromBase58('3U4sfVSqGG6XK8g6eho2qRYtnHc4MWJBG1dfxdtPGbfHwFxini'),
    bakerEquityCapital: CcdAmount.fromMicroCcd(7347853372468927n),
    delegatedCapital: CcdAmount.zero(),
    delegatedCapitalCap: CcdAmount.zero(),
    poolInfo: {
        openStatus: OpenStatusText.OpenForAll,
        metadataUrl: '',
        commissionRates: {
            transactionCommission: 0.1,
            bakingCommission: 0.1,
            finalizationCommission: 1,
        },
    },
    bakerStakePendingChange: {
        pendingChangeType: BakerPoolPendingChangeType.NoChange,
    },
    currentPaydayStatus: {
        blocksBaked: 1329n,
        finalizationLive: true,
        transactionFeesEarned: CcdAmount.fromMicroCcd(105169976n),
        effectiveStake: CcdAmount.fromMicroCcd(4605214437901336n),
        lotteryPower: 0.15552531374613243,
        bakerEquityCapital: CcdAmount.fromMicroCcd(7344771840225046n),
        delegatedCapital: CcdAmount.zero(),
        commissionRates: {
            bakingCommission: 0.1,
            finalizationCommission: 1,
            transactionCommission: 0.1,
        },
        missedRounds: 0n,
        isPrimedForSuspension: false,
    },
    allPoolTotalCapital: CcdAmount.fromMicroCcd(46071942529284135n),
    isSuspended: false,
};

export const passiveDelegationStatus: PassiveDelegationStatus = {
    poolType: PoolStatusType.PassiveDelegation,
    delegatedCapital: CcdAmount.fromMicroCcd(698892529615n),
    commissionRates: {
        transactionCommission: 0.12,
        bakingCommission: 0.12,
        finalizationCommission: 1,
    },
    currentPaydayTransactionFeesEarned: CcdAmount.fromMicroCcd(24070n),
    currentPaydayDelegatedCapital: CcdAmount.fromMicroCcd(698618484955n),
    allPoolTotalCapital: CcdAmount.fromMicroCcd(46071942529284135n),
};

export const bakerPoolStatusWithPendingChange: BakerPoolStatus = {
    poolType: PoolStatusType.BakerPool,
    bakerId: 1879n,
    bakerAddress: AccountAddress.fromBase58('4aCoaW3qkQRnY3fUGThQcEMGSPLUEQ7XL9Yagx2UR91QpvtoAe'),
    bakerEquityCapital: CcdAmount.fromMicroCcd(19999999999n),
    delegatedCapital: CcdAmount.zero(),
    delegatedCapitalCap: CcdAmount.fromMicroCcd(39999999998n),
    poolInfo: {
        openStatus: OpenStatusText.OpenForAll,
        metadataUrl: 'b',
        commissionRates: {
            transactionCommission: 0.1,
            bakingCommission: 0.1,
            finalizationCommission: 1,
        },
    },
    bakerStakePendingChange: {
        pendingChangeType: BakerPoolPendingChangeType.RemovePool,
        effectiveTime: new Date('2022-12-08T07:54:00.000Z'),
    },
    allPoolTotalCapital: CcdAmount.fromMicroCcd(46470271917743628n),
    isSuspended: false,
};

export const invokeContractResult: InvokeContractResult = {
    tag: 'success',
    usedEnergy: Energy.create(502),
    returnValue: ReturnValue.fromHexString('000f17697d00000000'),
    events: [
        {
            tag: TransactionEventTag.Updated,
            contractVersion: 1,
            address: ContractAddress.create(81),
            instigator: {
                type: 'AddressAccount',
                address: AccountAddress.fromBase58('3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G'),
            },
            amount: CcdAmount.zero(),
            message: Parameter.empty(),
            receiveName: ReceiveName.fromStringUnchecked('PiggyBank.view'),
            events: [],
        },
    ],
};

export const blocksAtHeight: BlockHash.Type[] = [
    '99ceb0dfcd36714d9c141fde08e85da1d0d624994e95b35114f14193c811b76e',
].map(BlockHash.fromHexString);

export const blockInfo: BlockInfoV0 = {
    version: 0,
    blockParent: BlockHash.fromHexString('28d92ec42dbda119f0b0207d3400b0573fe8baf4b0d3dbe44b86781ad6b655cf'),
    blockHash: BlockHash.fromHexString('fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e'),
    blockStateHash: '6e602157d76677fc4b630b2701571d2b0166e2b08e0afe8ab92356e4d0b88a6a',
    blockLastFinalized: BlockHash.fromHexString('28d92ec42dbda119f0b0207d3400b0573fe8baf4b0d3dbe44b86781ad6b655cf'),
    blockHeight: 1259179n,
    blockBaker: 4n,
    blockSlot: 50801674n,
    blockArriveTime: new Date('2022-11-07T10:54:10.899Z'),
    blockReceiveTime: new Date('2022-11-07T10:54:10.892Z'),
    blockSlotTime: new Date('2022-11-07T10:54:10.750Z'),
    finalized: true,
    transactionCount: 0n,
    transactionsSize: 0n,
    transactionEnergyCost: Energy.create(0),
    genesisIndex: 1,
    eraBlockHeight: 1258806,
    protocolVersion: 4n,
};

export const bakers = [
    1n,
    3n,
    4n,
    5n,
    6n,
    8n,
    15n,
    20n,
    48n,
    56n,
    58n,
    331n,
    385n,
    387n,
    525n,
    587n,
    841n,
    886n,
    912n,
    1004n,
    1010n,
    1016n,
    1303n,
    1370n,
    1601n,
    1614n,
];

export const epochFinalizationEntry: EpochFinalizationEntry = {
    finalizedQc: {
        blockHash: '20e3ebb41565b460615b08e994103b4a7415f4224441fc9c17c766a1ed1e040f',
        round: 78524n,
        epoch: 48n,
        aggregateSignature:
            'a351b4f049da150731d2699bc49584af158633ec842ab6a676ab4c2402d1c917149d57c4c2ea73d3c58eae222853a6ba',
        signatories: [3n, 4n, 5n, 6n, 8n, 1004n],
    },
    successorQc: {
        blockHash: '524d787522286a3b2483d3c1cbec5e13ed6ba282484c6caacec56b1353a3c6bc',
        round: 78525n,
        epoch: 48n,
        aggregateSignature:
            'b8f823d6b4c09243f77396ce62b7d33ad17d429036a0c37810d58d2cfdec293645a02c6874cf17523d41ccf373d943aa',
        signatories: [3n, 4n, 5n, 6n, 8n, 1004n],
    },
    successorProof: '3c95938c7aba9c93c805390d9d93dd7f67bd868320e4dd5bcd2f27a7f6f3c011',
};

export const quorumCertificate: QuorumCertificate = {
    blockHash: '524d787522286a3b2483d3c1cbec5e13ed6ba282484c6caacec56b1353a3c6bc',
    round: 78525n,
    epoch: 48n,
    aggregateSignature:
        'b8f823d6b4c09243f77396ce62b7d33ad17d429036a0c37810d58d2cfdec293645a02c6874cf17523d41ccf373d943aa',
    signatories: [3n, 4n, 5n, 6n, 8n, 1004n],
};
export const timeoutCertificate: TimeoutCertificate = {
    round: 78992n,
    minEpoch: 49n,
    qcRoundsFirstEpoch: [
        {
            round: 78991n,
            finalizers: [1n, 3n, 5n, 6n, 8n, 1004n, 1010n, 1016n],
        },
    ],
    qcRoundsSecondEpoch: [],
    aggregateSignature:
        'ad8f2c078af44f2b4002172108385c59d012e72d9c8febfa9c2cd6592697621fd4b036df2668bc65190cbf5a5c20dcad',
};
