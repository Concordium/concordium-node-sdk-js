import { Buffer } from 'buffer/';
import { serializeCredentialDeploymentInfo } from './serialization';
import {
    encodeWord64,
    encodeDataBlob,
    encodeWord32,
    packBufferWithWord32Length,
    packBufferWithWord16Length,
    serializeList,
    encodeWord8,
    serializeConfigureDelegationPayload,
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
    ConfigureDelegationPayload,
} from './types';
import { AccountAddress } from './types/accountAddress';
import { DataBlob } from './types/DataBlob';
import { GtuAmount } from './types/gtuAmount';

interface AccountTransactionHandler<
    PayloadType extends AccountTransactionPayload = AccountTransactionPayload
> {
    serialize: (payload: PayloadType) => Buffer;
    deserialize: (serializedPayload: Buffer) => PayloadType;
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

    deserialize(serializedPayload: Buffer): SimpleTransferPayload {
        const toAddress = AccountAddress.fromBytes(
            serializedPayload.subarray(0, 32)
        );
        const amount = new GtuAmount(serializedPayload.readBigUInt64BE(32));
        return {
            toAddress,
            amount,
        };
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

    deserialize(serializedPayload: Buffer): SimpleTransferWithMemoPayload {
        const toAddress = AccountAddress.fromBytes(
            serializedPayload.subarray(0, 32)
        );
        const memoLength = serializedPayload.readUInt16BE(32);
        const memo = new DataBlob(
            serializedPayload.subarray(32 + 2, 32 + 2 + memoLength)
        );
        const amount = new GtuAmount(
            serializedPayload.readBigUInt64BE(32 + 2 + memoLength)
        );
        return {
            toAddress,
            memo,
            amount,
        };
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
        if (payload.version === undefined) {
            // Assume the module has version and length embedded
            return payload.content;
        } else {
            // Assume the module is legacy build, which doesn't contain version and length
            const serializedWasm = packBufferWithWord32Length(payload.content);
            const serializedVersion = encodeWord32(payload.version);
            return Buffer.concat([serializedVersion, serializedWasm]);
        }
    }

    deserialize(): DeployModulePayload {
        throw new Error('deserialize not supported');
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

    deserialize(): InitContractPayload {
        throw new Error('deserialize not supported');
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

    deserialize(): UpdateContractPayload {
        throw new Error('deserialize not supported');
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

    deserialize(): UpdateCredentialsPayload {
        throw new Error('deserialize not supported');
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

    deserialize(serializedPayload: Buffer): RegisterDataPayload {
        const memoLength = serializedPayload.readUInt16BE(32);
        return {
            data: new DataBlob(serializedPayload.subarray(2, 2 + memoLength)),
        };
    }
}

export class ConfigureDelegationHandler
    implements AccountTransactionHandler<ConfigureDelegationPayload>
{
    getBaseEnergyCost(): bigint {
        return 300n;
    }

    serialize(payload: ConfigureDelegationPayload): Buffer {
        return serializeConfigureDelegationPayload(payload);
    }

    deserialize(): ConfigureDelegationPayload {
        throw new Error('deserialize not supported');
    }
}

export function getAccountTransactionHandler(
    type: AccountTransactionType
): AccountTransactionHandler;
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
    type: AccountTransactionType.ConfigureDelegation
): ConfigureDelegationHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
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
        case AccountTransactionType.ConfigureDelegation:
            return new ConfigureDelegationHandler();
        default:
            throw new Error(
                'The provided type does not have a handler: ' + type
            );
    }
}
