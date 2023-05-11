import {
    BaseAccountTransactionSummary,
    FailedTransactionSummary,
    isRejectTransaction,
    isSuccessTransaction,
    RejectReasonTag,
    TransactionKindString,
    TransactionSummaryType,
    UpdateContractSummary,
    getTransactionRejectReason,
    UpdateSummary,
    UpdateType,
    affectedContracts,
    TransactionEventTag,
    InitContractSummary,
    affectedAccounts,
    TransferSummary,
    ConfigureDelegationSummary,
    DelegationTargetType,
    getSummaryContractUpdateLogs,
} from '../../src';

const chainUpdate: UpdateSummary = {
    type: TransactionSummaryType.UpdateTransaction,
    index: 0n,
    energyCost: 0n,
    hash: '4b4adfbe9a10a83601a1171bff0d9f916d259f744d1283726314482beeab60ee',
    effectiveTime: 1655118000n,
    payload: {
        updateType: UpdateType.Protocol,
        update: {
            message: 'Enable delegation and updated smart contracts',
            specificationHash:
                '20c6f246713e573fb5bfdf1e59c0a6f1a37cded34ff68fda4a60aa2ed9b151aa',
            specificationUrl:
                'https://github.com/Concordium/concordium-update-proposals/blob/main/updates/P4.txt',
            specificationAuxiliaryData:
                '000186a0000027100000271002000f0000000100020003000400050006000700080009000a000b000c000d000e0007000f0000000100020003000400050006000700080009000a000b000c000d000e000700000000001baf80000000000012750000000000000000180f90f3f50c000186a000002ee000002ee0000186a0000186a0000027100000271000002710000027100000000342770c000000271000000000000000030000000000000001',
        },
    },
};

const contractInit: InitContractSummary & BaseAccountTransactionSummary = {
    index: 0n,
    energyCost: 1032n,
    hash: '00205bab563b31dbd0d6cff9504a325953ac70a428ac7169f66620c40b20c431',
    type: TransactionSummaryType.AccountTransaction,
    cost: 2765192n,
    sender: '4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd',
    transactionType: TransactionKindString.InitContract,
    contractInitialized: {
        tag: TransactionEventTag.ContractInitialized,
        address: { index: 4416n, subindex: 0n },
        amount: 0n,
        initName: 'init_cis2-receive-test',
        events: [],
        contractVersion: 1,
        ref: '627d5b8358ecf0eaa0442855d57bd84258aa1e06006cbb59ca03d31ddd5cb8b7',
    },
};

const contractUpdate: UpdateContractSummary & BaseAccountTransactionSummary = {
    index: 0n,
    energyCost: 3183n,
    hash: '9f23369ed3f19cb5627f685d7193e58432e9b50e0841469b07b6d02aa7770901',
    type: TransactionSummaryType.AccountTransaction,
    cost: 8681698n,
    sender: '4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd',
    transactionType: TransactionKindString.Update,
    events: [
        {
            tag: TransactionEventTag.Updated,
            contractVersion: 1,
            address: { index: 3496n, subindex: 0n },
            instigator: {
                type: 'AddressAccount',
                address: '4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd',
            },
            amount: 0n,
            message:
                '0100006400c8d4bb7106a96bfa6f069438270bf9748049c24798b13b08f88fc2f46afb435f0087e3bec61b8db2fb7389b57d2be4f7dd95d1088dfeb6ef7352c13d2b2d27bb490000',
            receiveName: 'cis2-bridgeable.transfer',
            events: [
                'ff006400c8d4bb7106a96bfa6f069438270bf9748049c24798b13b08f88fc2f46afb435f0087e3bec61b8db2fb7389b57d2be4f7dd95d1088dfeb6ef7352c13d2b2d27bb49',
            ],
        },
        {
            tag: TransactionEventTag.Interrupted,
            address: { index: 3496n, subindex: 0n },
            events: [
                'ff006400c8d4bb7106a96bfa6f069438270bf9748049c24798b13b08f88fc2f46afb435f0087e3bec61b8db2fb7389b57d2be4f7dd95d1088dfeb6ef7352c13d2b2d27bb49',
            ],
        },
        {
            tag: TransactionEventTag.Updated,
            contractVersion: 1,
            address: { index: 4416n, subindex: 0n },
            instigator: {
                type: 'AddressAccount',
                address: '4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd',
            },
            amount: 0n,
            message:
                '0100006400c8d4bb7106a96bfa6f069438270bf9748049c24798b13b08f88fc2f46afb435f0087e3bec61b8db2fb7389b57d2be4f7dd95d1088dfeb6ef7352c13d2b2d27bb490000',
            receiveName: 'cis2-bridgeable.transfer',
            events: [
                'ff006400c8d4bb7106a96bfa6f069438270bf9748049c24798b13b08f88fc2f46afb435f0087e3bec61b8db2fb7389b57d2be4f7dd95d1088dfeb6ef7352c13d2b2d27bb49',
            ],
        },
        {
            tag: TransactionEventTag.Transferred,
            amount: 0n,
            to: {
                type: 'AddressAccount',
                address: '4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd',
            },
        },
        {
            tag: TransactionEventTag.Transferred,
            amount: 0n,
            to: {
                type: 'AddressAccount',
                address: '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB',
            },
        },
    ],
};

