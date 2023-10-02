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
    CcdAmount,
    AccountAddress,
} from '../../src/index.js';
import { expectToEqual } from '../testHelpers.js';

const bakingRewards: BlockSpecialEventBakingRewards = {
    tag: 'bakingRewards',
    remainder: CcdAmount.zero(),
    bakingRewards: [
        {
            account: AccountAddress.fromBase58(
                '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe'
            ),
            amount: CcdAmount.fromMicroCcd(400000),
        },
        {
            account: AccountAddress.fromBase58(
                '3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV'
            ),
            amount: CcdAmount.fromMicroCcd(400000),
        },
    ],
};

const finalizationRewards: BlockSpecialEventFinalizationRewards = {
    tag: 'finalizationRewards',
    remainder: CcdAmount.zero(),
    finalizationRewards: [
        {
            account: AccountAddress.fromBase58(
                '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe'
            ),
            amount: CcdAmount.fromMicroCcd(400000),
        },
        {
            account: AccountAddress.fromBase58(
                '3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV'
            ),
            amount: CcdAmount.fromMicroCcd(400000),
        },
    ],
};

const foundationReward: BlockSpecialEventPaydayFoundationReward = {
    tag: 'paydayFoundationReward',
    developmentCharge: CcdAmount.fromMicroCcd(123),
    foundationAccount: AccountAddress.fromBase58(
        '3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV'
    ),
};

const mint: BlockSpecialEventMint = {
    tag: 'mint',
    mintBakingReward: CcdAmount.zero(),
    mintFinalizationReward: CcdAmount.zero(),
    mintPlatformDevelopmentCharge: CcdAmount.zero(),
    foundationAccount: AccountAddress.fromBase58(
        '3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV'
    ),
};

const paydayAccountReward: BlockSpecialEventPaydayAccountReward = {
    tag: 'paydayAccountReward',
    account: AccountAddress.fromBase58(
        '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe'
    ),
    transactionFees: CcdAmount.fromMicroCcd(123),
    bakerReward: CcdAmount.fromMicroCcd(123),
    finalizationReward: CcdAmount.fromMicroCcd(123),
};

const foundationBlockReward: BlockSpecialEventBlockReward = {
    tag: 'blockReward',
    transactionFees: CcdAmount.fromMicroCcd(1231241),
    bakerReward: CcdAmount.fromMicroCcd(12314),
    foundationCharge: CcdAmount.fromMicroCcd(12),
    newGasAccount: CcdAmount.fromMicroCcd(1),
    oldGasAccount: CcdAmount.zero(),
    baker: AccountAddress.fromBase58(
        '3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV'
    ),
    foundationAccount: AccountAddress.fromBase58(
        '3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV'
    ),
};

const blockReward: BlockSpecialEventBlockReward = {
    tag: 'blockReward',
    transactionFees: CcdAmount.fromMicroCcd(1231241),
    bakerReward: CcdAmount.fromMicroCcd(12314),
    foundationCharge: CcdAmount.fromMicroCcd(12),
    newGasAccount: CcdAmount.fromMicroCcd(1),
    oldGasAccount: CcdAmount.zero(),
    baker: AccountAddress.fromBase58(
        '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe'
    ),
    foundationAccount: AccountAddress.fromBase58(
        '3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV'
    ),
};

const paydayPoolReward: BlockSpecialEventPaydayPoolReward = {
    tag: 'paydayPoolReward',
    poolOwner: 123n,
    finalizationReward: CcdAmount.fromMicroCcd(123),
    bakerReward: CcdAmount.fromMicroCcd(12314),
    transactionFees: CcdAmount.fromMicroCcd(1231241),
};

const accrueReward: BlockSpecialEventBlockAccrueReward = {
    tag: 'blockAccrueReward',
    transactionFees: CcdAmount.fromMicroCcd(1231241),
    bakerReward: CcdAmount.fromMicroCcd(12314),
    baker: 0n,
    foundationCharge: CcdAmount.fromMicroCcd(12),
    newGasAccount: CcdAmount.fromMicroCcd(1),
    oldGasAccount: CcdAmount.zero(),
    passiveReward: CcdAmount.fromMicroCcd(123),
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
        expectToEqual(
            accounts,
            [
                '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe',
                '3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV',
            ].map(AccountAddress.fromBase58)
        );

        accounts = specialEventAffectedAccounts(finalizationRewards);
        expectToEqual(
            accounts,
            [
                '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe',
                '3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV',
            ].map(AccountAddress.fromBase58)
        );

        accounts = specialEventAffectedAccounts(foundationReward);
        expectToEqual(
            accounts,
            ['3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV'].map(
                AccountAddress.fromBase58
            )
        );

        accounts = specialEventAffectedAccounts(mint);
        expectToEqual(
            accounts,
            ['3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV'].map(
                AccountAddress.fromBase58
            )
        );

        accounts = specialEventAffectedAccounts(paydayAccountReward);
        expectToEqual(
            accounts,
            ['4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe'].map(
                AccountAddress.fromBase58
            )
        );

        accounts = specialEventAffectedAccounts(foundationBlockReward);
        expectToEqual(
            accounts,
            ['3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV'].map(
                AccountAddress.fromBase58
            )
        );

        accounts = specialEventAffectedAccounts(blockReward);
        expectToEqual(
            accounts,
            [
                '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe',
                '3v1JUB1R1JLFtcKvHqD9QFqe2NXeBF53tp69FLPHYipTjNgLrV',
            ].map(AccountAddress.fromBase58)
        );
    });
});
