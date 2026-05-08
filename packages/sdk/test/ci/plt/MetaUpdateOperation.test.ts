import JSONBig from 'json-bigint';

import { Cursor } from '../../../src/deserializationHelpers.ts';
import {
    CborAccountAddress,
    CborEpoch,
    LockController,
    LockId,
    MetaUpdateOperationType,
    TokenAdminRole,
    TokenAmount,
    TokenId,
    TokenMetadataUrl,
    TokenOperationType,
    createMetaTokenOperation,
    createMetaUpdatePayload,
    encodeMetaUpdateOperations,
} from '../../../src/pub/plt.ts';
import type { LockConfig } from '../../../src/pub/plt.ts';
import {
    AccountAddress,
    AccountTransactionType,
    MetaUpdateHandler,
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
    const lockConfig: LockConfig = {
        recipients: [account],
        expiry: CborEpoch.fromEpochSeconds(10n),
        controller: LockController.simpleV0(
            [
                {
                    account,
                    roles: [LockController.SimpleV0Capability.Fund, LockController.SimpleV0Capability.Send],
                },
            ],
            [token]
        ),
    };
    const metadataChecksum = new Uint8Array(32).fill(1);

    it.each([
        [
            'transfer',
            createMetaTokenOperation(token, { [TokenOperationType.Transfer]: { amount, recipient: account } }),
            '81a1687472616e73666572a365746f6b656e6674546f6b656e66616d6f756e74c482211901f469726563697069656e74d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515',
        ],
        [
            'mint',
            createMetaTokenOperation(token, { [TokenOperationType.Mint]: { amount } }),
            '81a1646d696e74a265746f6b656e6674546f6b656e66616d6f756e74c482211901f4',
        ],
        [
            'burn',
            createMetaTokenOperation(token, { [TokenOperationType.Burn]: { amount } }),
            '81a1646275726ea265746f6b656e6674546f6b656e66616d6f756e74c482211901f4',
        ],
        [
            'addAllowList',
            createMetaTokenOperation(token, { [TokenOperationType.AddAllowList]: { target: account } }),
            '81a16c616464416c6c6f774c697374a265746f6b656e6674546f6b656e66746172676574d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515',
        ],
        [
            'removeAllowList',
            createMetaTokenOperation(token, { [TokenOperationType.RemoveAllowList]: { target: account } }),
            '81a16f72656d6f7665416c6c6f774c697374a265746f6b656e6674546f6b656e66746172676574d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515',
        ],
        [
            'addDenyList',
            createMetaTokenOperation(token, { [TokenOperationType.AddDenyList]: { target: account } }),
            '81a16b61646444656e794c697374a265746f6b656e6674546f6b656e66746172676574d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515',
        ],
        [
            'removeDenyList',
            createMetaTokenOperation(token, { [TokenOperationType.RemoveDenyList]: { target: account } }),
            '81a16e72656d6f766544656e794c697374a265746f6b656e6674546f6b656e66746172676574d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515',
        ],
        [
            'pause',
            createMetaTokenOperation(token, { [TokenOperationType.Pause]: {} }),
            '81a1657061757365a165746f6b656e6674546f6b656e',
        ],
        [
            'unpause',
            createMetaTokenOperation(token, { [TokenOperationType.Unpause]: {} }),
            '81a167756e7061757365a165746f6b656e6674546f6b656e',
        ],
        [
            'updateMetadata',
            createMetaTokenOperation(token, {
                [TokenOperationType.UpdateMetadata]: TokenMetadataUrl.create(
                    'https://example.com/token-metadata.json',
                    metadataChecksum
                ),
            }),
            '81a16e7570646174654d65746164617461a36375726c782768747470733a2f2f6578616d706c652e636f6d2f746f6b656e2d6d657461646174612e6a736f6e65746f6b656e6674546f6b656e6e636865636b73756d53686132353658200101010101010101010101010101010101010101010101010101010101010101',
        ],
        [
            'assignAdminRoles',
            createMetaTokenOperation(token, {
                [TokenOperationType.AssignAdminRoles]: { roles: [TokenAdminRole.UpdateAdminRoles], account },
            }),
            '81a17061737369676e41646d696e526f6c6573a365726f6c6573817075706461746541646d696e526f6c657365746f6b656e6674546f6b656e676163636f756e74d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515',
        ],
        [
            'revokeAdminRoles',
            createMetaTokenOperation(token, {
                [TokenOperationType.RevokeAdminRoles]: { roles: [TokenAdminRole.UpdateAdminRoles], account },
            }),
            '81a1707265766f6b6541646d696e526f6c6573a365726f6c6573817075706461746541646d696e526f6c657365746f6b656e6674546f6b656e676163636f756e74d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515',
        ],
        [
            'lockCreate',
            { [MetaUpdateOperationType.LockCreate]: lockConfig },
            '81a16a6c6f636b437265617465a366657870697279c10a6a636f6e74726f6c6c6572a16873696d706c655630a2666772616e747381a265726f6c6573826466756e646473656e64676163636f756e74d99d73a201d99d71a101190397035820151515151515151515151515151515151515151515151515151515151515151566746f6b656e73816674546f6b656e6a726563697069656e747381d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515',
        ],
        [
            'lockCancel',
            { [MetaUpdateOperationType.LockCancel]: { lock, memo: new Uint8Array([9]) } },
            '81a16a6c6f636b43616e63656ca2646c6f636bd99fd883010203646d656d6f4109',
        ],
        [
            'lockFund',
            { [MetaUpdateOperationType.LockFund]: { token, lock, amount, memo: new Uint8Array([9]) } },
            '81a1686c6f636b46756e64a4646c6f636bd99fd883010203646d656d6f410965746f6b656e6674546f6b656e66616d6f756e74c482211901f4',
        ],
        [
            'lockSend',
            { [MetaUpdateOperationType.LockSend]: { token, lock, source: account, amount, recipient: account } },
            '81a1686c6f636b53656e64a5646c6f636bd99fd88301020365746f6b656e6674546f6b656e66616d6f756e74c482211901f466736f75726365d99d73a201d99d71a101190397035820151515151515151515151515151515151515151515151515151515151515151569726563697069656e74d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515',
        ],
        [
            'lockReturn',
            { [MetaUpdateOperationType.LockReturn]: { token, lock, source: account, amount } },
            '81a16a6c6f636b52657475726ea4646c6f636bd99fd88301020365746f6b656e6674546f6b656e66616d6f756e74c482211901f466736f75726365d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515',
        ],
    ])('encodes %s meta update operation', (_name, operation, expected) => {
        expect(encodeMetaUpdateOperations(operation).toString()).toBe(expected);
    });

    it('encodes lockCreate and lockCancel meta operations', () => {
        const operations = encodeMetaUpdateOperations([
            { [MetaUpdateOperationType.LockCreate]: lockConfig },
            { [MetaUpdateOperationType.LockCancel]: { lock, memo: new Uint8Array([9]) } },
        ]);

        expect(operations.toString()).toContain('6a6c6f636b437265617465');
        expect(operations.toString()).toContain('6a6c6f636b43616e63656c');
        expect(operations.toString()).toContain('d99fd883010203');
    });

    it('encodes token-scoped lock operations', () => {
        const operations = encodeMetaUpdateOperations([
            { [MetaUpdateOperationType.LockFund]: { token, lock, amount, memo: new Uint8Array([9]) } },
            { [MetaUpdateOperationType.LockSend]: { token, lock, source: account, amount, recipient: account } },
            { [MetaUpdateOperationType.LockReturn]: { token, lock, source: account, amount } },
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
        const payload = createMetaUpdatePayload({ [MetaUpdateOperationType.LockCancel]: { lock } });
        const serialized = serializeAccountTransactionPayload({ type: AccountTransactionType.MetaUpdate, payload });

        expect(serialized.toString('hex')).toBe('1c0000001a81a16a6c6f636b43616e63656ca1646c6f636bd99fd883010203');

        const deserialized = new MetaUpdateHandler().deserialize(Cursor.fromBuffer(serialized.slice(1)));
        expect(deserialized).toEqual(payload);
    });

    it('supports Payload helpers and JSON roundtrips for MetaUpdate', () => {
        const payload = Payload.metaUpdate(createMetaUpdatePayload({ [MetaUpdateOperationType.LockCancel]: { lock } }));
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
            { [MetaUpdateOperationType.LockCreate]: lockConfig },
            { [MetaUpdateOperationType.LockCancel]: { lock } },
            { [MetaUpdateOperationType.LockFund]: { token, lock, amount } },
            { [MetaUpdateOperationType.LockSend]: { token, lock, source: account, amount, recipient: account } },
            { [MetaUpdateOperationType.LockReturn]: { token, lock, source: account, amount } },
        ]);

        expect(new MetaUpdateHandler().getBaseEnergyCost(payload)).toBe(850n);
    });

    it('does not change TokenUpdate transaction type value', () => {
        expect(AccountTransactionType.TokenUpdate).toBe(27);
        expect(AccountTransactionType.MetaUpdate).toBe(28);
    });
});
