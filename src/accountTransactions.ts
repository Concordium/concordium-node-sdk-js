import { Buffer } from 'buffer/';
import { encodeWord64 } from './serializationHelpers';
import {
    AccountTransactionPayload,
    AccountTransactionType,
    SimpleTransfer,
} from './types';

interface AccountTransactionHandler {
    serialize: (payload: AccountTransactionPayload) => Buffer;
    getBaseEnergyCost: (payload?: AccountTransactionPayload) => bigint;
}

export class SimpleTransferHandler implements AccountTransactionHandler {
    getBaseEnergyCost(): bigint {
        return 300n;
    }

    serialize(transfer: SimpleTransfer): Buffer {
        const serializedToAddress = transfer.toAddress.decodedAddress;
        const serializedAmount = encodeWord64(transfer.amount.microGtuAmount);
        return Buffer.concat([serializedToAddress, serializedAmount]);
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

    const handler = accountTransactionHandlerMap.get(type);
    if (!handler) {
        throw new Error(
            'The handler map is missing the provided type: ' + type
        );
    }
    return handler;
}