const rejected: FailedTransactionSummary & BaseAccountTransactionSummary = {
    index: 0n,
    energyCost: 4600n,
    hash: '9e3eb5a2d36cb125292c553be304d943148c861f284b5d58afd215d1cfbbd8bf',
    type: TransactionSummaryType.AccountTransaction,
    cost: 12403437n,
    sender: '4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd',
    transactionType: TransactionKindString.Failed,
    failedTransactionType: TransactionKindString.Update,
    rejectReason: {
        tag: RejectReasonTag.RejectedReceive,
        contractAddress: { index: 3496n, subindex: 0n },
        receiveName: 'cis2-bridgeable.transfer',
        rejectReason: -5,
        parameter:
            '0100006400c8d4bb7106a96bfa6f069438270bf9748049c24798b13b08f88fc2f46afb435f01271100000000000000000000000000000f006f6e526563656976696e67434953320000',
    },
};

const transfer: BaseAccountTransactionSummary & TransferSummary = {
    index: 0n,
    energyCost: 601n,
    hash: 'a396ae28d1158650d52168ad108e7c5f566831fe5d0695ceab91044ba5eb6b5b',
    type: TransactionSummaryType.AccountTransaction,
    cost: 1651916n,
    sender: '3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV',
    transactionType: TransactionKindString.Transfer,
    transfer: {
        tag: TransactionEventTag.Transferred,
        amount: 2000000000n,
        to: '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe',
    },
};

const transferToSelf: BaseAccountTransactionSummary & TransferSummary = {
    index: 0n,
    energyCost: 601n,
    hash: 'a396ae28d1158650d52168ad108e7c5f566831fe5d0695ceab91044ba5eb6b5b',
    type: TransactionSummaryType.AccountTransaction,
    cost: 1651916n,
    sender: '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe',
    transactionType: TransactionKindString.Transfer,
    transfer: {
        tag: TransactionEventTag.Transferred,
        amount: 2000000000n,
        to: '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe',
    },
};

const configureDelegation: BaseAccountTransactionSummary &
    ConfigureDelegationSummary = {
    index: 0n,
    energyCost: 601n,
    hash: 'a396ae28d1158650d52168ad108e7c5f566831fe5d0695ceab91044ba5eb6b5b',
    type: TransactionSummaryType.AccountTransaction,
    cost: 1651916n,
    sender: '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe',
    transactionType: TransactionKindString.ConfigureDelegation,
    events: [
        {
            tag: TransactionEventTag.DelegationAdded,
            delegatorId: 2499,
            account: '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe',
        },
        {
            tag: TransactionEventTag.DelegationSetDelegationTarget,
            delegatorId: 2499,
            delegationTarget: {
                delegateType: DelegationTargetType.Baker,
                bakerId: 15,
            },
            account: '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe',
        },
        {
            tag: TransactionEventTag.DelegationSetRestakeEarnings,
            delegatorId: 2499,
            restakeEarnings: true,
            account: '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe',
        },
        {
            tag: TransactionEventTag.DelegationStakeIncreased,
            delegatorId: 2499,
            newStake: 240000000n,
            account: '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe',
        },
    ],
};

