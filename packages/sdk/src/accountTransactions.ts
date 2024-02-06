import { Buffer } from 'buffer/index.js';
import { serializeCredentialDeploymentInfo } from './serialization.js';
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
} from './serializationHelpers.js';
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
    OpenStatus,
    BakerKeysWithProofs,
    UrlString,
    DelegationTarget,
    Base58String,
    HexString,
} from './types.js';
import * as AccountAddress from './types/AccountAddress.js';
import { DataBlob } from './types/DataBlob.js';
import * as CcdAmount from './types/CcdAmount.js';
import { Cursor } from './deserializationHelpers.js';
import * as ReceiveName from './types/ReceiveName.js';
import * as Parameter from './types/Parameter.js';
import {
    ContractAddress,
    ContractName,
    Energy,
    ModuleReference,
} from './pub/types.js';

/**
 * A handler for a specific {@linkcode AccountTransactionType}.
 */
interface AccountTransactionHandler<
    PayloadType extends AccountTransactionPayload = AccountTransactionPayload,
    JSONType = PayloadType
> {
    /**
     * Serializes the payload to a buffer.
     * @param payload - The payload to serialize.
     * @returns The serialized payload.
     */
    serialize: (payload: PayloadType) => Buffer;

    /**
     * Deserializes the serialized payload into the payload type.
     * @param serializedPayload - The serialized payload to be deserialized.
     * @returns The deserialized payload.
     */
    deserialize: (serializedPayload: Cursor) => PayloadType;

    /**
     * Gets the base energy cost for the given payload.
     * @param payload - The payload for which to get the base energy cost.
     * @returns The base energy cost for the payload.
     */
    getBaseEnergyCost: (payload: PayloadType) => bigint;

    /**
     * Converts the payload into JSON format.
     * @param payload - The payload to be converted into JSON.
     * @returns The payload in JSON format.
     */
    toJSON: (payload: PayloadType) => JSONType;

    /**
     * Converts a JSON-serialized payload into the payload type.
     * @param json - The JSON to be converted back into the payload.
     * @returns The payload obtained from the JSON.
     */
    fromJSON: (json: JSONType) => PayloadType;
}

interface SimpleTransferPayloadJSON {
    toAddress: Base58String;
    amount: bigint;
}

export class SimpleTransferHandler
    implements
        AccountTransactionHandler<
            SimpleTransferPayload,
            SimpleTransferPayloadJSON
        >
{
    getBaseEnergyCost(): bigint {
        return 300n;
    }

    serialize(transfer: SimpleTransferPayload): Buffer {
        const serializedToAddress = AccountAddress.toBuffer(transfer.toAddress);
        const serializedAmount = encodeWord64(transfer.amount.microCcdAmount);
        return Buffer.concat([serializedToAddress, serializedAmount]);
    }

    deserialize(serializedPayload: Cursor): SimpleTransferPayload {
        const toAddress = AccountAddress.fromBuffer(
            Buffer.from(serializedPayload.read(32))
        );
        const amount = CcdAmount.fromMicroCcd(
            serializedPayload.read(8).readBigUInt64BE(0)
        );
        return {
            toAddress,
            amount,
        };
    }

    toJSON(transfer: SimpleTransferPayload): SimpleTransferPayloadJSON {
        return {
            toAddress: AccountAddress.toBase58(transfer.toAddress),
            amount: transfer.amount.microCcdAmount,
        };
    }

    fromJSON(json: SimpleTransferPayloadJSON): SimpleTransferPayload {
        return {
            toAddress: AccountAddress.fromBase58(json.toAddress),
            amount: CcdAmount.fromMicroCcd(json.amount),
        };
    }
}

interface SimpleTransferWithMemoPayloadJSON extends SimpleTransferPayloadJSON {
    memo: HexString;
}

