import {
    AccountTransactionType,
    CIS2Contract,
    ContractAddress,
    TransactionEventTag,
} from '@concordium/common-sdk';
import { getNodeClient } from './testHelpers';

const CIS2_FT_ADDRESS: ContractAddress = {
    index: 3496n,
    subindex: 0n,
};
const CIS2_NFT_ADDRESS: ContractAddress = {
    index: 1696n,
    subindex: 0n,
};

const TEST_BLOCK =
    '3e9d90325c61ab190065f3c90364beeb925833319de68d982ec6da7762e8357b';
const TEST_ACCOUNT = '4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd';

const getCIS2Single = () =>
    CIS2Contract.create(getNodeClient(), CIS2_FT_ADDRESS);
const getCIS2Multi = () =>
    CIS2Contract.create(getNodeClient(), CIS2_NFT_ADDRESS);

test('create throws on non cis-2', async () => {
    const promise = CIS2Contract.create(getNodeClient(), {
        index: 3494n,
        subindex: 0n,
    });
    expect(promise).rejects.toThrow();
});

test('balanceOf', async () => {
    const cis2Single = await getCIS2Single();
    const balanceSingle = await cis2Single.balanceOf(
        { tokenId: '', address: TEST_ACCOUNT },
        TEST_BLOCK
    );
    expect(balanceSingle).toEqual(47980000n);

    const cis2Multi = await getCIS2Multi();
    const balanceList = await cis2Multi.balanceOf(
        [
            { tokenId: '01', address: TEST_ACCOUNT },
            { tokenId: '02', address: TEST_ACCOUNT },
        ],
        TEST_BLOCK
    );
    expect(balanceList).toEqual([0n, 0n]);
});

test('operatorOf', async () => {
    const cis2Single = await getCIS2Single();
    const isOperator = await cis2Single.operatorOf(
        { owner: TEST_ACCOUNT, address: { index: 3494n, subindex: 0n } },
        TEST_BLOCK
    );
    expect(isOperator).toEqual(true);

    const cis2Multi = await getCIS2Multi();
    const isOperatorList = await cis2Multi.operatorOf(
        [
            {
                owner: TEST_ACCOUNT,
                address: '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB',
            },
            { owner: TEST_ACCOUNT, address: { index: 3494n, subindex: 0n } },
        ],
        TEST_BLOCK
    );
    expect(isOperatorList).toEqual([true, false]);
});

test('tokenMetadata', async () => {
    const cis2Single = await getCIS2Single();
    const metadata = await cis2Single.tokenMetadata('', TEST_BLOCK);
    expect(metadata).toEqual({
        url: 'http://ethbridge.testnet.concordium.com/assets/USDC.json',
        hash: '41a31ab417b3a3a583fb9cc99de293bcf5117b1b6a15f0a535aac2438898e353',
    });

    const cis2Multi = await getCIS2Multi();
    const metadataList = await cis2Multi.tokenMetadata(
        ['01', '02'],
        TEST_BLOCK
    );
    expect(metadataList).toEqual([
        {
            url: 'https://s3.eu-central-1.amazonaws.com/tokens.testnet.concordium.com/ft/01',
        },
        {
            url: 'https://s3.eu-central-1.amazonaws.com/tokens.testnet.concordium.com/ft/02',
        },
    ]);
});

test('dryRun.transfer', async () => {
    const cis2 = await getCIS2Single();
    const result = await cis2.dryRun.transfer(
        TEST_ACCOUNT,
        {
            tokenId: '',
            to: TEST_ACCOUNT,
            from: TEST_ACCOUNT,
            tokenAmount: 100n,
        },
        TEST_BLOCK
    );
    expect(result.usedEnergy).toEqual(2796n);
    // Results in 1 transfer event
    expect(
        result.tag === 'success' &&
            result.events[0].tag === TransactionEventTag.Updated &&
            result.events[0].events.length
    ).toEqual(1);

    const resultMulti = await cis2.dryRun.transfer(
        TEST_ACCOUNT,
        [
            {
                tokenId: '',
                from: TEST_ACCOUNT,
                to: '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB',
                tokenAmount: 100n,
            },
            {
                tokenId: '',
                from: TEST_ACCOUNT,
                to: '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe',
                tokenAmount: 120n,
            },
        ],
        TEST_BLOCK
    );

    expect(resultMulti.usedEnergy).toEqual(3278n);
    // Results in 2 transfer events
    expect(
        resultMulti.tag === 'success' &&
            resultMulti.events[0].tag === TransactionEventTag.Updated &&
            resultMulti.events[0].events.length
    ).toEqual(2);

    // TODO: This is supposed to test that transfer is successfully run with a contract receiver..
    const resultContractReceiver = await cis2.dryRun.transfer(
        TEST_ACCOUNT,
        {
            tokenId: '',
            from: TEST_ACCOUNT,
            to: {
                address: { index: 3494n, subindex: 0n },
                hookName: 'name.function',
            },
            tokenAmount: 100n,
        },
        TEST_BLOCK
    );
    expect(resultContractReceiver.tag).toEqual('failure'); // TODO: change to 'success' when the parameter given to invocation above is fixed.
});

