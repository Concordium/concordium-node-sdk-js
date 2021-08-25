import { Buffer } from 'buffer/';
import { encodeWord64, encodeMemo, encodeUint8 } from './serializationHelpers';
import {
    AccountTransactionPayload,
    AccountTransactionType,
    SimpleTransfer,
    SimpleTransferWithMemo,
    TransferWithSchedule,
    TransferToEncrypted,
    TransferToPublic,
    EncryptedTransfer,
    TransferWithScheduleWithMemo,
    EncryptedTransferWithMemo,
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
        const simpleTransfer = transfer as SimpleTransfer;
        const serializedToAddress = simpleTransfer.toAddress.decodedAddress;
        // Find a nice way to handle payload type to avoid this typecast.
        const serializedAmount = encodeWord64(
            simpleTransfer.amount.microGtuAmount
        );
        return Buffer.concat([serializedToAddress, serializedAmount]);
    }
}

export class SimpleTransferWithMemoHandler extends SimpleTransferHandler {
    serialize(transfer: AccountTransactionPayload): Buffer {
        const regularPayload = super.serialize(transfer);
        const serializedMemo = encodeMemo(
            (transfer as SimpleTransferWithMemo).memo
        );
        return Buffer.concat([regularPayload, serializedMemo]);
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

export class TransferWithScheduleWithMemoHandler extends TransferWithScheduleHandler {
    serialize(transfer: AccountTransactionPayload): Buffer {
        const regularPayload = super.serialize(transfer);
        const serializedMemo = encodeMemo(
            (transfer as TransferWithScheduleWithMemo).memo
        );
        return Buffer.concat([regularPayload, serializedMemo]);
    }
}

export class TransferToEncryptedHandler implements AccountTransactionHandler {
    getBaseEnergyCost(): bigint {
        return 600n;
    }

    serialize(transfer: AccountTransactionPayload): Buffer {
        // Find a nice way to handle payload type to avoid this typecast.
        return encodeWord64(
            (transfer as TransferToEncrypted).amount.microGtuAmount
        );
    }
}

export class TransferToPublicHandler implements AccountTransactionHandler {
    getBaseEnergyCost(): bigint {
        return 14850n;
    }

    serialize(transfer: AccountTransactionPayload): Buffer {
        // Find a nice way to handle payload type to avoid this typecast.
        const transferToPublic = transfer as TransferToPublic;
        const serializedRemainingEncryptedAmount = Buffer.from(
            transferToPublic.remainingEncryptedAmount,
            'hex'
        );
        const serializedAmount = encodeWord64(
            transferToPublic.amount.microGtuAmount
        );
        const serializedIndex = encodeWord64(transferToPublic.index);
        const serializedProof = Buffer.from(transferToPublic.proof, 'hex');

        return Buffer.concat([
            serializedRemainingEncryptedAmount,
            serializedAmount,
            serializedIndex,
            serializedProof,
        ]);
    }
}

export class EncryptedTransferHandler implements AccountTransactionHandler {
    getBaseEnergyCost(): bigint {
        return 27000n;
    }

    serialize(transfer: AccountTransactionPayload): Buffer {
        // Find a nice way to handle payload type to avoid this typecast.
        const encryptedTransfer = transfer as EncryptedTransfer;
        const serializedToAddress = encryptedTransfer.toAddress.decodedAddress;
        const serializedRemainingEncryptedAmount = Buffer.from(
            encryptedTransfer.remainingEncryptedAmount,
            'hex'
        );
        const serializedTransferAmount = Buffer.from(
            encryptedTransfer.transferAmount,
            'hex'
        );
        const serializedIndex = encodeWord64(encryptedTransfer.index);
        const serializedProof = Buffer.from(encryptedTransfer.proof, 'hex');

        return Buffer.concat([
            serializedToAddress,
            serializedRemainingEncryptedAmount,
            serializedTransferAmount,
            serializedIndex,
            serializedProof,
        ]);
    }
}

export class EncryptedTransferWithMemoHandler extends EncryptedTransferHandler {
    serialize(transfer: AccountTransactionPayload): Buffer {
        const regularPayload = super.serialize(transfer);
        const serializedMemo = encodeMemo(
            (transfer as EncryptedTransferWithMemo).memo
        );
        return Buffer.concat([regularPayload, serializedMemo]);
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

    accountTransactionHandlerMap.set(
        AccountTransactionType.TransferToEncrypted,
        new TransferToEncryptedHandler()
    );

    accountTransactionHandlerMap.set(
        AccountTransactionType.TransferToPublic,
        new TransferToPublicHandler()
    );

    accountTransactionHandlerMap.set(
        AccountTransactionType.EncryptedTransfer,
        new EncryptedTransferHandler()
    );

    const handler = accountTransactionHandlerMap.get(type);
    if (!handler) {
        throw new Error(
            'The handler map is missing the provided type: ' + type
        );
    }
    return handler;
}
