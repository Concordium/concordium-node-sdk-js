import { Buffer } from 'buffer/';
import {
    encodeWord64,
    encodeMemo,
    encodeWord32,
    encodeWord16,
    encodeWord8,
    encodeWasmfile,
    encodeString,
} from './serializationHelpers';
import {
    AccountTransactionType,
    InitContractPayload,
    SimpleTransferPayload,
    SimpleTransferWithMemoPayload,
    DeployModulePayload,
    ParamtersValue,
    UpdateContractPayload,
} from './types';

interface AccountTransactionHandler<PayloadType> {
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
    getBaseEnergyCost(payload: DeployModulePayload | undefined | any): bigint {
        const cost: number = Math.round((payload.content.length + 1) / 10);
        return BigInt(cost);
    }

    serialize(transfer: DeployModulePayload): Buffer {
        const serializedMemo = encodeWasmfile(
            transfer.content,
            transfer.length
        );
        const serializedVersion = encodeWord32(transfer.version);
        const serializedTag = encodeWord16(transfer.tag);
        return Buffer.concat([
            serializedTag,
            serializedVersion,
            serializedMemo,
        ]);
    }
}

export class InitContractHandler
    implements AccountTransactionHandler<InitContractPayload>
{
    getBaseEnergyCost(payload: InitContractPayload | undefined): bigint {
        return 300000n;
    }

    serialize(payload: InitContractPayload): Buffer {
        const serializedAmount = encodeWord64(payload.amount.microGtuAmount);
        const initNameBuffer = Buffer.from(payload.initName);
        const serializedInitName = encodeString(initNameBuffer);
        const serializedModuleRef = payload.moduleRef.decodedModuleRef;
        const serializeParamters = serializeParameter(payload.parameter);
        const serializedParamters = encodeString(serializeParamters);
        return Buffer.concat([
            serializedAmount,
            serializedModuleRef,
            serializedInitName,
            serializedParamters,
        ]);
    }
}

export class UpdateContractHandler
    implements AccountTransactionHandler<UpdateContractPayload>
{
    getBaseEnergyCost(payload: UpdateContractPayload | undefined): bigint {
        return 30000n;
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
        const serializeParamters = serializeParameter(payload.parameter);
        const receiveNameBuffer = Buffer.from(payload.receiveName);
        const serializedReceiveName = encodeString(receiveNameBuffer);
        const serializedParamters = encodeString(serializeParamters);
        return Buffer.concat([
            serializedAmount,
            serializedContractAddress,
            serializedReceiveName,
            serializedParamters,
        ]);
    }
}

export function serializeParameter(parameter: ParamtersValue<any>[]): Buffer {
    const finalSerializedParameters: Buffer[] = [];
    parameter.forEach((element) => {
        if (typeof element.value === 'string') {
            finalSerializedParameters.push(Buffer.from(element.value));
        } else if (typeof element.value === 'number') {
            if (
                element.value > 255 ||
                element.value < 0 ||
                !Number.isInteger(element.value)
            ) {
                finalSerializedParameters.push(encodeWord8(element.value));
            } else if (
                element.value > 65535 ||
                element.value < 0 ||
                !Number.isInteger(element.value)
            ) {
                finalSerializedParameters.push(encodeWord16(element.value));
            } else if (
                element.value > 4294967295 ||
                element.value < 0 ||
                !Number.isInteger(element.value)
            ) {
                finalSerializedParameters.push(encodeWord32(element.value));
            } else if (
                element.value > 9223372036854775807n ||
                element.value < 0n ||
                !Number.isInteger(element.value)
            ) {
                finalSerializedParameters.push(
                    encodeWord64(BigInt(element.value))
                );
            }
        } else {
            finalSerializedParameters.push(Buffer.from(element.value));
        }
    });
    return Buffer.concat(finalSerializedParameters);
}

export function getAccountTransactionHandler(
    type: AccountTransactionType
): AccountTransactionHandler<any> {
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
