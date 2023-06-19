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
    serializeConfigureBakerPayload,
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
    ConfigureBakerPayload,
} from './types';
import { AccountAddress } from './types/accountAddress';
import { DataBlob } from './types/DataBlob';
import { CcdAmount } from './types/ccdAmount';
import { Readable } from 'stream';

interface AccountTransactionHandler<
    PayloadType extends AccountTransactionPayload = AccountTransactionPayload
> {
    serialize: (payload: PayloadType) => Buffer;
    deserialize: (serializedPayload: Readable) => PayloadType;
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
        const serializedAmount = encodeWord64(transfer.amount.microCcdAmount);
        return Buffer.concat([serializedToAddress, serializedAmount]);
    }

    deserialize(serializedPayload: Readable): SimpleTransferPayload {
        const toAddress = AccountAddress.fromBytes(
            Buffer.from(serializedPayload.read(32))
        );
        const amount = new CcdAmount(
            serializedPayload.read(8).readBigUInt64BE(0)
        );
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
        const serializedAmount = encodeWord64(transfer.amount.microCcdAmount);
        return Buffer.concat([
            serializedToAddress,
            serializedMemo,
            serializedAmount,
        ]);
    }

    deserialize(serializedPayload: Readable): SimpleTransferWithMemoPayload {
        const toAddress = AccountAddress.fromBytes(
            Buffer.from(serializedPayload.read(32))
        );
        const memoLength = serializedPayload.read(2).readUInt16BE(0);
        const memo = new DataBlob(
            Buffer.from(serializedPayload.read(memoLength))
        );
        const amount = new CcdAmount(
            serializedPayload.read(8).readBigUInt64BE(0)
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
        let length = payload.source.length;
        if (payload.version === undefined) {
            // Remove the 8 bytes from the embedded version and length.
            length -= 8;
        }
        const cost = Math.floor(length / 10);
        return BigInt(cost);
    }

    serialize(payload: DeployModulePayload): Buffer {
        if (payload.version === undefined) {
            // Assume the module has version and length embedded
            return payload.source;
        } else {
            // Assume the module is legacy build, which doesn't contain version and length
            const serializedWasm = packBufferWithWord32Length(payload.source);
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
        const serializedAmount = encodeWord64(payload.amount.microCcdAmount);
        const initNameBuffer = Buffer.from('init_' + payload.initName, 'utf8');
        const serializedInitName = packBufferWithWord16Length(initNameBuffer);
        const serializedModuleRef = payload.moduleRef.decodedModuleRef;
        const parameterBuffer = payload.param;
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
        const serializedAmount = encodeWord64(payload.amount.microCcdAmount);
        const serializeIndex = encodeWord64(payload.address.index);
        const serializeSubindex = encodeWord64(payload.address.subindex);
        const serializedContractAddress = Buffer.concat([
            serializeIndex,
            serializeSubindex,
        ]);
        const receiveNameBuffer = Buffer.from(payload.receiveName, 'utf8');
        const serializedReceiveName =
            packBufferWithWord16Length(receiveNameBuffer);
        const parameterBuffer = payload.message;
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

    deserialize(serializedPayload: Readable): RegisterDataPayload {
        const memoLength = serializedPayload.read(2).readUInt16BE(0);
        return {
            data: new DataBlob(Buffer.from(serializedPayload.read(memoLength))),
        };
    }
}

export class ConfigureBakerHandler
    implements AccountTransactionHandler<ConfigureBakerPayload>
{
    getBaseEnergyCost(payload: ConfigureBakerPayload): bigint {
        if (payload.keys) {
            return 4050n;
        } else {
            return 300n;
        }
    }

    serialize(payload: ConfigureBakerPayload): Buffer {
        return serializeConfigureBakerPayload(payload);
    }

    deserialize(): ConfigureBakerPayload {
        throw new Error('deserialize not supported');
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
    type: AccountTransactionType.Transfer
): SimpleTransferHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType.TransferWithMemo
): SimpleTransferWithMemoHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType.UpdateCredentials
): UpdateCredentialsHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType.DeployModule
): DeployModuleHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType.InitContract
): InitContractHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType.Update
): UpdateContractHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType.RegisterData
): RegisterDataHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType.ConfigureDelegation
): ConfigureDelegationHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType.ConfigureBaker
): ConfigureBakerHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
    switch (type) {
        case AccountTransactionType.Transfer:
            return new SimpleTransferHandler();
        case AccountTransactionType.TransferWithMemo:
            return new SimpleTransferWithMemoHandler();
        case AccountTransactionType.DeployModule:
            return new DeployModuleHandler();
        case AccountTransactionType.InitContract:
            return new InitContractHandler();
        case AccountTransactionType.Update:
            return new UpdateContractHandler();
        case AccountTransactionType.UpdateCredentials:
            return new UpdateCredentialsHandler();
        case AccountTransactionType.RegisterData:
            return new RegisterDataHandler();
        case AccountTransactionType.ConfigureDelegation:
            return new ConfigureDelegationHandler();
        case AccountTransactionType.ConfigureBaker:
            return new ConfigureBakerHandler();
        default:
            throw new Error(
                'The provided type does not have a handler: ' + type
            );
    }
}
