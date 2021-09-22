import { Buffer } from 'buffer/';
import { encodeWord64, encodeMemo } from './serializationHelpers';
import {
    AccountTransactionPayload,
    AccountTransactionType,
    SimpleTransferPayload,
    SimpleTransferWithMemoPayload
} from './types';

interface AccountTransactionHandler<PayloadType extends AccountTransactionPayload = AccountTransactionPayload> {
    serialize: (payload: PayloadType) => Buffer;
    getBaseEnergyCost: (payload?: PayloadType) => bigint;
}

export class SimpleTransferHandler implements AccountTransactionHandler<SimpleTransferWithMemoPayload> {
    getBaseEnergyCost(): bigint {
        return 300n;
    }

    serialize(transfer: SimpleTransferPayload): Buffer {
        const serializedToAddress = transfer.toAddress.decodedAddress;
        const serializedAmount = encodeWord64(transfer.amount.microGtuAmount);
        return Buffer.concat([serializedToAddress, serializedAmount]);
    }
}

export class SimpleTransferWithMemoHandler extends SimpleTransferHandler implements AccountTransactionHandler<SimpleTransferWithMemoPayload> {
    serialize(transfer: SimpleTransferWithMemoPayload): Buffer {
        const regularPayload = super.serialize(transfer);
        const serializedMemo = encodeMemo(transfer.memo);
        return Buffer.concat([regularPayload, serializedMemo]);
    }
}

export function getAccountTransactionHandler(type: AccountTransactionType.SimpleTransfer): SimpleTransferHandler;
export function getAccountTransactionHandler(type: AccountTransactionType.SimpleTransferWithMemo): SimpleTransferWithMemoHandler;
export function getAccountTransactionHandler(type: AccountTransactionType): AccountTransactionHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType
) {
    switch (type) {
        case AccountTransactionType.SimpleTransfer:
            return new SimpleTransferHandler();
        case AccountTransactionType.SimpleTransferWithMemo:
            return new SimpleTransferWithMemoHandler();
        default:
            throw new Error(
                'The handler map is missing the provided type: ' + type
            );
    }
}
