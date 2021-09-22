import { Buffer } from 'buffer/';
import { encodeWord64, encodeMemo, encodeUint8 } from './serializationHelpers';
import {
    AccountTransactionPayload,
    AccountTransactionType,
    EncryptedTransferPayload,
    EncryptedTransferWithMemoPayload,
    SimpleTransferPayload,
    SimpleTransferWithMemoPayload,
    TransferWithSchedulePayload,
    TransferWithScheduleWithMemoPayload,
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
        const regularPayload = super.serialize(transfer);
        const serializedMemo = encodeMemo(transfer.memo);
        return Buffer.concat([regularPayload, serializedMemo]);
    }
}

export class TransferWithScheduleHandler
    implements AccountTransactionHandler<TransferWithSchedulePayload>
{
    getBaseEnergyCost(transfer?: TransferWithSchedulePayload): bigint {
        if (!transfer) {
            // TODO: should it fail, or assume that length = 1 or 255;
            throw new Error(
                'payload is required to determine the base energy cost of transfer with schedule'
            );
        }
        return BigInt(transfer.schedule.length) * 364n;
    }

    serialize(scheduledTransfer: TransferWithSchedulePayload): Buffer {
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

export class TransferWithScheduleAndMemoHandler
    extends TransferWithScheduleHandler
    implements AccountTransactionHandler<TransferWithScheduleWithMemoPayload>
{
    serialize(transfer: TransferWithScheduleWithMemoPayload): Buffer {
        const regularPayload = super.serialize(transfer);
        const serializedMemo = encodeMemo(transfer.memo);
        return Buffer.concat([regularPayload, serializedMemo]);
    }
}

export class EncryptedTransferHandler
    implements AccountTransactionHandler<EncryptedTransferPayload>
{
    getBaseEnergyCost(): bigint {
        return 27000n;
    }

    serialize(encryptedTransfer: EncryptedTransferPayload): Buffer {
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

export class EncryptedTransferWithMemoHandler
    extends EncryptedTransferHandler
    implements AccountTransactionHandler<EncryptedTransferWithMemoPayload>
{
    serialize(transfer: EncryptedTransferWithMemoPayload): Buffer {
        const regularPayload = super.serialize(transfer);
        const serializedMemo = encodeMemo(transfer.memo);
        return Buffer.concat([regularPayload, serializedMemo]);
    }
}

export function getAccountTransactionHandler(
    type: AccountTransactionType.SimpleTransfer
): SimpleTransferHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType.SimpleTransferWithMemo
): SimpleTransferWithMemoHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType.TransferWithSchedule
): TransferWithScheduleHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType.TransferWithScheduleAndMemo
): TransferWithScheduleAndMemoHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType.EncryptedTransfer
): EncryptedTransferHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType.EncryptedTransferWithMemo
): EncryptedTransferWithMemoHandler;
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
        case AccountTransactionType.TransferWithSchedule:
            return new TransferWithScheduleHandler();
        case AccountTransactionType.TransferWithScheduleAndMemo:
            return new TransferWithScheduleAndMemoHandler();
        case AccountTransactionType.EncryptedTransfer:
            return new EncryptedTransferHandler();
        case AccountTransactionType.EncryptedTransferWithMemo:
            return new EncryptedTransferWithMemoHandler();
        default:
            throw new Error(
                'The handler map is missing the provided type: ' + type
            );
    }
}
