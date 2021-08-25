import { Buffer } from 'buffer/';
import { encodeWord64, encodeMemo } from './serializationHelpers';
import {
    AccountTransactionPayload,
    AccountTransactionType,
    SimpleTransfer,
    SimpleTransferWithMemo
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
        const serializedAmount = encodeWord64(transfer.amount.microGtuAmount);
        return Buffer.concat([serializedToAddress, serializedAmount]);
    }
}

export class SimpleTransferWithMemoHandler implements AccountTransactionHandler {
    getBaseEnergyCost(): bigint {
        return 300n;
    }

    serialize(transfer: AccountTransactionPayload): Buffer {
        const serializedToAddress = transfer.toAddress.decodedAddress;
        const serializedAmount = encodeWord64(transfer.amount.microGtuAmount);
        // Find a nice way to handle payload type to avoid this typecast.
        const serializedMemo  = encodeMemo((transfer as SimpleTransferWithMemo).memo);
        return Buffer.concat([serializedToAddress, serializedAmount, serializedMemo]);
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

    const handler = accountTransactionHandlerMap.get(type);
    if (!handler) {
        throw new Error(
            'The handler map is missing the provided type: ' + type
        );
    }
    return handler;
}