export class SimpleTransferWithMemoHandler
    extends SimpleTransferHandler
    implements
        AccountTransactionHandler<
            SimpleTransferWithMemoPayload,
            SimpleTransferWithMemoPayloadJSON
        >
{
    serialize(transfer: SimpleTransferWithMemoPayload): Buffer {
        const serializedToAddress = AccountAddress.toBuffer(transfer.toAddress);
        const serializedMemo = encodeDataBlob(transfer.memo);
        const serializedAmount = encodeWord64(transfer.amount.microCcdAmount);
        return Buffer.concat([
            serializedToAddress,
            serializedMemo,
            serializedAmount,
        ]);
    }

    deserialize(serializedPayload: Cursor): SimpleTransferWithMemoPayload {
        const toAddress = AccountAddress.fromBuffer(
            Buffer.from(serializedPayload.read(32))
        );
        const memoLength = serializedPayload.read(2).readUInt16BE(0);
        const memo = new DataBlob(
            Buffer.from(serializedPayload.read(memoLength))
        );
        const amount = CcdAmount.fromMicroCcd(
            serializedPayload.read(8).readBigUInt64BE(0)
        );
        return {
            toAddress,
            memo,
            amount,
        };
    }

    toJSON(
        transfer: SimpleTransferWithMemoPayload
    ): SimpleTransferWithMemoPayloadJSON {
        return {
            toAddress: AccountAddress.toBase58(transfer.toAddress),
            memo: transfer.memo.toJSON(),
            amount: transfer.amount.microCcdAmount,
        };
    }

    fromJSON(
        json: SimpleTransferWithMemoPayloadJSON
    ): SimpleTransferWithMemoPayload {
        return {
            toAddress: AccountAddress.fromBase58(json.toAddress),
            memo: DataBlob.fromJSON(json.memo),
            amount: CcdAmount.fromMicroCcd(json.amount),
        };
    }
}

interface DeployModulePayloadJSON {
    source: HexString;
    version?: number;
}

