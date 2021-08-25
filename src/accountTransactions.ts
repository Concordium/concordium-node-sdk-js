import { Buffer } from 'buffer/';
import { encodeWord64, encodeMemo, encodeUint8 } from './serializationHelpers';
import {
    AccountTransactionPayload,
    AccountTransactionType,
    SimpleTransfer,
    SimpleTransferWithMemo,
    TransferWithSchedule,
} from './types';

interface AccountTransactionHandler {
    serialize: (payload: AccountTransactionPayload) => Buffer;
    getBaseEnergyCost: (payload?: AccountTransactionPayload) => bigint;
}

export class SimpleTransferHandler implements AccountTransactionHandler {
    getBaseEnergyCost(): bigint {
        return 300n;
    }

    serialize(transfer: AccountTransactionPayload): Buffer {
        const serializedToAddress = transfer.toAddress.decodedAddress;
        // Find a nice way to handle payload type to avoid this typecast.
        const serializedAmount = encodeWord64(
            (transfer as SimpleTransfer).amount.microGtuAmount
        );
        return Buffer.concat([serializedToAddress, serializedAmount]);
    }
}

export class SimpleTransferWithMemoHandler
    implements AccountTransactionHandler
{
    getBaseEnergyCost(): bigint {
        return 300n;
    }

    serialize(transfer: AccountTransactionPayload): Buffer {
        // Find a nice way to handle payload type to avoid this typecast.
        const memoTransfer = transfer as SimpleTransferWithMemo;
        const serializedToAddress = memoTransfer.toAddress.decodedAddress;
        const serializedAmount = encodeWord64(
            memoTransfer.amount.microGtuAmount
        );
        const serializedMemo = encodeMemo(memoTransfer.memo);
        return Buffer.concat([
            serializedToAddress,
            serializedAmount,
            serializedMemo,
        ]);
    }
}

export class TransferWithScheduleHandler implements AccountTransactionHandler {
    getBaseEnergyCost(transfer?: AccountTransactionPayload): bigint {
        if (!transfer) {
            // TODO: should it fail, or assume that length = 1 or 255;
            throw new Error(
                'payload is required to determine the base energy cost of transfer with schedule'
            );
        }
        return (
            BigInt((transfer as TransferWithSchedule).schedule.length) * 364n
        );
    }

    serialize(transfer: AccountTransactionPayload): Buffer {
        // Find a nice way to handle payload type to avoid this typecast.
        const scheduledTransfer = transfer as TransferWithSchedule;
        const serializedToAddress = scheduledTransfer.toAddress.decodedAddress;
        const serializedScheduleLength = encodeUint8(
            scheduledTransfer.schedule.length
        );
        const serializedSchedule = scheduledTransfer.schedule.map(
            ({ amount, timestamp }) =>
                Buffer.concat([
                    encodeWord64(BigInt(timestamp.getTime())),
                    encodeWord64(amount.microGtuAmount),
                ])
        );
        return Buffer.concat([
            serializedToAddress,
            serializedScheduleLength,
            ...serializedSchedule,
        ]);
    }
}

export function getAccountTransactionHandler(
    type: AccountTransactionType
): AccountTransactionHandler {
    const accountTransactionHandlerMap = new Map<
        AccountTransactionType,
        AccountTransactionHandler
    >();
    accountTransactionHandlerMap.set(
        AccountTransactionType.SimpleTransfer,
        new SimpleTransferHandler()
    );

    accountTransactionHandlerMap.set(
        AccountTransactionType.SimpleTransferWithMemo,
        new SimpleTransferWithMemoHandler()
    );

    accountTransactionHandlerMap.set(
        AccountTransactionType.TransferWithSchedule,
        new TransferWithScheduleHandler()
    );

    const handler = accountTransactionHandlerMap.get(type);
    if (!handler) {
        throw new Error(
            'The handler map is missing the provided type: ' + type
        );
    }
    return handler;
}
