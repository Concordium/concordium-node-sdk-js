import { deserializeUint8 } from '../deserialization.js';
import { Cursor } from '../deserializationHelpers.js';
import {
    type AccountTransactionPayload,
    AccountTransactionType,
    ConfigureBakerHandler,
    type ConfigureBakerPayload,
    ConfigureDelegationHandler,
    type ConfigureDelegationPayload,
    type DataBlob,
    DeployModuleHandler,
    type DeployModulePayload,
    InitContractHandler,
    type InitContractPayload,
    RegisterDataHandler,
    type RegisterDataPayload,
    SimpleTransferHandler,
    type SimpleTransferPayload,
    SimpleTransferWithMemoHandler,
    type SimpleTransferWithMemoPayload,
    TokenUpdateHandler,
    type TokenUpdatePayload,
    UpdateContractHandler,
    type UpdateContractPayload,
    UpdateCredentialsHandler,
    type UpdateCredentialsPayload,
    getAccountTransactionHandler,
    isAccountTransactionType,
} from '../index.js';
import { serializeAccountTransactionType } from '../serialization.js';

export type Transfer = SimpleTransferPayload & {
    readonly type: AccountTransactionType.Transfer;
};

export type TransferWithMemo = SimpleTransferWithMemoPayload & {
    readonly type: AccountTransactionType.TransferWithMemo;
};

export function transfer(payload: SimpleTransferPayload): Transfer;
export function transfer(payload: SimpleTransferPayload, memo: DataBlob): TransferWithMemo;
export function transfer(payload: SimpleTransferWithMemoPayload): TransferWithMemo;
export function transfer(
    payload: SimpleTransferPayload | SimpleTransferWithMemoPayload,
    memo: DataBlob = (payload as SimpleTransferWithMemoPayload).memo
): Transfer | TransferWithMemo {
    return memo !== undefined
        ? { type: AccountTransactionType.TransferWithMemo, ...payload, memo }
        : { type: AccountTransactionType.Transfer, ...payload };
}

function transferToJSON(transfer: Transfer) {
    const handler = new SimpleTransferHandler();
    return { type: transfer.type, ...handler.toJSON(transfer) };
}

function transferFromJSON(json: ReturnType<typeof transferToJSON>): Transfer {
    const handler = new SimpleTransferHandler();
    return transfer(handler.fromJSON(json));
}

function transferWithMemoToJSON(transferWithMemo: TransferWithMemo) {
    const handler = new SimpleTransferWithMemoHandler();
    return { type: transferWithMemo.type, ...handler.toJSON(transferWithMemo) };
}

function transferWithMemoFromJSON(json: ReturnType<typeof transferWithMemoToJSON>): TransferWithMemo {
    const handler = new SimpleTransferWithMemoHandler();
    return { type: AccountTransactionType.TransferWithMemo, ...handler.fromJSON(json) };
}

export type DeployModule = DeployModulePayload & {
    readonly type: AccountTransactionType.DeployModule;
};

export function deployModule(payload: DeployModulePayload): DeployModule {
    return { type: AccountTransactionType.DeployModule, ...payload };
}

function deployModuleToJSON(value: DeployModule) {
    const handler = new DeployModuleHandler();
    return { type: value.type, ...handler.toJSON(value) };
}

function deployModuleFromJSON(json: ReturnType<typeof deployModuleToJSON>): DeployModule {
    const handler = new DeployModuleHandler();
    return { type: AccountTransactionType.DeployModule, ...handler.fromJSON(json) };
}

export type InitContract = InitContractPayload & {
    readonly type: AccountTransactionType.InitContract;
};

export function initContract(payload: InitContractPayload): InitContract {
    return { type: AccountTransactionType.InitContract, ...payload };
}

function initContractToJSON(value: InitContract) {
    const handler = new InitContractHandler();
    return { type: value.type, ...handler.toJSON(value) };
}

function initContractFromJSON(json: ReturnType<typeof initContractToJSON>): InitContract {
    const handler = new InitContractHandler();
    return { type: AccountTransactionType.InitContract, ...handler.fromJSON(json) };
}

export type UpdateContract = UpdateContractPayload & {
    readonly type: AccountTransactionType.Update;
};

export function updateContract(payload: UpdateContractPayload): UpdateContract {
    return { type: AccountTransactionType.Update, ...payload };
}

function updateContractToJSON(value: UpdateContract) {
    const handler = new UpdateContractHandler();
    return { type: value.type, ...handler.toJSON(value) };
}

function updateContractFromJSON(json: ReturnType<typeof updateContractToJSON>): UpdateContract {
    const handler = new UpdateContractHandler();
    return { type: AccountTransactionType.Update, ...handler.fromJSON(json) };
}

export type UpdateCredentials = UpdateCredentialsPayload & {
    readonly type: AccountTransactionType.UpdateCredentials;
};

