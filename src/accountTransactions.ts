import { Buffer } from 'buffer/';
import {
    encodeWord64,
    encodeMemo,
    encodeWord32,
    packBufferWithWord32Offset,
    packBufferWithWord16Offset,
} from './serializationHelpers';
import {
    AccountTransactionType,
    InitContractPayload,
    SimpleTransferPayload,
    SimpleTransferWithMemoPayload,
    DeployModulePayload,
    UpdateContractPayload,
    AccountTransactionPayload,
} from './types';

interface AccountTransactionHandler<
    PayloadType extends AccountTransactionPayload = AccountTransactionPayload
> {
    serialize: (payload: PayloadType) => Buffer;
    getBaseEnergyCost: (payload: PayloadType) => bigint;
}

export class SimpleTransferHandler
    implements AccountTransactionHandler<SimpleTransferPayload>
{
    getBaseEnergyCost(payload: SimpleTransferPayload): bigint {
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

export class DeployModuleHandler
    implements AccountTransactionHandler<DeployModulePayload>
{
    getBaseEnergyCost(payload: DeployModulePayload): bigint {
        const cost: number = Math.round((payload.content.length + 1) / 10);
        return BigInt(cost);
    }

    serialize(transfer: DeployModulePayload): Buffer {
        const serializedWasm = packBufferWithWord32Offset(transfer.content);
        const serializedVersion = encodeWord32(transfer.version);
        return Buffer.concat([serializedVersion, serializedWasm]);
    }
}

export class InitContractHandler
    implements AccountTransactionHandler<InitContractPayload>
{
    getBaseEnergyCost(payload: InitContractPayload): bigint {
        return payload.baseEnergyCost;
    }

    serialize(payload: InitContractPayload): Buffer {
        const serializedAmount = encodeWord64(payload.amount.microGtuAmount);
        const initNameBuffer = Buffer.from(payload.initName);
        const serializedInitName = packBufferWithWord16Offset(initNameBuffer);
        const serializedModuleRef = payload.moduleRef.decodedModuleRef;
        const serializedParameters = packBufferWithWord16Offset(
            Buffer.from(payload.parameter)
        );
        return Buffer.concat([
            serializedAmount,
            serializedModuleRef,
            serializedInitName,
            serializedParameters,
        ]);
    }
}

export class UpdateContractHandler
    implements AccountTransactionHandler<UpdateContractPayload>
{
    getBaseEnergyCost(payload: UpdateContractPayload): bigint {
        return payload.baseEnergyCost;
    }

    serialize(payload: UpdateContractPayload): Buffer {
        const serializedAmount = encodeWord64(payload.amount.microGtuAmount);
        const serializeIndex = encodeWord64(payload.contractAddress.index);
        const serializeSubindex = encodeWord64(
            payload.contractAddress.subindex
        );
        const serializedContractAddress = Buffer.concat([
            serializeIndex,
            serializeSubindex,
        ]);
        const receiveNameBuffer = Buffer.from(payload.receiveName);
        const serializedReceiveName =
            packBufferWithWord16Offset(receiveNameBuffer);
        const serializedParameters = packBufferWithWord16Offset(
            Buffer.from(payload.parameter)
        );
        return Buffer.concat([
            serializedAmount,
            serializedContractAddress,
            serializedReceiveName,
            serializedParameters,
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
export function getAccountTransactionHandler(
    type: AccountTransactionType.DeployModule
): DeployModuleHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType.InitializeSmartContractInstance
): InitContractHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType.UpdateSmartContractInstance
): UpdateContractHandler;
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function getAccountTransactionHandler(type: AccountTransactionType) {
    switch (type) {
        case AccountTransactionType.SimpleTransfer:
            return new SimpleTransferHandler();
        case AccountTransactionType.SimpleTransferWithMemo:
            return new SimpleTransferWithMemoHandler();
        case AccountTransactionType.DeployModule:
            return new DeployModuleHandler();
        case AccountTransactionType.InitializeSmartContractInstance:
            return new InitContractHandler();
        case AccountTransactionType.UpdateSmartContractInstance:
            return new UpdateContractHandler();
        default:
            throw new Error(
                'The provided type does not have a handler: ' + type
            );
    }
}
