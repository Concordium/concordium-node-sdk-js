import bs58check from 'bs58check';
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
        const serializedToAddress = bs58check
            .decode(transfer.toAddress)
            .slice(1);
        const serializedAmount = encodeWord64(transfer.amount);
        return Buffer.concat([serializedToAddress, serializedAmount]);
    }
}

export function getAccountTransactionHandlerMap(): Map<
    AccountTransactionType,
    AccountTransactionHandler
> {
    const payloadSerializerMap = new Map<
        AccountTransactionType,
        AccountTransactionHandler
    >();
    payloadSerializerMap.set(
        AccountTransactionType.SimpleTransfer,
        new SimpleTransferHandler()
    );
    return payloadSerializerMap;
}