describe('isSuccessTransaction', () => {
    test('Returns true for successful transaction', () => {
        let res = isSuccessTransaction(contractUpdate);
        expect(res).toBe(true);
        res = isSuccessTransaction(chainUpdate);
        expect(res).toBe(true);
    });

    test('Returns false for rejected transaction', () => {
        const res = isSuccessTransaction(rejected);
        expect(res).toBe(false);
    });
});

describe('isRejectTransaction', () => {
    test('Returns false for successful transaction', () => {
        let res = isRejectTransaction(contractUpdate);
        expect(res).toBe(false);
        res = isRejectTransaction(chainUpdate);
        expect(res).toBe(false);
    });

    test('Returns true for rejected transaction', () => {
        const res = isRejectTransaction(rejected);
        expect(res).toBe(true);
    });
});

describe('getTransactionRejectReason', () => {
    test('Returns undefined for successful transaction', () => {
        let res = getTransactionRejectReason(contractUpdate);
        expect(res).toBe(undefined);
        res = getTransactionRejectReason(chainUpdate);
        expect(res).toBe(undefined);
    });

    test('Returns true for rejected transaction', () => {
        const res = getTransactionRejectReason(rejected);
        expect(res).toBe(rejected.rejectReason);
    });
});

describe('affectedContracts', () => {
    test('Returns empty list for non-contract related transactions', () => {
        let contracts = affectedContracts(chainUpdate);
        expect(contracts).toEqual([]);

        contracts = affectedContracts(rejected);
        expect(contracts).toEqual([]);
    });

    test('Returns list of one contract address corresponding to contract init transaction events', () => {
        const contracts = affectedContracts(contractInit);
        expect(contracts).toEqual([{ index: 4416n, subindex: 0n }]);
    });

    test('Returns list of unique contract addresses corresponding to contract update transaction events', () => {
        const contracts = affectedContracts(contractUpdate);
        expect(contracts).toEqual([
            { index: 3496n, subindex: 0n },
            { index: 4416n, subindex: 0n },
        ]);
    });
});

describe('affectedAccounts', () => {
    test('Returns empty list for non-account related transactions', () => {
        const accounts = affectedAccounts(chainUpdate);
        expect(accounts).toEqual([]);
    });

    test('Returns list of unique account addresses corresponding to transaction', () => {
        let accounts = affectedAccounts(contractUpdate);
        expect(accounts).toEqual([
            '4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd',
            '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB',
        ]);

        accounts = affectedAccounts(rejected);
        expect(accounts).toEqual([
            '4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd',
        ]);

        accounts = affectedAccounts(transfer);
        expect(accounts).toEqual([
            '3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV',
            '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe',
        ]);

        accounts = affectedAccounts(transferToSelf);
        expect(accounts).toEqual([
            '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe',
        ]);

        accounts = affectedAccounts(configureDelegation);
        expect(accounts).toEqual([
            '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe',
        ]);
    });
});

describe('getSummaryContractUpdateLogs', () => {
    test('Returns empty list for non-contractupdate transactions', () => {
        let logs = getSummaryContractUpdateLogs(chainUpdate);
        expect(logs).toEqual([]);

        logs = getSummaryContractUpdateLogs(contractInit);
        expect(logs).toEqual([]);
    });

    test('Returns list of unique account addresses corresponding to transaction', () => {
        const logs = getSummaryContractUpdateLogs(contractUpdate);
        expect(logs).toEqual([
            {
                address: { index: 3496n, subindex: 0n },
                events: [
                    'ff006400c8d4bb7106a96bfa6f069438270bf9748049c24798b13b08f88fc2f46afb435f0087e3bec61b8db2fb7389b57d2be4f7dd95d1088dfeb6ef7352c13d2b2d27bb49',
                ],
            },
            {
                address: { index: 3496n, subindex: 0n },
                events: [
                    'ff006400c8d4bb7106a96bfa6f069438270bf9748049c24798b13b08f88fc2f46afb435f0087e3bec61b8db2fb7389b57d2be4f7dd95d1088dfeb6ef7352c13d2b2d27bb49',
                ],
            },
            {
                address: { index: 4416n, subindex: 0n },
                events: [
                    'ff006400c8d4bb7106a96bfa6f069438270bf9748049c24798b13b08f88fc2f46afb435f0087e3bec61b8db2fb7389b57d2be4f7dd95d1088dfeb6ef7352c13d2b2d27bb49',
                ],
            },
        ]);
    });
});