test('dryRun.updateOperator', async () => {
    const cis2 = await getCIS2Single();
    const result = await cis2.dryRun.updateOperator(
        TEST_ACCOUNT,
        {
            type: 'add',
            address: '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB',
        },
        TEST_BLOCK
    );
    expect(result.usedEnergy).toEqual(2735n);
    // Results in 1 transfer event
    expect(
        result.tag === 'success' &&
            result.events[0].tag === TransactionEventTag.Updated &&
            result.events[0].events.length
    ).toEqual(1);

    const resultMulti = await cis2.dryRun.updateOperator(
        TEST_ACCOUNT,
        [
            {
                type: 'add',
                address: '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB',
            },
            {
                type: 'remove',
                address: { index: 3494n, subindex: 0n },
            },
        ],
        TEST_BLOCK
    );

    expect(resultMulti.usedEnergy).toEqual(2960n);
    // Results in 2 transfer events
    expect(
        resultMulti.tag === 'success' &&
            resultMulti.events[0].tag === TransactionEventTag.Updated &&
            resultMulti.events[0].events.length
    ).toEqual(2);
});

test('transfer', async () => {
    const cis2 = await getCIS2Single();
    cis2.transfer(
        { energy: 1000000n },
        {
            tokenId: '',
            to: '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB',
            from: TEST_ACCOUNT,
            tokenAmount: 100n,
        },
        ({ type, parameter, payload }) => {
            const expectedParameterHex =
                '0100006400c8d4bb7106a96bfa6f069438270bf9748049c24798b13b08f88fc2f46afb435f0087e3bec61b8db2fb7389b57d2be4f7dd95d1088dfeb6ef7352c13d2b2d27bb490000';
            // Gives the correct transaction type
            expect(type).toEqual(AccountTransactionType.Update);

            // Parameter is formatted and serialized as expected
            expect(parameter.hex).toEqual(expectedParameterHex);
            expect(parameter.json).toEqual([
                {
                    token_id: '',
                    amount: '100',
                    from: { Account: [TEST_ACCOUNT] },
                    to: {
                        Account: [
                            '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB',
                        ],
                    },
                    data: '',
                },
            ]);

            // Checks that payload contains the expected values
            expect(payload.amount.microCcdAmount).toEqual(0n);
            expect(payload.address).toEqual({ index: 3496n, subindex: 0n });
            expect(payload.message.toString('hex')).toEqual(
                expectedParameterHex
            );
            expect(payload.receiveName).toEqual('cis2-bridgeable.transfer');
            expect(payload.maxContractExecutionEnergy).toEqual(1000000n);
        }
    );

    cis2.transfer(
        { energy: 1000000n },
        [
            {
                tokenId: '',
                to: '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB',
                from: TEST_ACCOUNT,
                tokenAmount: 100n,
            },
            {
                tokenId: '',
                to: '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB',
                from: TEST_ACCOUNT,
                tokenAmount: 100n,
            },
        ],
        ({ parameter }) => {
            const expectedParameterHex =
                '0200006400c8d4bb7106a96bfa6f069438270bf9748049c24798b13b08f88fc2f46afb435f0087e3bec61b8db2fb7389b57d2be4f7dd95d1088dfeb6ef7352c13d2b2d27bb490000006400c8d4bb7106a96bfa6f069438270bf9748049c24798b13b08f88fc2f46afb435f0087e3bec61b8db2fb7389b57d2be4f7dd95d1088dfeb6ef7352c13d2b2d27bb490000';
            // Parameter is formatted and serialized as expected
            expect(parameter.hex).toEqual(expectedParameterHex);
            expect(parameter.json).toEqual([
                {
                    token_id: '',
                    amount: '100',
                    from: { Account: [TEST_ACCOUNT] },
                    to: {
                        Account: [
                            '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB',
                        ],
                    },
                    data: '',
                },
                {
                    token_id: '',
                    amount: '100',
                    from: { Account: [TEST_ACCOUNT] },
                    to: {
                        Account: [
                            '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB',
                        ],
                    },
                    data: '',
                },
            ]);
        }
    );
});

test('updateOperator', async () => {
    const cis2 = await getCIS2Single();
    cis2.updateOperator(
        { energy: 1000000n },
        {
            type: 'add',
            address: '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB',
        },
        ({ type, parameter, payload }) => {
            const expectedParameterHex =
                '0100010087e3bec61b8db2fb7389b57d2be4f7dd95d1088dfeb6ef7352c13d2b2d27bb49';
            // Gives the correct transaction type
            expect(type).toEqual(AccountTransactionType.Update);

            // Parameter is formatted and serialized as expected
            expect(parameter.hex).toEqual(expectedParameterHex);
            expect(parameter.json).toEqual([
                {
                    update: { Add: {} },
                    operator: {
                        Account: [
                            '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB',
                        ],
                    },
                },
            ]);

            // Checks that payload contains the expected values
            expect(payload.amount.microCcdAmount).toEqual(0n);
            expect(payload.address).toEqual({ index: 3496n, subindex: 0n });
            expect(payload.message.toString('hex')).toEqual(
                expectedParameterHex
            );
            expect(payload.receiveName).toEqual(
                'cis2-bridgeable.updateOperator'
            );
            expect(payload.maxContractExecutionEnergy).toEqual(1000000n);
        }
    );

    cis2.updateOperator(
        { energy: 1000000n },
        [
            {
                type: 'add',
                address: '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB',
            },
            {
                type: 'remove',
                address: { index: 3494n, subindex: 0n },
            },
        ],
        ({ parameter }) => {
            const expectedParameterHex =
                '0200010087e3bec61b8db2fb7389b57d2be4f7dd95d1088dfeb6ef7352c13d2b2d27bb490001a60d0000000000000000000000000000';
            // Parameter is formatted and serialized as expected
            expect(parameter.hex).toEqual(expectedParameterHex);
            expect(parameter.json).toEqual([
                {
                    update: { Add: {} },
                    operator: {
                        Account: [
                            '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB',
                        ],
                    },
                },
                {
                    update: { Remove: {} },
                    operator: {
                        Contract: [{ index: 3494, subindex: 0 }],
                    },
                },
            ]);
        }
    );
});
