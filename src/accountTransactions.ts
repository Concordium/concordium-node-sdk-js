import { Buffer } from 'buffer/';
import {
    serializeCredentialDeploymentInfo,
    serializeEncryptedData,
} from './serialization';
import {
    encodeWord64,
    encodeDataBlob,
    encodeWord32,
    packBufferWithWord32Length,
    packBufferWithWord16Length,
    serializeList,
    encodeWord8,
} from './serializationHelpers';
import {
    AccountTransactionType,
    SimpleTransferPayload,
    SimpleTransferWithMemoPayload,
    EncryptedTransferPayload,
    EncryptedTransferWithMemoPayload,
    TransferWithSchedulePayload,
    TransferWithScheduleAndMemoPayload,
    InitContractPayload,
    DeployModulePayload,
    UpdateContractPayload,
    AccountTransactionPayload,
    UpdateCredentialsPayload,
    RegisterDataPayload,
    TransferToPublicPayload,
    TransferToEncryptedPayload,
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
        const serializedMemo = encodeDataBlob(transfer.memo);
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
        const cost: number = Math.round(payload.content.length / 10);
        return BigInt(cost);
    }

    serialize(payload: DeployModulePayload): Buffer {
        const serializedWasm = packBufferWithWord32Length(payload.content);
        const serializedVersion = encodeWord32(payload.version);
        return Buffer.concat([serializedVersion, serializedWasm]);
    }
}