export function updateCredentials(payload: UpdateCredentialsPayload): UpdateCredentials {
    return { type: AccountTransactionType.UpdateCredentials, ...payload };
}

function updateCredentialsToJSON(value: UpdateCredentials) {
    const handler = new UpdateCredentialsHandler();
    return { type: value.type, ...handler.toJSON(value) };
}

function updateCredentialsFromJSON(json: ReturnType<typeof updateCredentialsToJSON>): UpdateCredentials {
    const handler = new UpdateCredentialsHandler();
    return { type: AccountTransactionType.UpdateCredentials, ...handler.fromJSON(json) };
}

export type RegisterData = RegisterDataPayload & {
    readonly type: AccountTransactionType.RegisterData;
};

export function registerData(payload: RegisterDataPayload): RegisterData {
    return { type: AccountTransactionType.RegisterData, ...payload };
}

function registerDataToJSON(value: RegisterData) {
    const handler = new RegisterDataHandler();
    return { type: value.type, ...handler.toJSON(value) };
}

function registerDataFromJSON(json: ReturnType<typeof registerDataToJSON>): RegisterData {
    const handler = new RegisterDataHandler();
    return { type: AccountTransactionType.RegisterData, ...handler.fromJSON(json) };
}

export type ConfigureDelegation = ConfigureDelegationPayload & {
    readonly type: AccountTransactionType.ConfigureDelegation;
};

export function configureDelegation(payload: ConfigureDelegationPayload): ConfigureDelegation {
    return { type: AccountTransactionType.ConfigureDelegation, ...payload };
}

function configureDelegationToJSON(value: ConfigureDelegation) {
    const handler = new ConfigureDelegationHandler();
    return { type: value.type, ...handler.toJSON(value) };
}

function configureDelegationFromJSON(json: ReturnType<typeof configureDelegationToJSON>): ConfigureDelegation {
    const handler = new ConfigureDelegationHandler();
    return { type: AccountTransactionType.ConfigureDelegation, ...handler.fromJSON(json) };
}

export type ConfigureValidator = ConfigureBakerPayload & {
    readonly type: AccountTransactionType.ConfigureBaker;
};

export function configureValidator(payload: ConfigureBakerPayload): ConfigureValidator {
    return { type: AccountTransactionType.ConfigureBaker, ...payload };
}

function configureValidatorToJSON(value: ConfigureValidator) {
    const handler = new ConfigureBakerHandler();
    return { type: value.type, ...handler.toJSON(value) };
}

function configureValidatorFromJSON(json: ReturnType<typeof configureValidatorToJSON>): ConfigureValidator {
    const handler = new ConfigureBakerHandler();
    return { type: AccountTransactionType.ConfigureBaker, ...handler.fromJSON(json) };
}

export type TokenUpdate = TokenUpdatePayload & {
    readonly type: AccountTransactionType.TokenUpdate;
};

export function tokenUpdate(payload: TokenUpdatePayload): TokenUpdate {
    return { type: AccountTransactionType.TokenUpdate, ...payload };
}

function tokenUpdateToJSON(value: TokenUpdate) {
    const handler = new TokenUpdateHandler();
    return { type: value.type, ...handler.toJSON(value) };
}

function tokenUpdateFromJSON(json: ReturnType<typeof tokenUpdateToJSON>): TokenUpdate {
    const handler = new TokenUpdateHandler();
    return { type: AccountTransactionType.TokenUpdate, ...handler.fromJSON(json) };
}

type Payload =
    | Transfer
    | TransferWithMemo
    | DeployModule
    | InitContract
    | UpdateContract
    | UpdateCredentials
    | RegisterData
    | ConfigureDelegation
    | ConfigureValidator
    | TokenUpdate;

export type Type = Payload;

export function create(type: AccountTransactionType, payload: AccountTransactionPayload): Payload {
    switch (type) {
        case AccountTransactionType.Transfer:
            return transfer(payload as SimpleTransferPayload);
        case AccountTransactionType.TransferWithMemo:
            return transfer(payload as SimpleTransferWithMemoPayload);
        case AccountTransactionType.DeployModule:
            return deployModule(payload as DeployModulePayload);
        case AccountTransactionType.InitContract:
            return initContract(payload as InitContractPayload);
        case AccountTransactionType.Update:
            return updateContract(payload as UpdateContractPayload);
        case AccountTransactionType.UpdateCredentials:
            return updateCredentials(payload as UpdateCredentialsPayload);
        case AccountTransactionType.RegisterData:
            return registerData(payload as RegisterDataPayload);
        case AccountTransactionType.ConfigureDelegation:
            return configureDelegation(payload as ConfigureDelegationPayload);
        case AccountTransactionType.ConfigureBaker:
            return configureValidator(payload as ConfigureBakerPayload);
        case AccountTransactionType.TokenUpdate:
            return tokenUpdate(payload as TokenUpdatePayload);
        default:
            throw new Error('The provided transaction type is not supported: ' + type);
    }
}

