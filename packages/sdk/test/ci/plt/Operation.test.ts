import JSONBig from 'json-bigint';

import { Cursor } from '../../../src/deserializationHelpers.ts';
import {
    Cbor,
    CborAccountAddress,
    CborEpoch,
    LockConfig,
    LockCreateConfig,
    LockId,
    LockMetadata,
    OperationInput,
    OperationType,
    TokenAdminRole,
    TokenAmount,
    TokenId,
    TokenOperationType,
    createTokenOperationWithId,
    createTokenUpdateInput,
    createTokenUpdatePayload,
    decodeOperation,
    decodeOperations,
    encodeOperations,
    parseTokenUpdatePayload,
} from '../../../src/pub/plt.ts';
import {
    AccountAddress,
    AccountTransactionType,
    Energy,
    TokenUpdateHandler,
    TransactionKindString,
    serializeAccountTransactionPayload,
} from '../../../src/pub/types.ts';
import { Payload } from '../../../src/transactions/index.ts';

const jsonBig = JSONBig({ useNativeBigInt: true });

describe('PLT Operation', () => {
    const token = TokenId.fromString('tToken');
    const amount = TokenAmount.create(500n, 2);
    const lock = LockId.create(1n, 2n, 3n);
    const account = CborAccountAddress.fromAccountAddress(AccountAddress.fromBuffer(new Uint8Array(32).fill(0x15)));
    const lockConfig = LockCreateConfig.simpleV0(
        [account],
        [account],
        CborEpoch.fromEpochSeconds(10n),
        [{ account, roles: [LockCreateConfig.SimpleV0Capability.Send] }],
        [token]
    );
    const metadataChecksum = new Uint8Array(32).fill(1);

    const encodingFixtures = [
        [
            'transfer',
            createTokenOperationWithId(token, { [TokenOperationType.Transfer]: { amount, recipient: account } }),
            '81a16d746f6b656e5472616e73666572a365746f6b656e6674546f6b656e66616d6f756e74c482211901f469726563697069656e74d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515',
        ],
        [
            'mint',
            createTokenOperationWithId(token, { [TokenOperationType.Mint]: { amount } }),
            '81a169746f6b656e4d696e74a265746f6b656e6674546f6b656e66616d6f756e74c482211901f4',
        ],
        [
            'burn',
            createTokenOperationWithId(token, { [TokenOperationType.Burn]: { amount } }),
            '81a169746f6b656e4275726ea265746f6b656e6674546f6b656e66616d6f756e74c482211901f4',
        ],
        [
            'addAllowList',
            createTokenOperationWithId(token, { [TokenOperationType.AddAllowList]: { target: account } }),
            '81a171746f6b656e416464416c6c6f774c697374a265746f6b656e6674546f6b656e66746172676574d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515',
        ],
        [
            'removeAllowList',
            createTokenOperationWithId(token, { [TokenOperationType.RemoveAllowList]: { target: account } }),
            '81a174746f6b656e52656d6f7665416c6c6f774c697374a265746f6b656e6674546f6b656e66746172676574d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515',
        ],
        [
            'addDenyList',
            createTokenOperationWithId(token, { [TokenOperationType.AddDenyList]: { target: account } }),
            '81a170746f6b656e41646444656e794c697374a265746f6b656e6674546f6b656e66746172676574d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515',
        ],
        [
            'removeDenyList',
            createTokenOperationWithId(token, { [TokenOperationType.RemoveDenyList]: { target: account } }),
            '81a173746f6b656e52656d6f766544656e794c697374a265746f6b656e6674546f6b656e66746172676574d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515',
        ],
        [
            'pause',
            createTokenOperationWithId(token, { [TokenOperationType.Pause]: {} }),
            '81a16a746f6b656e5061757365a165746f6b656e6674546f6b656e',
        ],
        [
            'unpause',
            createTokenOperationWithId(token, { [TokenOperationType.Unpause]: {} }),
            '81a16c746f6b656e556e7061757365a165746f6b656e6674546f6b656e',
        ],
        [
            'updateMetadata',
            createTokenOperationWithId(token, {
                [TokenOperationType.UpdateMetadata]: {
                    url: 'https://example.com/token-metadata.json',
                    checksumSha256: metadataChecksum,
                },
            }),
            '81a173746f6b656e5570646174654d65746164617461a36375726c782768747470733a2f2f6578616d706c652e636f6d2f746f6b656e2d6d657461646174612e6a736f6e65746f6b656e6674546f6b656e6e636865636b73756d53686132353658200101010101010101010101010101010101010101010101010101010101010101',
        ],
        [
            'assignAdminRoles',
            createTokenOperationWithId(token, {
                [TokenOperationType.AssignAdminRoles]: { roles: [TokenAdminRole.UpdateAdminRoles], account },
            }),
            '81a175746f6b656e41737369676e41646d696e526f6c6573a365726f6c6573817075706461746541646d696e526f6c657365746f6b656e6674546f6b656e676163636f756e74d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515',
        ],
        [
            'revokeAdminRoles',
            createTokenOperationWithId(token, {
                [TokenOperationType.RevokeAdminRoles]: { roles: [TokenAdminRole.UpdateAdminRoles], account },
            }),
            '81a175746f6b656e5265766f6b6541646d696e526f6c6573a365726f6c6573817075706461746541646d696e526f6c657365746f6b656e6674546f6b656e676163636f756e74d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515',
        ],
        [
            'lockCreate',
            { [OperationType.LockCreate]: lockConfig },
            '81a16a6c6f636b437265617465a16873696d706c655630a565726f6c657381a265726f6c6573816473656e64676163636f756e74d99d73a201d99d71a101190397035820151515151515151515151515151515151515151515151515151515151515151566657870697279c10a66746f6b656e73816674546f6b656e67686f6c6465727381d99d73a201d99d71a10119039703582015151515151515151515151515151515151515151515151515151515151515156a726563697069656e747381d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515',
        ],
        [
            'lockCancel',
            { [OperationType.LockCancel]: { lock, memo: new Uint8Array([9]) } },
            '81a16a6c6f636b43616e63656ca2646c6f636bd99fd883010203646d656d6f4109',
        ],
        [
            'lockFund',
            { [OperationType.LockFund]: { token, lock, amount, memo: new Uint8Array([9]) } },
            '81a1686c6f636b46756e64a4646c6f636bd99fd883010203646d656d6f410965746f6b656e6674546f6b656e66616d6f756e74c482211901f4',
        ],
        [
            'lockSend',
            { [OperationType.LockSend]: { token, lock, source: account, amount, recipient: account } },
            '81a1686c6f636b53656e64a5646c6f636bd99fd88301020365746f6b656e6674546f6b656e66616d6f756e74c482211901f466736f75726365d99d73a201d99d71a101190397035820151515151515151515151515151515151515151515151515151515151515151569726563697069656e74d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515',
        ],
        [
            'lockRelease',
            { [OperationType.LockRelease]: { token, lock, source: account, amount } },
            '81a16b6c6f636b52656c65617365a4646c6f636bd99fd88301020365746f6b656e6674546f6b656e66616d6f756e74c482211901f466736f75726365d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515',
        ],
    ] as const;

    it.each(encodingFixtures)('encodes %s unscoped token update operation', (_name, operation, expected) => {
        expect(encodeOperations(operation).toString()).toBe(expected);
        expect(decodeOperations(Cbor.fromHexString(expected))).toEqual([operation]);
    });

    it.each(encodingFixtures)(
        'strips construction-only fields from %s in both encoders',
        (_name, operation, expected) => {
            const [key] = Object.keys(operation);
            const enriched = {
                [key]: { ...Object.values(operation)[0], balanceReferences: 2n, extra: true },
            } as OperationInput;
            expect(encodeOperations(enriched).toString()).toBe(expected);
            expect(createTokenUpdateInput({ operations: enriched }).operations.toString()).toBe(expected);
        }
    );

    it('encodes lockCreate metadata as raw CBOR bytes', () => {
        const metadata = LockMetadata.encode({ name: 'Metadata lock', issuer: 'Concordium' });
        const operations = encodeOperations({
            [OperationType.LockCreate]: { simpleV0: { ...lockConfig.simpleV0, metadata } },
        });

        expect(decodeOperations(operations)).toEqual([
            { lockCreate: { simpleV0: { ...lockConfig.simpleV0, metadata } } },
        ]);
    });

    it('encodes lockCreate and lockCancel unscoped operations', () => {
        const operations = encodeOperations([
            { [OperationType.LockCreate]: lockConfig },
            { [OperationType.LockCancel]: { lock, memo: new Uint8Array([9]) } },
        ]);

        expect(operations.toString()).toContain('6a6c6f636b437265617465');
        expect(operations.toString()).toContain('6a6c6f636b43616e63656c');
        expect(operations.toString()).toContain('d99fd883010203');
    });

    it('encodes token-scoped lock operations', () => {
        const operations = encodeOperations([
            { [OperationType.LockFund]: { token, lock, amount, memo: new Uint8Array([9]) } },
            { [OperationType.LockSend]: { token, lock, source: account, amount, recipient: account } },
            { [OperationType.LockRelease]: { token, lock, source: account, amount } },
        ]);

        expect(operations.toString()).toBe(
            '83a1686c6f636b46756e64a4646c6f636bd99fd883010203646d656d6f410965746f6b656e6674546f6b656e66616d6f756e74c482211901f4a1686c6f636b53656e64a5646c6f636bd99fd88301020365746f6b656e6674546f6b656e66616d6f756e74c482211901f466736f75726365d99d73a201d99d71a101190397035820151515151515151515151515151515151515151515151515151515151515151569726563697069656e74d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515a16b6c6f636b52656c65617365a4646c6f636bd99fd88301020365746f6b656e6674546f6b656e66616d6f756e74c482211901f466736f75726365d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515'
        );
    });

    it('encodes token operations in Unscoped TokenUpdate context with explicit token ids', () => {
        const operation = createTokenOperationWithId(token, {
            [TokenOperationType.Transfer]: {
                amount,
                recipient: account,
            },
        });

        expect(encodeOperations(operation).toString()).toBe(
            '81a16d746f6b656e5472616e73666572a365746f6b656e6674546f6b656e66616d6f756e74c482211901f469726563697069656e74d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515'
        );
    });

    it('serializes and deserializes Unscoped TokenUpdate payloads', () => {
        const payload = createTokenUpdatePayload({
            operations: { [OperationType.LockCancel]: { lock } },
        });
        const serialized = serializeAccountTransactionPayload({ type: AccountTransactionType.TokenUpdate, payload });

        expect(serialized.toString('hex')).toBe('1b000000001a81a16a6c6f636b43616e63656ca1646c6f636bd99fd883010203');

        const deserialized = new TokenUpdateHandler().deserialize(Cursor.fromBuffer(serialized.slice(1)));
        expect(deserialized).toEqual(payload);
    });

    it('supports Payload helpers and JSON roundtrips for Unscoped TokenUpdate', () => {
        const payload = Payload.tokenUpdate(
            createTokenUpdatePayload({ operations: { [OperationType.LockCancel]: { lock } } })
        );
        const serialized = Payload.serialize(payload);
        expect(Payload.deserialize(serialized)).toEqual(payload);

        const json = Payload.toJSON(payload);
        expect(json).toEqual({
            type: TransactionKindString.TokenUpdate,
            variant: 'unscoped',
            operations: '81a16a6c6f636b43616e63656ca1646c6f636bd99fd883010203',
        });

        const jsonString = jsonBig.stringify(json);
        expect(Payload.fromJSON(jsonBig.parse(jsonString))).toEqual(payload);
    });

    it('adds operation costs for Unscoped TokenUpdate operations', () => {
        const payload = createTokenUpdateInput({
            operations: [
                createTokenOperationWithId(token, {
                    [TokenOperationType.Transfer]: {
                        amount,
                        recipient: account,
                    },
                }),
                { [OperationType.LockCreate]: lockConfig },
                { [OperationType.LockCancel]: { lock, balanceReferences: 3n } },
                { [OperationType.LockFund]: { token, lock, amount } },
                { [OperationType.LockSend]: { token, lock, source: account, amount, recipient: account } },
                { [OperationType.LockRelease]: { token, lock, source: account, amount } },
            ],
        });

        expect(new TokenUpdateHandler().getBaseEnergyCost(payload)).toBe(3360n);
    });

    it('calculates independent cancellation supplements and keeps their wire bytes unchanged', () => {
        const operations = [0n, 2n, 3n].map((balanceReferences) => ({ lockCancel: { lock, balanceReferences } }));
        const input = createTokenUpdateInput({ operations });
        expect(input.additionalEnergy.value).toBe(2500n);
        expect(Object.keys(input).sort()).toEqual(['additionalEnergy', 'operations', 'variant']);
        expect(new TokenUpdateHandler().getBaseEnergyCost(input)).toBe(3100n);
        for (const operation of operations) {
            const cancellation = createTokenUpdateInput({ operations: operation });
            expect(new TokenUpdateHandler().getBaseEnergyCost(cancellation)).toBe(
                400n + 500n * operation.lockCancel.balanceReferences
            );
            expect(createTokenUpdateInput({ operations: operation }).operations).toEqual(
                encodeOperations({ lockCancel: { lock } })
            );
        }
        expect(() => createTokenUpdateInput({ operations: { lockCancel: { lock, balanceReferences: -1n } } })).toThrow(
            /balanceReferences/
        );
    });

    describe('lock creation input compatibility', () => {
        // The inner simpleV0 bytes are the fixed concordium-base lock_config.rs creation fixture.
        const fixture =
            '81a16a6c6f636b437265617465a16873696d706c655630a565726f6c657381a265726f6c6573816473656e64676163636f756e74d99d73a201d99d71a1011903970358200102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f2066657870697279c11a6b93277066746f6b656e738162745467686f6c6465727381d99d73a201d99d71a1011903970358200102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f206a726563697069656e747363616e79';
        const holder = CborAccountAddress.fromAccountAddress(
            AccountAddress.fromBuffer(Uint8Array.from({ length: 32 }, (_, i) => i + 1))
        );
        const creation = {
            simpleV0: {
                recipients: 'any' as const,
                holders: [holder],
                expiry: CborEpoch.fromEpochSeconds(1804806000n),
                roles: [{ account: holder, roles: [LockCreateConfig.SimpleV0Capability.Send] }],
                tokens: [TokenId.fromString('tT')],
            },
        };
        const operation = { lockCreate: creation };

        it('decodes the pinned Rust creation fixture through the public operation codec', () => {
            expect(decodeOperations(Cbor.fromHexString(fixture))).toMatchObject([operation]);
        });

        it('encodes the pinned Rust creation fixture through the public operation codec', () => {
            expect(encodeOperations(operation).toString()).toBe(fixture);
        });

        it('round-trips opaque metadata bytes', () => {
            const metadata = Uint8Array.from([0xff, 0x00, 0x81]);
            const withMetadata = { lockCreate: { simpleV0: { ...creation.simpleV0, metadata } } };
            const encoded = encodeOperations(withMetadata);
            expect(decodeOperations(encoded)).toMatchObject([withMetadata]);
        });

        it('rejects legacy grants on decoding', () => {
            const legacy = LockConfig.simpleV0('any', creation.simpleV0.expiry, [], [TokenId.fromString('tT')]);
            expect(() => decodeOperation(Cbor.encode({ lockCreate: legacy }))).toThrow(/grants/);
        });

        it('ignores a configuration memo on decoding', () => {
            const simpleV0 = { ...creation.simpleV0, tokens: ['tT'], memo: new Uint8Array([1]) };
            expect(decodeOperation(Cbor.encode({ lockCreate: { simpleV0 } }))).toMatchObject(operation);
            expect(decodeOperation(Cbor.encode({ lockCreate: { simpleV0 } }))).not.toHaveProperty(
                'lockCreate.simpleV0.memo'
            );
        });

        it('rejects an unknown explicit capability on decoding', () => {
            const simpleV0 = {
                ...creation.simpleV0,
                tokens: ['tT'],
                roles: [{ account: holder, roles: ['unknown'] }],
            };
            expect(() => decodeOperation(Cbor.encode({ lockCreate: { simpleV0 } }))).toThrow(/capabilities/);
        });

        it('prices distinct aliased holders, role accounts and case-insensitive tokens', () => {
            const alias = CborAccountAddress.fromAccountAddress(AccountAddress.getAlias(holder.address, 1));
            const other = CborAccountAddress.fromAccountAddress(AccountAddress.fromBuffer(new Uint8Array(32).fill(7)));
            const recipient = CborAccountAddress.fromAccountAddress(
                AccountAddress.fromBuffer(new Uint8Array(32).fill(8))
            );
            const simpleV0 = {
                ...creation.simpleV0,
                holders: [holder, alias],
                roles: [
                    { account: alias, roles: [LockCreateConfig.SimpleV0Capability.Send] },
                    { account: other, roles: [LockCreateConfig.SimpleV0Capability.Cancel] },
                ],
                recipients: [recipient],
                tokens: [TokenId.fromString('ABC'), TokenId.fromString('abc')],
            };
            const input = createTokenUpdateInput({
                operations: { lockCreate: { simpleV0 } },
            });
            expect(new TokenUpdateHandler().getBaseEnergyCost(input)).toBe(300n + 620n);
        });
    });

    it('does not change TokenUpdate transaction type value', () => {
        expect(AccountTransactionType.TokenUpdate).toBe(27);
    });
    it('constructs an atomic multi-token payload and parses the unscoped variant', () => {
        const operations = [
            createTokenOperationWithId(token, { mint: { amount } }),
            createTokenOperationWithId(TokenId.fromString('OTHER'), { burn: { amount } }),
            { lockCancel: { lock } },
        ];
        const payload = createTokenUpdatePayload({ operations: operations });
        expect(payload.variant).toBe('unscoped');
        expect(parseTokenUpdatePayload(payload).operations).toEqual(operations);
        expect(Payload.deserialize(Payload.serialize(Payload.tokenUpdate(payload)))).toEqual(
            Payload.tokenUpdate(payload)
        );
    });

    it('preserves unknown operations and rejects malformed known operation bodies', () => {
        const future = { futureOperation: { flag: true } };
        expect(decodeOperation(Cbor.encode(future))).toEqual(future);
        expect(
            new TokenUpdateHandler().getBaseEnergyCost({
                variant: 'unscoped',
                additionalEnergy: Energy.create(0n),
                operations: Cbor.encode([{ token: {} }]),
            })
        ).toBe(300n);
        expect(() => decodeOperations(Cbor.encode({ tokenMint: {} }))).toThrow();
        expect(() => decodeOperation(Cbor.encode({ tokenMint: { amount } }))).toThrow(/token/);
        expect(() => decodeOperation(Cbor.encode({ lockFund: { lock, amount } }))).toThrow(/token/);
        expect(() => decodeOperation(Cbor.encode({ lockSend: { token, lock, amount } }))).toThrow(/source/);
        expect(() => decodeOperation(Cbor.encode({ lockRelease: { token, lock, amount } }))).toThrow(/source/);
        expect(() => decodeOperation(Cbor.encode({ lockCreate: {} }))).toThrow(/lock config/);
        expect(() => decodeOperation(Cbor.encode({ tokenMint: {}, tokenBurn: {} }))).toThrow(/single-key/);
    });

    it('restricts metadata updates without changing generic metadata encoding', () => {
        const details = { url: 'https://example.com', extra: true };
        expect(
            Cbor.decode(
                createTokenUpdatePayload({ tokenId: token, operations: { updateMetadata: details } }).operations
            )
        ).toEqual([{ updateMetadata: { url: details.url } }]);
        expect(createTokenOperationWithId(token, { updateMetadata: details })).toEqual({
            tokenUpdateMetadata: { token, url: details.url },
        });
        expect(decodeOperation(Cbor.encode({ tokenUpdateMetadata: { token, ...details } }))).toEqual({
            tokenUpdateMetadata: { token, url: details.url },
        });
        expect(() =>
            decodeOperation(
                Cbor.encode({ tokenUpdateMetadata: { token, url: 'x', checksumSha256: new Uint8Array(1) } })
            )
        ).toThrow(/checksum/);
    });

    it('supports empty operations with the empty-ID envelope and base energy cost', () => {
        const payload = createTokenUpdateInput({ operations: [] });
        expect(Payload.serialize(Payload.tokenUpdate(payload))).toEqual(
            Uint8Array.from(Buffer.from('1b000000000180', 'hex'))
        );
        expect(new TokenUpdateHandler().getBaseEnergyCost(payload)).toBe(300n);
        expect(parseTokenUpdatePayload(payload).operations).toEqual([]);
    });
});