export class InitContractHandler
    implements AccountTransactionHandler<InitContractPayload>
{
    getBaseEnergyCost(payload: InitContractPayload): bigint {
        return payload.maxContractExecutionEnergy;
    }

    serialize(payload: InitContractPayload): Buffer {
        const serializedAmount = encodeWord64(payload.amount.microGtuAmount);
        const initNameBuffer = Buffer.from(
            'init_' + payload.contractName,
            'utf8'
        );
        const serializedInitName = packBufferWithWord16Length(initNameBuffer);
        const serializedModuleRef = payload.moduleRef.decodedModuleRef;
        const serializedParameters = packBufferWithWord16Length(
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
        return payload.maxContractExecutionEnergy;
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
        const receiveNameBuffer = Buffer.from(payload.receiveName, 'utf8');
        const serializedReceiveName =
            packBufferWithWord16Length(receiveNameBuffer);
        const serializedParameters = packBufferWithWord16Length(
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

export class TransferWithScheduleHandler
    implements AccountTransactionHandler<TransferWithSchedulePayload>
{
    getBaseEnergyCost(transfer?: TransferWithSchedulePayload): bigint {
        if (!transfer) {
            throw new Error(
                'payload is required to determine the base energy cost of transfer with schedule'
            );
        }
        return BigInt(transfer.schedule.length) * 364n;
    }

    serialize(scheduledTransfer: TransferWithSchedulePayload): Buffer {
        const serializedToAddress = scheduledTransfer.toAddress.decodedAddress;
        const serializedScheduleLength = encodeWord8(
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
    implements AccountTransactionHandler<TransferWithScheduleAndMemoPayload>
{
    serialize(scheduledTransfer: TransferWithScheduleAndMemoPayload): Buffer {
        const serializedMemo = encodeDataBlob(scheduledTransfer.memo);
        const serializedToAddress = scheduledTransfer.toAddress.decodedAddress;
        const serializedScheduleLength = encodeWord8(
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
            serializedMemo,
            serializedScheduleLength,
            ...serializedSchedule,
        ]);
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
        const serializedEncryptedData =
            serializeEncryptedData(encryptedTransfer);

        return Buffer.concat([serializedToAddress, serializedEncryptedData]);
    }
}

export class EncryptedTransferWithMemoHandler
    extends EncryptedTransferHandler
    implements AccountTransactionHandler<EncryptedTransferWithMemoPayload>
{
    serialize(encryptedTransfer: EncryptedTransferWithMemoPayload): Buffer {
        const serializedToAddress = encryptedTransfer.toAddress.decodedAddress;
        const serializedMemo = encodeDataBlob(encryptedTransfer.memo);
        const serializedEncryptedData =
            serializeEncryptedData(encryptedTransfer);

        return Buffer.concat([
            serializedToAddress,
            serializedMemo,
            serializedEncryptedData,
        ]);
    }
}

export class TransferToPublicHandler
    implements AccountTransactionHandler<TransferToPublicPayload>
{
    getBaseEnergyCost(): bigint {
        return 14850n;
    }

    serialize(transferToPublic: TransferToPublicPayload): Buffer {
        const serializedRemainingAmount = Buffer.from(
            transferToPublic.remainingAmount,
            'hex'
        );
        const serializedAmount = encodeWord64(
            transferToPublic.transferAmount.microGtuAmount
        );
        const serializedIndex = encodeWord64(transferToPublic.index);
        const serializedProof = Buffer.from(transferToPublic.proof, 'hex');

        return Buffer.concat([
            serializedRemainingAmount,
            serializedAmount,
            serializedIndex,
            serializedProof,
        ]);
    }
}

export class TransferToEncryptedHandler
    implements AccountTransactionHandler<TransferToEncryptedPayload>
{
    getBaseEnergyCost(): bigint {
        return 600n;
    }

    serialize(transfer: TransferToEncryptedPayload): Buffer {
        return encodeWord64(transfer.amount.microGtuAmount);
    }
}

export class UpdateCredentialsHandler
    implements AccountTransactionHandler<UpdateCredentialsPayload>
{
    getBaseEnergyCost(updateCredentials: UpdateCredentialsPayload): bigint {
        const newCredentialsCost = updateCredentials.newCredentials
            .map((credential) => {
                const numberOfKeys = BigInt(
                    Object.keys(credential.cdi.credentialPublicKeys.keys).length
                );
                return 54000n + 100n * numberOfKeys;
            })
            .reduce((prev, curr) => prev + curr, BigInt(0));

        const currentCredentialsCost =
            500n * updateCredentials.currentNumberOfCredentials;

        return 500n + currentCredentialsCost + newCredentialsCost;
    }

    serialize(updateCredentials: UpdateCredentialsPayload): Buffer {
        const serializedAddedCredentials = serializeList(
            updateCredentials.newCredentials,
            encodeWord8,
            ({ index, cdi }) =>
                Buffer.concat([
                    encodeWord8(index),
                    serializeCredentialDeploymentInfo(cdi),
                ])
        );

        const serializedRemovedCredIds = serializeList(
            updateCredentials.removeCredentialIds,
            encodeWord8,
            (credId: string) => Buffer.from(credId, 'hex')
        );
        const serializedThreshold = encodeWord8(updateCredentials.threshold);
        return Buffer.concat([
            serializedAddedCredentials,
            serializedRemovedCredIds,
            serializedThreshold,
        ]);
    }
}

export class RegisterDataHandler
    implements AccountTransactionHandler<RegisterDataPayload>
{
    getBaseEnergyCost(): bigint {
        return 300n;
    }

    serialize(payload: RegisterDataPayload): Buffer {
        return encodeDataBlob(payload.data);
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
    type: AccountTransactionType.UpdateCredentials
): UpdateCredentialsHandler;
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
export function getAccountTransactionHandler(
    type: AccountTransactionType.RegisterData
): RegisterDataHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType.TransferToPublic
): TransferToPublicHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType.TransferToEncrypted
): TransferToEncryptedHandler;

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
        case AccountTransactionType.DeployModule:
            return new DeployModuleHandler();
        case AccountTransactionType.InitializeSmartContractInstance:
            return new InitContractHandler();
        case AccountTransactionType.UpdateSmartContractInstance:
            return new UpdateContractHandler();
        case AccountTransactionType.UpdateCredentials:
            return new UpdateCredentialsHandler();
        case AccountTransactionType.RegisterData:
            return new RegisterDataHandler();
        case AccountTransactionType.TransferToPublic:
            return new TransferToPublicHandler();
        case AccountTransactionType.TransferToEncrypted:
            return new TransferToEncryptedHandler();
        default:
            throw new Error(
                'The provided type does not have a handler: ' + type
            );
    }
}
