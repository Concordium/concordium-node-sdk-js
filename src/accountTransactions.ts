import { Buffer } from 'buffer/';
import { encodeWord64, encodeMemo } from './serializationHelpers';
import {
    AccountTransactionPayload,
    AccountTransactionType,
    SimpleTransferPayload,
    SimpleTransferWithMemoPayload,
} from './types';

interface AccountTransactionHandler<
    PayloadType extends AccountTransactionPayload = AccountTransactionPayload
> {
    serialize: (payload: PayloadType) => Buffer;
    getBaseEnergyCost: (payload?: PayloadType) => bigint;
}

export class SimpleTransferHandler
    implements AccountTransactionHandler<SimpleTransferWithMemoPayload>
{
    getBaseEnergyCost(): bigint {
        return 300n;
    }

    serialize(transfer: SimpleTransferPayload): Buffer {
        const serializedToAddress = transfer.toAddress.decodedAddress;
        const serializedAmount = encodeWord64(transfer.amount.microGtuAmount);
        return Buffer.concat([serializedToAddress, serializedAmount]);
    }
}

export class SimpleTransferWithMemoHandler
    extends SimpleTransferHandler
    implements AccountTransactionHandler<SimpleTransferWithMemoPayload>
{
    serialize(transfer: SimpleTransferWithMemoPayload): Buffer {
        const serializedToAddress = transfer.toAddress.decodedAddress;
        const serializedMemo = encodeMemo(transfer.memo);
        const serializedAmount = encodeWord64(transfer.amount.microGtuAmount);
        return Buffer.concat([
            serializedToAddress,
            serializedMemo,
            serializedAmount,
        ]);
    }
}

export function getAccountTransactionHandler(
    type: AccountTransactionType.SimpleTransfer
): SimpleTransferHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType.SimpleTransferWithMemo
): SimpleTransferWithMemoHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType
): AccountTransactionHandler;
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function getAccountTransactionHandler(type: AccountTransactionType) {
    switch (type) {
        case AccountTransactionType.SimpleTransfer:
            return new SimpleTransferHandler();
        case AccountTransactionType.SimpleTransferWithMemo:
            return new SimpleTransferWithMemoHandler();
        default:
            throw new Error(
                'The provided type does not have a handler: ' + type
            );
    }
}