export function toJSON(payload: Payload) {
    switch (payload.type) {
        case AccountTransactionType.Transfer:
            return transferToJSON(payload);
        case AccountTransactionType.TransferWithMemo:
            return transferWithMemoToJSON(payload);
        case AccountTransactionType.DeployModule:
            return deployModuleToJSON(payload);
        case AccountTransactionType.InitContract:
            return initContractToJSON(payload);
        case AccountTransactionType.Update:
            return updateContractToJSON(payload);
        case AccountTransactionType.UpdateCredentials:
            return updateCredentialsToJSON(payload);
        case AccountTransactionType.RegisterData:
            return registerDataToJSON(payload);
        case AccountTransactionType.ConfigureDelegation:
            return configureDelegationToJSON(payload);
        case AccountTransactionType.ConfigureBaker:
            return configureValidatorToJSON(payload);
        case AccountTransactionType.TokenUpdate:
            return tokenUpdateToJSON(payload);
        default:
            throw new Error('The provided transaction type is not supported: ' + (payload as any).type);
    }
}

export function fromJSON(json: unknown): Payload {
    if (typeof json !== 'object' || json === null) throw new Error('Expected object');
    if (!('type' in json) || typeof json.type !== 'number' || !isAccountTransactionType(json.type))
        throw new Error('invalid transction type');

    switch (json.type) {
        case AccountTransactionType.Transfer:
            return transferFromJSON(json as any as any);
        case AccountTransactionType.TransferWithMemo:
            return transferWithMemoFromJSON(json as any);
        case AccountTransactionType.DeployModule:
            return deployModuleFromJSON(json as any);
        case AccountTransactionType.InitContract:
            return initContractFromJSON(json as any);
        case AccountTransactionType.Update:
            return updateContractFromJSON(json as any);
        case AccountTransactionType.UpdateCredentials:
            return updateCredentialsFromJSON(json as any);
        case AccountTransactionType.RegisterData:
            return registerDataFromJSON(json as any);
        case AccountTransactionType.ConfigureDelegation:
            return configureDelegationFromJSON(json as any);
        case AccountTransactionType.ConfigureBaker:
            return configureValidatorFromJSON(json as any);
        case AccountTransactionType.TokenUpdate:
            return tokenUpdateFromJSON(json as any);
        default:
            throw new Error('The provided transaction type is not supported: ' + json.type);
    }
}

export function serialize(payload: Payload): Uint8Array {
    const serializedType = serializeAccountTransactionType(payload.type);

    const accountTransactionHandler = getAccountTransactionHandler(payload.type);
    const serializedPayload = accountTransactionHandler.serialize(payload);

    return Uint8Array.from(Buffer.concat([serializedType, serializedPayload]));
}

export function sizeOf(payload: Payload): number {
    return serialize(payload).length;
}

export function deserialize(value: Cursor | ArrayBuffer): Payload {
    const isRawBuffer = value instanceof Cursor;
    const cursor = isRawBuffer ? value : Cursor.fromBuffer(value);

    const type = deserializeUint8(cursor);
    let payload: Payload;
    switch (type) {
        case AccountTransactionType.Transfer:
            payload = transfer(getAccountTransactionHandler(type).deserialize(cursor));
            break;
        case AccountTransactionType.TransferWithMemo:
            payload = transfer(getAccountTransactionHandler(type).deserialize(cursor));
            break;
        case AccountTransactionType.DeployModule:
            payload = deployModule(getAccountTransactionHandler(type).deserialize(cursor));
            break;
        case AccountTransactionType.InitContract:
            payload = initContract(getAccountTransactionHandler(type).deserialize(cursor));
            break;
        case AccountTransactionType.Update:
            payload = updateContract(getAccountTransactionHandler(type).deserialize(cursor));
            break;
        case AccountTransactionType.UpdateCredentials:
            payload = updateCredentials(getAccountTransactionHandler(type).deserialize());
            break;
        case AccountTransactionType.RegisterData:
            payload = registerData(getAccountTransactionHandler(type).deserialize(cursor));
            break;
        case AccountTransactionType.ConfigureDelegation:
            payload = configureDelegation(getAccountTransactionHandler(type).deserialize());
            break;
        case AccountTransactionType.ConfigureBaker:
            payload = configureValidator(getAccountTransactionHandler(type).deserialize());
            break;
        case AccountTransactionType.TokenUpdate:
            payload = tokenUpdate(getAccountTransactionHandler(type).deserialize(cursor));
            break;
        default:
            throw new Error('TransactionType is not a valid value: ' + type);
    }

    if (isRawBuffer && cursor.remainingBytes.length !== 0)
        throw new Error('Deserializing the transaction did not exhaust the buffer');

    return payload;
}