export class DeployModuleHandler
    implements
        AccountTransactionHandler<DeployModulePayload, DeployModulePayloadJSON>
{
    getBaseEnergyCost(payload: DeployModulePayload): bigint {
        let length = payload.source.byteLength;
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
            return Buffer.from(payload.source);
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

    toJSON(payload: DeployModulePayload): DeployModulePayloadJSON {
        return {
            source: Buffer.from(payload.source).toString('hex'),
            version: payload.version,
        };
    }

    fromJSON(json: DeployModulePayloadJSON): DeployModulePayload {
        return {
            source: Buffer.from(json.source, 'hex'),
            version: json.version,
        };
    }
}

interface InitContractPayloadJSON {
    amount: bigint;
    moduleRef: HexString;
    initName: string;
    param: HexString;
    maxContractExecutionEnergy: bigint;
}

export class InitContractHandler
    implements
        AccountTransactionHandler<InitContractPayload, InitContractPayloadJSON>
{
    getBaseEnergyCost(payload: InitContractPayload): bigint {
        return payload.maxContractExecutionEnergy.value;
    }

    serialize(payload: InitContractPayload): Buffer {
        const serializedAmount = encodeWord64(payload.amount.microCcdAmount);
        const initNameBuffer = Buffer.from(
            'init_' + payload.initName.value,
            'utf8'
        );
        const serializedInitName = packBufferWithWord16Length(initNameBuffer);
        const serializedModuleRef = payload.moduleRef.decodedModuleRef;
        const parameterBuffer = Parameter.toBuffer(payload.param);
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

    toJSON(payload: InitContractPayload): InitContractPayloadJSON {
        return {
            amount: payload.amount.microCcdAmount,
            moduleRef: ModuleReference.toHexString(payload.moduleRef),
            initName: ContractName.toString(payload.initName),
            param: Parameter.toHexString(payload.param),
            maxContractExecutionEnergy:
                payload.maxContractExecutionEnergy.value,
        };
    }

    fromJSON(json: InitContractPayloadJSON): InitContractPayload {
        return {
            amount: CcdAmount.fromMicroCcd(json.amount),
            moduleRef: ModuleReference.fromHexString(json.moduleRef),
            initName: ContractName.fromString(json.initName),
            param: Parameter.fromHexString(json.param),
            maxContractExecutionEnergy: Energy.create(
                json.maxContractExecutionEnergy
            ),
        };
    }
}

interface UpdateContractPayloadJSON {
    amount: bigint;
    address: ContractAddress.SchemaValue;
    receiveName: string;
    message: HexString;
    maxContractExecutionEnergy: bigint;
}

export class UpdateContractHandler
    implements
        AccountTransactionHandler<
            UpdateContractPayload,
            UpdateContractPayloadJSON
        >
{
    getBaseEnergyCost(payload: UpdateContractPayload): bigint {
        return payload.maxContractExecutionEnergy.value;
    }

    serialize(payload: UpdateContractPayload): Buffer {
        const serializedAmount = encodeWord64(payload.amount.microCcdAmount);
        const serializeIndex = encodeWord64(payload.address.index);
        const serializeSubindex = encodeWord64(payload.address.subindex);
        const serializedContractAddress = Buffer.concat([
            serializeIndex,
            serializeSubindex,
        ]);
        const receiveNameBuffer = Buffer.from(
            ReceiveName.toString(payload.receiveName),
            'utf8'
        );
        const serializedReceiveName =
            packBufferWithWord16Length(receiveNameBuffer);
        const parameterBuffer = Parameter.toBuffer(payload.message);
        const serializedParameters =
            packBufferWithWord16Length(parameterBuffer);
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

    toJSON(payload: UpdateContractPayload): UpdateContractPayloadJSON {
        return {
            amount: payload.amount.microCcdAmount,
            address: ContractAddress.toSchemaValue(payload.address),
            receiveName: ReceiveName.toString(payload.receiveName),
            message: Parameter.toHexString(payload.message),
            maxContractExecutionEnergy:
                payload.maxContractExecutionEnergy.value,
        };
    }

    fromJSON(json: UpdateContractPayloadJSON): UpdateContractPayload {
        return {
            amount: CcdAmount.fromMicroCcd(json.amount),
            address: ContractAddress.fromSchemaValue(json.address),
            receiveName: ReceiveName.fromString(json.receiveName),
            message: Parameter.fromHexString(json.message),
            maxContractExecutionEnergy: Energy.create(
                json.maxContractExecutionEnergy
            ),
        };
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

    toJSON(
        updateCredentials: UpdateCredentialsPayload
    ): UpdateCredentialsPayload {
        // UpdateCredentialsPayload is already fully JSON serializable.
        return updateCredentials;
    }

    fromJSON(json: UpdateCredentialsPayload): UpdateCredentialsPayload {
        return json;
    }
}

interface RegisterDataPayloadJSON {
    data: HexString;
}

export class RegisterDataHandler
    implements
        AccountTransactionHandler<RegisterDataPayload, RegisterDataPayloadJSON>
{
    getBaseEnergyCost(): bigint {
        return 300n;
    }

    serialize(payload: RegisterDataPayload): Buffer {
        return encodeDataBlob(payload.data);
    }

    deserialize(serializedPayload: Cursor): RegisterDataPayload {
        const memoLength = serializedPayload.read(2).readUInt16BE(0);
        return {
            data: new DataBlob(Buffer.from(serializedPayload.read(memoLength))),
        };
    }

    toJSON(payload: RegisterDataPayload): RegisterDataPayloadJSON {
        return {
            data: payload.data.toJSON(),
        };
    }

    fromJSON(json: RegisterDataPayloadJSON): RegisterDataPayload {
        return {
            // The first 2 bytes are the length of the data buffer, so we need to remove them.
            data: DataBlob.fromJSON(json.data),
        };
    }
}

interface ConfigureBakerPayloadJSON {
    stake?: bigint;
    restakeEarnings?: boolean;
    openForDelegation?: OpenStatus;
    keys?: BakerKeysWithProofs;
    metadataUrl?: UrlString;
    transactionFeeCommission?: number;
    bakingRewardCommission?: number;
    finalizationRewardCommission?: number;
}

export class ConfigureBakerHandler
    implements
        AccountTransactionHandler<
            ConfigureBakerPayload,
            ConfigureBakerPayloadJSON
        >
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

    toJSON(payload: ConfigureBakerPayload): ConfigureBakerPayloadJSON {
        return {
            ...payload,
            stake: payload.stake?.microCcdAmount,
        };
    }

    fromJSON(json: ConfigureBakerPayloadJSON): ConfigureBakerPayload {
        return {
            ...json,
            stake: json.stake ? CcdAmount.fromMicroCcd(json.stake) : undefined,
        };
    }
}

interface ConfigureDelegationPayloadJSON {
    stake?: bigint;
    restakeEarnings?: boolean;
    delegationTarget?: DelegationTarget;
}

export class ConfigureDelegationHandler
    implements
        AccountTransactionHandler<
            ConfigureDelegationPayload,
            ConfigureDelegationPayloadJSON
        >
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

    toJSON(
        payload: ConfigureDelegationPayload
    ): ConfigureDelegationPayloadJSON {
        return {
            ...payload,
            stake: payload.stake?.microCcdAmount,
        };
    }

    fromJSON(json: ConfigureDelegationPayloadJSON): ConfigureDelegationPayload {
        return {
            ...json,
            stake: json.stake ? CcdAmount.fromMicroCcd(json.stake) : undefined,
        };
    }
}

export type AccountTransactionPayloadJSON =
    | SimpleTransferPayloadJSON
    | SimpleTransferWithMemoPayloadJSON
    | DeployModulePayloadJSON
    | InitContractPayloadJSON
    | UpdateContractPayloadJSON
    | UpdateCredentialsPayload
    | RegisterDataPayloadJSON
    | ConfigureDelegationPayloadJSON
    | ConfigureBakerPayloadJSON;

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
): AccountTransactionHandler<
    AccountTransactionPayload,
    AccountTransactionPayloadJSON
>;
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
