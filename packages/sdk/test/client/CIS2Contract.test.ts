import {
    AccountAddress,
    AccountTransactionType,
    BlockHash,
    ContractAddress,
    Energy,
    EntrypointName,
    Parameter,
    ReceiveName,
    TransactionEventTag,
    CIS2Contract,
    serializeTypeValue,
} from '../../src/index.js';
import { getNodeClientV2 as getNodeClient } from './testHelpers.js';

const CIS2_FT_ADDRESS = ContractAddress.create(3496);
const CIS2_NFT_ADDRESS = ContractAddress.create(1696);

const TEST_BLOCK = BlockHash.fromHexString(
    '3e9d90325c61ab190065f3c90364beeb925833319de68d982ec6da7762e8357b'
);
const TEST_ACCOUNT = AccountAddress.fromBase58(
    '4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd'
);

const getCIS2Single = () =>
    CIS2Contract.create(getNodeClient(), CIS2_FT_ADDRESS);
const getCIS2Multi = () =>
    CIS2Contract.create(getNodeClient(), CIS2_NFT_ADDRESS);

test('create throws on non cis-2', async () => {
    const promise = CIS2Contract.create(
        getNodeClient(),
        ContractAddress.create(3494)
    );
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
        { owner: TEST_ACCOUNT, address: ContractAddress.create(3494) },
        TEST_BLOCK
    );
    expect(isOperator).toEqual(true);

    const cis2Multi = await getCIS2Multi();
    const isOperatorList = await cis2Multi.operatorOf(
        [
            {
                owner: TEST_ACCOUNT,
                address: AccountAddress.fromBase58(
                    '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB'
                ),
            },
            { owner: TEST_ACCOUNT, address: ContractAddress.create(3494) },
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
            tokenAmount: 1800n,
        },
        TEST_BLOCK
    );
    expect(result.usedEnergy.value).toBe(2803n);
    // Results in 1 transfer event
    expect(
        result.tag === 'success' &&
            result.events[0].tag === TransactionEventTag.Updated &&
            result.events[0].events.length
    ).toBe(1);

    const resultMulti = await cis2.dryRun.transfer(
        TEST_ACCOUNT,
        [
            {
                tokenId: '',
                from: TEST_ACCOUNT,
                to: AccountAddress.fromBase58(
                    '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB'
                ),
                tokenAmount: 100n,
            },
            {
                tokenId: '',
                from: TEST_ACCOUNT,
                to: AccountAddress.fromBase58(
                    '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe'
                ),
                tokenAmount: 120n,
            },
        ],
        TEST_BLOCK
    );

    expect(resultMulti.usedEnergy.value).toBe(3278n);
    // Results in 2 transfer events
    expect(
        resultMulti.tag === 'success' &&
            resultMulti.events[0].tag === TransactionEventTag.Updated &&
            resultMulti.events[0].events.length
    ).toBe(2);

    const resultContractReceiver = await cis2.dryRun.transfer(
        TEST_ACCOUNT,
        {
            tokenId: '',
            from: TEST_ACCOUNT,
            to: {
                address: ContractAddress.create(4416),
                hookName: EntrypointName.fromStringUnchecked('onReceivingCIS2'),
            },
            tokenAmount: 0n,
        },
        BlockHash.fromHexString(
            'a03ca5112f2bf38bbb4f4d524432ff3a060226d823a3a868aa23b7d0d628e112'
        )
    );
    expect(resultContractReceiver.tag).toBe('success');
});

