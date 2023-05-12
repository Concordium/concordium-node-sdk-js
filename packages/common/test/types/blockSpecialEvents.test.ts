import {
    BlockSpecialEventBakingRewards,
    BlockSpecialEventPaydayPoolReward,
    BlockSpecialEventBlockAccrueReward,
    BlockSpecialEventPaydayFoundationReward,
    BlockSpecialEventFinalizationRewards,
    BlockSpecialEventMint,
    BlockSpecialEventPaydayAccountReward,
    BlockSpecialEventBlockReward,
    specialEventAffectedAccounts,
} from '../../src';

const bakingRewards: BlockSpecialEventBakingRewards = {
    tag: 'bakingRewards',
    remainder: 0n,
    bakingRewards: [
        {
            account: '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe',
            amount: 400000n,
        },
        {
            account: '3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV',
            amount: 400000n,
        },
    ],
};

const finalizationRewards: BlockSpecialEventFinalizationRewards = {
    tag: 'finalizationRewards',
    remainder: 0n,
    finalizationRewards: [
        {
            account: '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe',
            amount: 400000n,
        },
        {
            account: '3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV',
            amount: 400000n,
        },
    ],
};

const foundationReward: BlockSpecialEventPaydayFoundationReward = {
    tag: 'paydayFoundationReward',
    developmentCharge: 123n,
    foundationAccount: '3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV',
};

const mint: BlockSpecialEventMint = {
    tag: 'mint',
    mintBakingReward: 0n,
    mintFinalizationReward: 0n,
    mintPlatformDevelopmentCharge: 0n,
    foundationAccount: '3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV',
};

const paydayAccountReward: BlockSpecialEventPaydayAccountReward = {
    tag: 'paydayAccountReward',
    account: '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe',
    transactionFees: 123n,
    bakerReward: 123n,
    finalizationReward: 123n,
};

const foundationBlockReward: BlockSpecialEventBlockReward = {
    tag: 'blockReward',
    transactionFees: 1231241n,
    bakerReward: 12314n,
    foundationCharge: 12n,
    newGasAccount: 1n,
    oldGasAccount: 0n,
    baker: '3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV',
    foundationAccount: '3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV',
};

const blockReward: BlockSpecialEventBlockReward = {
    tag: 'blockReward',
    transactionFees: 1231241n,
    bakerReward: 12314n,
    foundationCharge: 12n,
    newGasAccount: 1n,
    oldGasAccount: 0n,
    baker: '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe',
    foundationAccount: '3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV',
};

const paydayPoolReward: BlockSpecialEventPaydayPoolReward = {
    tag: 'paydayPoolReward',
    poolOwner: 123n,
    finalizationReward: 123n,
    bakerReward: 12314n,
    transactionFees: 1231241n,
};

const accrueReward: BlockSpecialEventBlockAccrueReward = {
    tag: 'blockAccrueReward',
    transactionFees: 1231241n,
    bakerReward: 12314n,
    baker: 0n,
    foundationCharge: 12n,
    newGasAccount: 1n,
    oldGasAccount: 0n,
    passiveReward: 123n,
};

describe('specialEventAffectedAccounts', () => {
    test('Returns empty list of accounts for events with no account payouts', () => {
        let accounts = specialEventAffectedAccounts(paydayPoolReward);
        expect(accounts).toEqual([]);

        accounts = specialEventAffectedAccounts(accrueReward);
        expect(accounts).toEqual([]);
    });

    test('Returns correct list of accounts for events with account payouts', () => {
        let accounts = specialEventAffectedAccounts(bakingRewards);
        expect(accounts).toEqual([
            '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe',
            '3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV',
        ]);

        accounts = specialEventAffectedAccounts(finalizationRewards);
        expect(accounts).toEqual([
            '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe',
            '3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV',
        ]);

        accounts = specialEventAffectedAccounts(foundationReward);
        expect(accounts).toEqual([
            '3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV',
        ]);

        accounts = specialEventAffectedAccounts(mint);
        expect(accounts).toEqual([
            '3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV',
        ]);

        accounts = specialEventAffectedAccounts(paydayAccountReward);
        expect(accounts).toEqual([
            '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe',
        ]);

        accounts = specialEventAffectedAccounts(foundationBlockReward);
        expect(accounts).toEqual([
            '3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV',
        ]);

        accounts = specialEventAffectedAccounts(blockReward);
        expect(accounts).toEqual([
            '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe',
            '3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV',
        ]);
    });
});
