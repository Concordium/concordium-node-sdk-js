import { Buffer } from 'buffer/';
import {
    serializeBakerKeyProofs,
    serializeBakerVerifyKeys,
    serializeCredentialDeploymentInfo,
} from './serialization';
import {
    encodeWord64,
    encodeDataBlob,
    encodeWord32,
    packBufferWithWord32Length,
    packBufferWithWord16Length,
    serializeList,
    encodeWord8,
    encodeBoolean,
} from './serializationHelpers';
import {
    AccountTransactionType,
    InitContractPayload,
    SimpleTransferPayload,
    SimpleTransferWithMemoPayload,
    DeployModulePayload,
    UpdateContractPayload,
    AccountTransactionPayload,
    UpdateCredentialsPayload,
    RegisterDataPayload,
    UpdateBakerKeysPayload,
    AddBakerPayload,
    UpdateBakerStakePayload,
    UpdateBakerRestakeEarningsPayload,
    RemoveBakerPayload,
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
        const parameterBuffer = payload.parameter;
        const serializedParameters =
            packBufferWithWord16Length(parameterBuffer);
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
        const parameterBuffer = payload.parameter;
        const serializedParameters = packBufferWithWord16Length(
            Buffer.from(parameterBuffer)
        );
        return Buffer.concat([
            serializedAmount,
            serializedContractAddress,
            serializedReceiveName,
            serializedParameters,
        ]);
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

export class AddBakerHandler
    implements AccountTransactionHandler<AddBakerPayload>
{
    getBaseEnergyCost(): bigint {
        return 4050n;
    }
    serialize(addBaker: AddBakerPayload): Buffer {
        return Buffer.concat([
            serializeBakerVerifyKeys(addBaker),
            serializeBakerKeyProofs(addBaker),
            encodeWord64(addBaker.bakingStake.microGtuAmount),
            encodeBoolean(addBaker.restakeEarnings),
        ]);
    }
}

export class UpdateBakerKeysHandler
    implements AccountTransactionHandler<UpdateBakerKeysPayload>
{
    getBaseEnergyCost(): bigint {
        return 4050n;
    }
    serialize(updateBakerKeys: UpdateBakerKeysPayload): Buffer {
        return Buffer.concat([
            serializeBakerVerifyKeys(updateBakerKeys),
            serializeBakerKeyProofs(updateBakerKeys),
        ]);
    }
}

export class RemoveBakerHandler
    implements AccountTransactionHandler<RemoveBakerPayload>
{
    getBaseEnergyCost(): bigint {
        return 300n;
    }
    serialize(): Buffer {
        return Buffer.alloc(0);
    }
}

export class UpdateBakerStakeHandler
    implements AccountTransactionHandler<UpdateBakerStakePayload>
{
    getBaseEnergyCost(): bigint {
        return 300n;
    }
    serialize(updateStake: UpdateBakerStakePayload): Buffer {
        return encodeWord64(updateStake.stake.microGtuAmount);
    }
}

export class UpdateBakerRestakeEarningsHandler
    implements AccountTransactionHandler<UpdateBakerRestakeEarningsPayload>
{
    getBaseEnergyCost(): bigint {
        return 300n;
    }
    serialize(updateRestake: UpdateBakerRestakeEarningsPayload): Buffer {
        return encodeBoolean(updateRestake.restakeEarnings);
    }
}

export function getAccountTransactionHandler(
    type: AccountTransactionType.SimpleTransfer
): SimpleTransferHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType.SimpleTransferWithMemo
): SimpleTransferWithMemoHandler;
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
    type: AccountTransactionType.AddBaker
): AddBakerHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType.UpdateBakerKeys
): UpdateBakerKeysHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType.RemoveBaker
): RemoveBakerHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType.UpdateBakerStake
): UpdateBakerStakeHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType.UpdateBakerRestakeEarnings
): UpdateBakerRestakeEarningsHandler;

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
        case AccountTransactionType.UpdateCredentials:
            return new UpdateCredentialsHandler();
        case AccountTransactionType.RegisterData:
            return new RegisterDataHandler();
        case AccountTransactionType.AddBaker:
            return new AddBakerHandler();
        case AccountTransactionType.UpdateBakerKeys:
            return new UpdateBakerKeysHandler();
        case AccountTransactionType.RemoveBaker:
            return new RemoveBakerHandler();
        case AccountTransactionType.UpdateBakerStake:
            return new UpdateBakerStakeHandler();
        case AccountTransactionType.UpdateBakerRestakeEarnings:
            return new UpdateBakerRestakeEarningsHandler();
        default:
            throw new Error(
                'The provided type does not have a handler: ' + type
            );
    }
}