describe('createTransfer', () => {
    test('single update', async () => {
        const cis2 = await getCIS2Single();
        const { type, parameter, payload } = cis2.createTransfer(
            { energy: Energy.create(1000000) },
            {
                tokenId: '',
                to: AccountAddress.fromBase58(
                    '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB'
                ),
                from: TEST_ACCOUNT,
                tokenAmount: 100n,
            }
        );

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
                from: { Account: [AccountAddress.toBase58(TEST_ACCOUNT)] },
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
        expect(
            ContractAddress.equals(
                payload.address,
                ContractAddress.create(3496)
            )
        ).toBeTruthy();
        expect(Parameter.toHexString(payload.message)).toEqual(
            expectedParameterHex
        );
        expect(payload.receiveName).toEqual(
            ReceiveName.fromStringUnchecked('cis2-bridgeable.transfer')
        );
        expect(payload.maxContractExecutionEnergy.value).toEqual(1000000n);
    });

    test('multiple transfers', async () => {
        const cis2 = await getCIS2Single();
        const { parameter, schema } = cis2.createTransfer(
            { energy: Energy.create(10000) },
            [
                {
                    tokenId: '',
                    to: AccountAddress.fromBase58(
                        '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB'
                    ),
                    from: TEST_ACCOUNT,
                    tokenAmount: 100n,
                },
                {
                    tokenId: '',
                    from: TEST_ACCOUNT,
                    to: {
                        address: ContractAddress.create(4416),
                        hookName:
                            EntrypointName.fromStringUnchecked(
                                'onReceivingCIS2'
                            ),
                    },
                    tokenAmount: 0n,
                },
            ]
        );
        const expectedParameterHex =
            '0200006400c8d4bb7106a96bfa6f069438270bf9748049c24798b13b08f88fc2f46afb435f0087e3bec61b8db2fb7389b57d2be4f7dd95d1088dfeb6ef7352c13d2b2d27bb490000000000c8d4bb7106a96bfa6f069438270bf9748049c24798b13b08f88fc2f46afb435f01401100000000000000000000000000000f006f6e526563656976696e67434953320000';
        // Parameter is formatted and serialized as expected
        expect(parameter.hex).toEqual(expectedParameterHex);
        expect(parameter.json).toEqual([
            {
                token_id: '',
                amount: '100',
                from: { Account: [AccountAddress.toBase58(TEST_ACCOUNT)] },
                to: {
                    Account: [
                        '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB',
                    ],
                },
                data: '',
            },
            {
                token_id: '',
                amount: '0',
                from: { Account: [AccountAddress.toBase58(TEST_ACCOUNT)] },
                to: {
                    Contract: [{ index: 4416, subindex: 0 }, 'onReceivingCIS2'],
                },
                data: '',
            },
        ]);
        const schemaSerialized = serializeTypeValue(
            parameter.json,
            Buffer.from(schema.value, 'base64')
        );
        expect(Parameter.toHexString(schemaSerialized)).toEqual(
            expectedParameterHex
        );
    });
});

test('dryRun.updateOperator', async () => {
    const cis2 = await getCIS2Single();
    const result = await cis2.dryRun.updateOperator(
        TEST_ACCOUNT,
        {
            type: 'add',
            address: AccountAddress.fromBase58(
                '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB'
            ),
        },
        TEST_BLOCK
    );
    expect(result.usedEnergy.value).toEqual(2735n);
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
                address: AccountAddress.fromBase58(
                    '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB'
                ),
            },
            {
                type: 'remove',
                address: ContractAddress.create(3494),
            },
        ],
        TEST_BLOCK
    );

    expect(resultMulti.usedEnergy.value).toEqual(2960n);
    // Results in 2 transfer events
    expect(
        resultMulti.tag === 'success' &&
            resultMulti.events[0].tag === TransactionEventTag.Updated &&
            resultMulti.events[0].events.length
    ).toEqual(2);
});

describe('createUpdateOperator', () => {
    test('single update', async () => {
        const cis2 = await getCIS2Single();
        const { type, parameter, payload } = cis2.createUpdateOperator(
            { energy: Energy.create(1000000) },
            {
                type: 'add',
                address: AccountAddress.fromBase58(
                    '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB'
                ),
            }
        );

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
        expect(payload.address).toEqual(ContractAddress.create(3496));
        expect(Parameter.toHexString(payload.message)).toEqual(
            expectedParameterHex
        );
        expect(payload.receiveName.value).toEqual(
            'cis2-bridgeable.updateOperator'
        );
        expect(payload.maxContractExecutionEnergy.value).toEqual(1000000n);
    });

    test('multiple updates', async () => {
        const cis2 = await getCIS2Single();
        const { parameter } = cis2.createUpdateOperator(
            { energy: Energy.create(1000000) },
            [
                {
                    type: 'add',
                    address: AccountAddress.fromBase58(
                        '3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB'
                    ),
                },
                {
                    type: 'remove',
                    address: ContractAddress.create(3494),
                },
            ]
        );
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
    });
});
