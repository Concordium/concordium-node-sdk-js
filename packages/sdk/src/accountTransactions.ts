import { Buffer } from 'buffer/index.js';

import { Cursor } from './deserializationHelpers.js';
import { Cbor, TokenId, TokenOperationType } from './plt/index.js';
import { ContractAddress, ContractName, Energy, ModuleReference } from './pub/types.js';
import { serializeCredentialDeploymentInfo } from './serialization.js';
import {
    encodeDataBlob,
    encodeWord8,
    encodeWord32,
    encodeWord64,
    packBufferWithWord8Length,
    packBufferWithWord16Length,
    packBufferWithWord32Length,
    serializeConfigureBakerPayload,
    serializeConfigureDelegationPayload,
    serializeList,
} from './serializationHelpers.js';
import {
    AccountTransactionPayload,
    AccountTransactionType,
    BakerKeysWithProofs,
    Base58String,
    ConfigureBakerPayload,
    ConfigureDelegationPayload,
    DelegationTarget,
    DelegationTargetType,
    DeployModulePayload,
    HexString,
    InitContractPayload,
    OpenStatus,
    RegisterDataPayload,
    SimpleTransferPayload,
    SimpleTransferWithMemoPayload,
    TokenUpdatePayload,
    UpdateContractPayload,
    UpdateCredentialsPayload,
    UrlString,
} from './types.js';
import * as AccountAddress from './types/AccountAddress.js';
import * as CcdAmount from './types/CcdAmount.js';
import { DataBlob } from './types/DataBlob.js';
import * as Parameter from './types/Parameter.js';
import * as ReceiveName from './types/ReceiveName.js';

/**
 * A handler for a specific {@linkcode AccountTransactionType}.
 */
export interface AccountTransactionHandler<
    PayloadType extends AccountTransactionPayload = AccountTransactionPayload,
    JSONType = PayloadType,
