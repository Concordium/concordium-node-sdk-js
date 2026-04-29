import JSONBig from 'json-bigint';

import { Cursor } from '../../../src/deserializationHelpers.ts';
import {
    CborAccountAddress,
    LockConfig,
    LockController,
    LockId,
    TokenAmount,
    TokenId,
    TokenOperationType,
    createMetaTokenOperation,
    createMetaUpdatePayload,
    encodeMetaUpdateOperations,
} from '../../../src/pub/plt.ts';
import {
    AccountAddress,
    AccountTransactionType,
    MetaUpdateHandler,
    TransactionExpiry,
    TransactionKindString,
    serializeAccountTransactionPayload,
} from '../../../src/pub/types.ts';
import { Payload } from '../../../src/transactions/index.ts';

const jsonBig = JSONBig({ useNativeBigInt: true });

describe('PLT MetaUpdateOperation', () => {
    const token = TokenId.fromString('tToken');
    const amount = TokenAmount.create(500n, 2);
    const lock = LockId.create(1n, 2n, 3n);
    const account = CborAccountAddress.fromAccountAddress(AccountAddress.fromBuffer(new Uint8Array(32).fill(0x15)));
    const lockConfig = LockConfig.create(
        [account],
        TransactionExpiry.fromEpochSeconds(10n),
        LockController.simpleV0(
            [
                {
                    account,
                    roles: [LockController.SimpleV0Capability.Fund, LockController.SimpleV0Capability.Send],
                },
            ],
            [token]
        )
    );

    it('encodes lockCreate and lockCancel meta operations', () => {
        const operations = encodeMetaUpdateOperations([
            { lockCreate: lockConfig },
            { lockCancel: { lock, memo: new Uint8Array([9]) } },
        ]);

        expect(operations.toString()).toContain('6a6c6f636b437265617465');
        expect(operations.toString()).toContain('6a6c6f636b43616e63656c');
        expect(operations.toString()).toContain('d99fd883010203');
    });

    it('encodes token-scoped lock operations', () => {
        const operations = encodeMetaUpdateOperations([
            { lockFund: { token, lock, amount, memo: new Uint8Array([9]) } },
            { lockSend: { token, lock, source: account, amount, recipient: account } },
            { lockReturn: { token, lock, source: account, amount } },
        ]);

        expect(operations.toString()).toBe(
            '83a1686c6f636b46756e64a4646c6f636bd99fd883010203646d656d6f410965746f6b656e6674546f6b656e66616d6f756e74c482211901f4a1686c6f636b53656e64a5646c6f636bd99fd88301020365746f6b656e6674546f6b656e66616d6f756e74c482211901f466736f75726365d99d73a201d99d71a101190397035820151515151515151515151515151515151515151515151515151515151515151569726563697069656e74d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515a16a6c6f636b52657475726ea4646c6f636bd99fd88301020365746f6b656e6674546f6b656e66616d6f756e74c482211901f466736f75726365d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515'
        );
    });

    it('encodes token operations in MetaUpdate context with explicit token ids', () => {
        const operation = createMetaTokenOperation(token, {
            [TokenOperationType.Transfer]: {
                amount,
                recipient: account,
            },
        });

        expect(encodeMetaUpdateOperations(operation).toString()).toBe(
            '81a1687472616e73666572a365746f6b656e6674546f6b656e66616d6f756e74c482211901f469726563697069656e74d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515'
        );
    });

    it('serializes and deserializes MetaUpdate payloads', () => {
        const payload = createMetaUpdatePayload({ lockCancel: { lock } });
        const serialized = serializeAccountTransactionPayload({ type: AccountTransactionType.MetaUpdate, payload });

        expect(serialized.toString('hex')).toBe('1c0000001a81a16a6c6f636b43616e63656ca1646c6f636bd99fd883010203');

        const deserialized = new MetaUpdateHandler().deserialize(Cursor.fromBuffer(serialized.slice(1)));
        expect(deserialized).toEqual(payload);
    });

    it('supports Payload helpers and JSON roundtrips for MetaUpdate', () => {
        const payload = Payload.metaUpdate(createMetaUpdatePayload({ lockCancel: { lock } }));
        const serialized = Payload.serialize(payload);
        expect(Payload.deserialize(serialized)).toEqual(payload);

        const json = Payload.toJSON(payload);
        expect(json).toEqual({
            type: TransactionKindString.MetaUpdate,
            operations: '81a16a6c6f636b43616e63656ca1646c6f636bd99fd883010203',
        });

        const jsonString = jsonBig.stringify(json);
        expect(Payload.fromJSON(jsonBig.parse(jsonString))).toEqual(payload);
    });

    it('adds operation costs for MetaUpdate operations', () => {
        const payload = createMetaUpdatePayload([
            createMetaTokenOperation(token, {
                [TokenOperationType.Transfer]: {
                    amount,
                    recipient: account,
                },
            }),
            { lockFund: { token, lock, amount } },
            { lockSend: { token, lock, source: account, amount, recipient: account } },
            { lockReturn: { token, lock, source: account, amount } },
        ]);

        expect(new MetaUpdateHandler().getBaseEnergyCost(payload)).toBe(700n);
    });

    it('does not change TokenUpdate transaction type value', () => {
        expect(AccountTransactionType.TokenUpdate).toBe(27);
        expect(AccountTransactionType.MetaUpdate).toBe(28);
    });
});