> {
    /**
     * Serializes the payload to a buffer.
     * This does NOT include the serialized transaction type. To have this included, use {@linkcode serializeAccountTransactionPayload} instead.
     *
     * @param payload - The payload to serialize.
     * @returns The serialized payload.
     * @throws If serializing the type was not possible.
     */
    serialize: (payload: PayloadType) => Buffer;

    /**
     * Deserializes the serialized payload into the payload type.
     * @param serializedPayload - The serialized payload to be deserialized.
     * @returns The deserialized payload.
     * @throws If deserializing the type was not possible.
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

export interface SimpleTransferPayloadJSON {
    toAddress: Base58String;
    amount: string;
}

export class SimpleTransferHandler
    implements AccountTransactionHandler<SimpleTransferPayload, SimpleTransferPayloadJSON>
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
        const toAddress = AccountAddress.fromBuffer(Buffer.from(serializedPayload.read(32)));
        const amount = CcdAmount.fromMicroCcd(serializedPayload.read(8).readBigUInt64BE(0));
        return {
            toAddress,
            amount,
        };
    }

    toJSON(transfer: SimpleTransferPayload): SimpleTransferPayloadJSON {
        return {
            toAddress: transfer.toAddress.toJSON(),
            amount: transfer.amount.toJSON(),
        };
    }

    fromJSON(json: SimpleTransferPayloadJSON): SimpleTransferPayload {
        return {
            toAddress: AccountAddress.fromJSON(json.toAddress),
            amount: CcdAmount.fromJSON(json.amount),
        };
    }
}

export interface SimpleTransferWithMemoPayloadJSON extends SimpleTransferPayloadJSON {
    memo: HexString;
}

export class SimpleTransferWithMemoHandler
    extends SimpleTransferHandler
    implements AccountTransactionHandler<SimpleTransferWithMemoPayload, SimpleTransferWithMemoPayloadJSON>
{
    serialize(transfer: SimpleTransferWithMemoPayload): Buffer {
        const serializedToAddress = AccountAddress.toBuffer(transfer.toAddress);
        const serializedMemo = encodeDataBlob(transfer.memo);
        const serializedAmount = encodeWord64(transfer.amount.microCcdAmount);
        return Buffer.concat([serializedToAddress, serializedMemo, serializedAmount]);
    }

    deserialize(serializedPayload: Cursor): SimpleTransferWithMemoPayload {
        const toAddress = AccountAddress.fromBuffer(Buffer.from(serializedPayload.read(32)));
        const memoLength = serializedPayload.read(2).readUInt16BE(0);
        const memo = new DataBlob(Buffer.from(serializedPayload.read(memoLength)));
        const amount = CcdAmount.fromMicroCcd(serializedPayload.read(8).readBigUInt64BE(0));
        return {
            toAddress,
            memo,
            amount,
        };
    }

    toJSON(transfer: SimpleTransferWithMemoPayload): SimpleTransferWithMemoPayloadJSON {
        return {
            toAddress: transfer.toAddress.toJSON(),
            memo: transfer.memo.toJSON(),
            amount: transfer.amount.toJSON(),
        };
    }

    fromJSON(json: SimpleTransferWithMemoPayloadJSON): SimpleTransferWithMemoPayload {
        return {
            toAddress: AccountAddress.fromJSON(json.toAddress),
            memo: DataBlob.fromJSON(json.memo),
            amount: CcdAmount.fromJSON(json.amount),
        };
    }
}

export interface DeployModulePayloadJSON {
    source: HexString;
    version?: number;
}

export class DeployModuleHandler implements AccountTransactionHandler<DeployModulePayload, DeployModulePayloadJSON> {
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
            version: json.version !== undefined ? Number(json.version) : undefined,
        };
    }
}

export interface InitContractPayloadJSON {
    amount: string;
    moduleRef: HexString;
    initName: string;
    param: HexString;
    maxContractExecutionEnergy: bigint;
}

export class InitContractHandler implements AccountTransactionHandler<InitContractPayload, InitContractPayloadJSON> {
    getBaseEnergyCost(payload: InitContractPayload): bigint {
        return payload.maxContractExecutionEnergy.value;
    }

    serialize(payload: InitContractPayload): Buffer {
        const serializedAmount = encodeWord64(payload.amount.microCcdAmount);
        const initNameBuffer = Buffer.from('init_' + payload.initName.value, 'utf8');
        const serializedInitName = packBufferWithWord16Length(initNameBuffer);
        const serializedModuleRef = payload.moduleRef.decodedModuleRef;
        const parameterBuffer = Parameter.toBuffer(payload.param);
        const serializedParameters = packBufferWithWord16Length(parameterBuffer);
        return Buffer.concat([serializedAmount, serializedModuleRef, serializedInitName, serializedParameters]);
    }

    deserialize(): InitContractPayload {
        throw new Error('deserialize not supported');
    }

    toJSON(payload: InitContractPayload): InitContractPayloadJSON {
        return {
            amount: payload.amount.toJSON(),
            moduleRef: payload.moduleRef.toJSON(),
            initName: payload.initName.toJSON(),
            param: payload.param.toJSON(),
            maxContractExecutionEnergy: payload.maxContractExecutionEnergy.value,
        };
    }

    fromJSON(json: InitContractPayloadJSON): InitContractPayload {
        return {
            amount: CcdAmount.fromJSON(json.amount),
            moduleRef: ModuleReference.fromJSON(json.moduleRef),
            initName: ContractName.fromJSON(json.initName),
            param: Parameter.fromJSON(json.param),
            maxContractExecutionEnergy: Energy.create(json.maxContractExecutionEnergy),
        };
    }
}

export interface UpdateContractPayloadJSON {
    amount: string;
    address: ContractAddress.SchemaValue;
    receiveName: string;
    message: HexString;
    maxContractExecutionEnergy: bigint;
}

export class UpdateContractHandler
    implements AccountTransactionHandler<UpdateContractPayload, UpdateContractPayloadJSON>
{
    getBaseEnergyCost(payload: UpdateContractPayload): bigint {
        return payload.maxContractExecutionEnergy.value;
    }

    serialize(payload: UpdateContractPayload): Buffer {
        const serializedAmount = encodeWord64(payload.amount.microCcdAmount);
        const serializeIndex = encodeWord64(payload.address.index);
        const serializeSubindex = encodeWord64(payload.address.subindex);
        const serializedContractAddress = Buffer.concat([serializeIndex, serializeSubindex]);
        const receiveNameBuffer = Buffer.from(payload.receiveName.toString(), 'utf8');
        const serializedReceiveName = packBufferWithWord16Length(receiveNameBuffer);
        const parameterBuffer = Parameter.toBuffer(payload.message);
        const serializedParameters = packBufferWithWord16Length(parameterBuffer);
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
            amount: payload.amount.toJSON(),
            address: ContractAddress.toSchemaValue(payload.address),
            receiveName: payload.receiveName.toJSON(),
            message: payload.message.toJSON(),
            maxContractExecutionEnergy: payload.maxContractExecutionEnergy.value,
        };
    }

    fromJSON(json: UpdateContractPayloadJSON): UpdateContractPayload {
        return {
            amount: CcdAmount.fromJSON(json.amount),
            address: ContractAddress.fromSchemaValue(json.address),
            receiveName: ReceiveName.fromJSON(json.receiveName),
            message: Parameter.fromJSON(json.message),
            maxContractExecutionEnergy: Energy.create(json.maxContractExecutionEnergy),
        };
    }
}

export class UpdateCredentialsHandler implements AccountTransactionHandler<UpdateCredentialsPayload> {
    getBaseEnergyCost(updateCredentials: UpdateCredentialsPayload): bigint {
        const newCredentialsCost = updateCredentials.newCredentials
            .map((credential) => {
                const numberOfKeys = BigInt(Object.keys(credential.cdi.credentialPublicKeys.keys).length);
                return 54000n + 100n * numberOfKeys;
            })
            .reduce((prev, curr) => prev + curr, BigInt(0));

        const currentCredentialsCost = 500n * updateCredentials.currentNumberOfCredentials;

        return 500n + currentCredentialsCost + newCredentialsCost;
    }

    serialize(updateCredentials: UpdateCredentialsPayload): Buffer {
        const serializedAddedCredentials = serializeList(
            updateCredentials.newCredentials,
            encodeWord8,
            ({ index, cdi }) => Buffer.concat([encodeWord8(index), serializeCredentialDeploymentInfo(cdi)])
        );

        const serializedRemovedCredIds = serializeList(
            updateCredentials.removeCredentialIds,
            encodeWord8,
            (credId: string) => Buffer.from(credId, 'hex')
        );
        const serializedThreshold = encodeWord8(updateCredentials.threshold);
        return Buffer.concat([serializedAddedCredentials, serializedRemovedCredIds, serializedThreshold]);
    }

    deserialize(): UpdateCredentialsPayload {
        throw new Error('deserialize not supported');
    }

    toJSON(updateCredentials: UpdateCredentialsPayload): UpdateCredentialsPayload {
        return updateCredentials;
    }

    fromJSON(json: UpdateCredentialsPayload): UpdateCredentialsPayload {
        return {
            ...json,
            currentNumberOfCredentials: BigInt(json.currentNumberOfCredentials),
            threshold: Number(json.threshold),
            newCredentials: json.newCredentials.map((nc) => ({
                index: Number(nc.index),
                cdi: {
                    ...nc.cdi,
                    credentialPublicKeys: {
                        ...nc.cdi.credentialPublicKeys,
                        threshold: Number(nc.cdi.credentialPublicKeys.threshold),
                    },
                    ipIdentity: Number(nc.cdi.ipIdentity),
                    revocationThreshold: Number(nc.cdi.revocationThreshold),
                },
            })),
        };
    }
}

export interface RegisterDataPayloadJSON {
    data: HexString;
}

export class RegisterDataHandler implements AccountTransactionHandler<RegisterDataPayload, RegisterDataPayloadJSON> {
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

export interface ConfigureBakerPayloadJSON {
    stake?: string;
    restakeEarnings?: boolean;
    openForDelegation?: OpenStatus;
    keys?: BakerKeysWithProofs;
    metadataUrl?: UrlString;
    transactionFeeCommission?: number;
    bakingRewardCommission?: number;
    finalizationRewardCommission?: number;
}

export class ConfigureBakerHandler
    implements AccountTransactionHandler<ConfigureBakerPayload, ConfigureBakerPayloadJSON>
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
            stake: payload.stake?.toJSON(),
        };
    }

    fromJSON(json: ConfigureBakerPayloadJSON): ConfigureBakerPayload {
        return {
            ...json,
            stake: json.stake ? CcdAmount.fromJSON(json.stake) : undefined,
            openForDelegation: json.openForDelegation !== undefined ? Number(json.openForDelegation) : undefined,
            transactionFeeCommission:
                json.transactionFeeCommission !== undefined ? Number(json.transactionFeeCommission) : undefined,
            bakingRewardCommission:
                json.bakingRewardCommission !== undefined ? Number(json.bakingRewardCommission) : undefined,
            finalizationRewardCommission:
                json.finalizationRewardCommission !== undefined ? Number(json.finalizationRewardCommission) : undefined,
        };
    }
}

export interface ConfigureDelegationPayloadJSON {
    stake?: string;
    restakeEarnings?: boolean;
    delegationTarget?: DelegationTarget;
}

export class ConfigureDelegationHandler
    implements AccountTransactionHandler<ConfigureDelegationPayload, ConfigureDelegationPayloadJSON>
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

    toJSON(payload: ConfigureDelegationPayload): ConfigureDelegationPayloadJSON {
        return {
            ...payload,
            stake: payload.stake?.toJSON(),
        };
    }

    fromJSON(json: ConfigureDelegationPayloadJSON): ConfigureDelegationPayload {
        let result: ConfigureDelegationPayload = {
            ...json,
            stake: json.stake ? CcdAmount.fromJSON(json.stake) : undefined,
        };

        if (
            json.delegationTarget === undefined ||
            json.delegationTarget.delegateType === DelegationTargetType.PassiveDelegation
        ) {
            return result;
        }

        result.delegationTarget = { ...json.delegationTarget, bakerId: BigInt(json.delegationTarget.bakerId) };
        return result;
    }
}

export type TokenUpdatePayloadJSON = {
    tokenId: TokenId.JSON;
    operations: Cbor.JSON;
};

export class TokenUpdateHandler implements AccountTransactionHandler<TokenUpdatePayload, TokenUpdatePayloadJSON> {
    serialize(payload: TokenUpdatePayload): Buffer {
        const tokenId = packBufferWithWord8Length(TokenId.toBytes(payload.tokenId));
        const ops = packBufferWithWord32Length(payload.operations.bytes);
        return Buffer.concat([tokenId, ops]);
    }
    deserialize(serializedPayload: Cursor): TokenUpdatePayload {
        let len = serializedPayload.read(1).readUInt8(0);
        const tokenId = TokenId.fromBytes(serializedPayload.read(len));

        len = serializedPayload.read(4).readUInt32BE(0);
        const operations = Cbor.fromBuffer(serializedPayload.read(len));
        return { tokenId, operations };
    }
    getBaseEnergyCost(payload: TokenUpdatePayload): bigint {
        // TODO: update costs when finalized costs are determined.
        const operations = Cbor.decode(payload.operations, 'TokenOperation[]');
        // The base cost for a token transaction.
        let energyCost = 300n;
        // Additional cost of specific PLT operations
        const PLT_TRANSFER_COST = 100n;
        const PLT_MINT_COST = 50n;
        const PLT_BURN_COST = 50n;
        const PLT_LIST_UPDATE_COST = 50n;
        const PLT_PAUSE_COST = 50n;

        for (const operation of operations) {
            switch (true) {
                case TokenOperationType.Transfer in operation:
                    energyCost += PLT_TRANSFER_COST;
                    break;
                case TokenOperationType.Mint in operation:
                    energyCost += PLT_MINT_COST;
                    break;
                case TokenOperationType.Burn in operation:
                    energyCost += PLT_BURN_COST;
                    break;
                case TokenOperationType.AddAllowList in operation:
                case TokenOperationType.RemoveAllowList in operation:
                case TokenOperationType.AddDenyList in operation:
                case TokenOperationType.RemoveDenyList in operation:
                    energyCost += PLT_LIST_UPDATE_COST;
                    break;
                case TokenOperationType.Pause in operation:
                case TokenOperationType.Unpause in operation:
                    energyCost += PLT_PAUSE_COST;
                    break;
            }
        }

        return energyCost;
    }
    toJSON(payload: TokenUpdatePayload): TokenUpdatePayloadJSON {
        return {
            tokenId: payload.tokenId.toJSON(),
            operations: payload.operations.toJSON(),
        };
    }
    fromJSON(json: TokenUpdatePayloadJSON): TokenUpdatePayload {
        return {
            tokenId: TokenId.fromJSON(json.tokenId),
            operations: Cbor.fromJSON(json.operations),
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
    | ConfigureBakerPayloadJSON
    | TokenUpdatePayloadJSON;

export function getAccountTransactionHandler(type: AccountTransactionType.Transfer): SimpleTransferHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType.TransferWithMemo
): SimpleTransferWithMemoHandler;
export function getAccountTransactionHandler(type: AccountTransactionType.UpdateCredentials): UpdateCredentialsHandler;
export function getAccountTransactionHandler(type: AccountTransactionType.DeployModule): DeployModuleHandler;
export function getAccountTransactionHandler(type: AccountTransactionType.InitContract): InitContractHandler;
export function getAccountTransactionHandler(type: AccountTransactionType.Update): UpdateContractHandler;
export function getAccountTransactionHandler(type: AccountTransactionType.RegisterData): RegisterDataHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType.ConfigureDelegation
): ConfigureDelegationHandler;
export function getAccountTransactionHandler(type: AccountTransactionType.ConfigureBaker): ConfigureBakerHandler;
export function getAccountTransactionHandler(type: AccountTransactionType.TokenUpdate): TokenUpdateHandler;
export function getAccountTransactionHandler(
    type: AccountTransactionType
): AccountTransactionHandler<AccountTransactionPayload, AccountTransactionPayloadJSON>;
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
        case AccountTransactionType.TokenUpdate:
            return new TokenUpdateHandler();
        default:
            throw new Error('The provided type does not have a handler: ' + type);
    }
}
