import { Buffer } from 'buffer/index.js';

import { deserializeUint8 } from '../deserialization.js';
import { Cursor } from '../deserializationHelpers.js';
import {
    type AccountTransactionPayload,
    AccountTransactionPayloadJSON,
    AccountTransactionType,
    ConfigureBakerHandler,
    type ConfigureBakerPayload,
    ConfigureBakerPayloadJSON,
    ConfigureDelegationHandler,
    type ConfigureDelegationPayload,
    ConfigureDelegationPayloadJSON,
    type DataBlob,
    DeployModuleHandler,
    type DeployModulePayload,
    DeployModulePayloadJSON,
    InitContractHandler,
    type InitContractPayload,
    InitContractPayloadJSON,
    RegisterDataHandler,
    type RegisterDataPayload,
    RegisterDataPayloadJSON,
    SimpleTransferHandler,
    type SimpleTransferPayload,
    SimpleTransferPayloadJSON,
    SimpleTransferWithMemoHandler,
    type SimpleTransferWithMemoPayload,
    SimpleTransferWithMemoPayloadJSON,
    TokenUpdateHandler,
    type TokenUpdatePayload,
    TokenUpdatePayloadJSON,
    TransactionKindString,
    UpdateContractHandler,
    type UpdateContractPayload,
    UpdateContractPayloadJSON,
    UpdateCredentialsHandler,
    type UpdateCredentialsPayload,
    getAccountTransactionHandler,
    getTransactionKindString,
} from '../index.js';
import * as JSONBig from '../json-bigint.js';
import { serializeAccountTransactionType } from '../serialization.js';

type PayloadJSON<T extends TransactionKindString, P extends AccountTransactionPayloadJSON> = { type: T } & P;

/**
 * A simple transfer transaction payload.
 */
export type Transfer = SimpleTransferPayload & {
    readonly type: AccountTransactionType.Transfer;
};

/**
 * A transfer transaction payload with a memo.
 */
export type TransferWithMemo = SimpleTransferWithMemoPayload & {
    readonly type: AccountTransactionType.TransferWithMemo;
};

/**
 * Creates a transfer payload with memo.
 * @param payload the transfer with memo payload
 * @returns a transfer with memo payload
 */
export function transfer(payload: SimpleTransferWithMemoPayload): TransferWithMemo;

/**
 * Creates a transfer payload with memo.
 * @param payload the transfer payload
 * @param memo the memo to attach
 * @returns a transfer with memo payload
 */
export function transfer(payload: SimpleTransferPayload, memo: DataBlob): TransferWithMemo;

/**
 * Creates a transfer payload.
 * @param payload the transfer payload
 * @returns a transfer payload
 */
export function transfer(payload: SimpleTransferPayload): Transfer;

export function transfer(
    payload: SimpleTransferPayload | SimpleTransferWithMemoPayload,
    memo: DataBlob = (payload as SimpleTransferWithMemoPayload).memo
): Transfer | TransferWithMemo {
    return memo !== undefined
        ? { type: AccountTransactionType.TransferWithMemo, ...payload, memo }
        : { type: AccountTransactionType.Transfer, ...payload };
}

function transferToJSON({
    type,
    ...transfer
}: Transfer): PayloadJSON<TransactionKindString.Transfer, SimpleTransferPayloadJSON> {
    const handler = new SimpleTransferHandler();
    return { type: TransactionKindString.Transfer, ...handler.toJSON(transfer) };
}

function transferFromJSON({ type, ...json }: ReturnType<typeof transferToJSON>): Transfer {
    const handler = new SimpleTransferHandler();
    return transfer(handler.fromJSON(json));
}

function transferWithMemoToJSON({
    type,
    ...transferWithMemo
}: TransferWithMemo): PayloadJSON<TransactionKindString.TransferWithMemo, SimpleTransferWithMemoPayloadJSON> {
    const handler = new SimpleTransferWithMemoHandler();
    return { type: TransactionKindString.TransferWithMemo, ...handler.toJSON(transferWithMemo) };
}

function transferWithMemoFromJSON({ type, ...json }: ReturnType<typeof transferWithMemoToJSON>): TransferWithMemo {
    const handler = new SimpleTransferWithMemoHandler();
    return transfer(handler.fromJSON(json));
}

/**
 * A deploy module transaction payload.
 */
export type DeployModule = DeployModulePayload & {
    readonly type: AccountTransactionType.DeployModule;
};

/**
 * Creates a deploy module payload.
 * @param payload the module deployment payload
 * @returns a deploy module payload
 */
export function deployModule(payload: DeployModulePayload): DeployModule {
    return { type: AccountTransactionType.DeployModule, ...payload };
}

function deployModuleToJSON({
    type,
    ...value
}: DeployModule): PayloadJSON<TransactionKindString.DeployModule, DeployModulePayloadJSON> {
    const handler = new DeployModuleHandler();
    return { type: TransactionKindString.DeployModule, ...handler.toJSON(value) };
}

function deployModuleFromJSON({ type, ...json }: ReturnType<typeof deployModuleToJSON>): DeployModule {
    const handler = new DeployModuleHandler();
    return deployModule(handler.fromJSON(json));
}

/**
 * An init contract transaction payload.
 */
export type InitContract = InitContractPayload & {
    readonly type: AccountTransactionType.InitContract;
};

/**
 * Creates an init contract payload.
 * @param payload the contract initialization payload
 * @returns an init contract payload
 */
export function initContract(payload: InitContractPayload): InitContract {
    return { type: AccountTransactionType.InitContract, ...payload };
}

function initContractToJSON({
    type,
    ...value
}: InitContract): PayloadJSON<TransactionKindString.InitContract, InitContractPayloadJSON> {
    const handler = new InitContractHandler();
    return { type: TransactionKindString.InitContract, ...handler.toJSON(value) };
}

function initContractFromJSON({ type, ...json }: ReturnType<typeof initContractToJSON>): InitContract {
    const handler = new InitContractHandler();
    return initContract(handler.fromJSON(json));
}

/**
 * An update contract transaction payload.
 */
export type UpdateContract = UpdateContractPayload & {
    readonly type: AccountTransactionType.Update;
};

/**
 * Creates an update contract payload.
 * @param payload the contract update payload
 * @returns an update contract payload
 */
export function updateContract(payload: UpdateContractPayload): UpdateContract {
    return { type: AccountTransactionType.Update, ...payload };
}

function updateContractToJSON({
    type,
    ...value
}: UpdateContract): PayloadJSON<TransactionKindString.Update, UpdateContractPayloadJSON> {
    const handler = new UpdateContractHandler();
    return { type: TransactionKindString.Update, ...handler.toJSON(value) };
}

function updateContractFromJSON({ type, ...json }: ReturnType<typeof updateContractToJSON>): UpdateContract {
    const handler = new UpdateContractHandler();
    return updateContract(handler.fromJSON(json));
}

/**
 * An update credentials transaction payload.
 */
export type UpdateCredentials = UpdateCredentialsPayload & {
    readonly type: AccountTransactionType.UpdateCredentials;
};

/**
 * Creates an update credentials payload.
 * @param payload the credentials update payload
 * @returns an update credentials payload
 */
export function updateCredentials(payload: UpdateCredentialsPayload): UpdateCredentials {
    return { type: AccountTransactionType.UpdateCredentials, ...payload };
}

function updateCredentialsToJSON({
    type,
    ...value
}: UpdateCredentials): PayloadJSON<TransactionKindString.UpdateCredentials, UpdateCredentialsPayload> {
    const handler = new UpdateCredentialsHandler();
    return { type: TransactionKindString.UpdateCredentials, ...handler.toJSON(value) };
}

function updateCredentialsFromJSON({ type, ...json }: ReturnType<typeof updateCredentialsToJSON>): UpdateCredentials {
    const handler = new UpdateCredentialsHandler();
    return updateCredentials(handler.fromJSON(json));
}

/**
 * A register data transaction payload.
 */
export type RegisterData = RegisterDataPayload & {
    readonly type: AccountTransactionType.RegisterData;
};

/**
 * Creates a register data payload.
 * @param payload the data registration payload
 * @returns a register data payload
 */
export function registerData(payload: RegisterDataPayload): RegisterData {
    return { type: AccountTransactionType.RegisterData, ...payload };
}

function registerDataToJSON({
    type,
    ...value
}: RegisterData): PayloadJSON<TransactionKindString.RegisterData, RegisterDataPayloadJSON> {
    const handler = new RegisterDataHandler();
    return { type: TransactionKindString.RegisterData, ...handler.toJSON(value) };
}

function registerDataFromJSON({ type, ...json }: ReturnType<typeof registerDataToJSON>): RegisterData {
    const handler = new RegisterDataHandler();
    return registerData(handler.fromJSON(json));
}

/**
 * A configure delegation transaction payload.
 */
export type ConfigureDelegation = ConfigureDelegationPayload & {
    readonly type: AccountTransactionType.ConfigureDelegation;
};

/**
 * Creates a configure delegation payload.
 * @param payload the delegation configuration payload
 * @returns a configure delegation payload
 */
export function configureDelegation(payload: ConfigureDelegationPayload): ConfigureDelegation {
    return { type: AccountTransactionType.ConfigureDelegation, ...payload };
}

function configureDelegationToJSON({
    type,
    ...value
}: ConfigureDelegation): PayloadJSON<TransactionKindString.ConfigureDelegation, ConfigureDelegationPayloadJSON> {
    const handler = new ConfigureDelegationHandler();
    return { type: TransactionKindString.ConfigureDelegation, ...handler.toJSON(value) };
}

function configureDelegationFromJSON({
    type,
    ...json
}: ReturnType<typeof configureDelegationToJSON>): ConfigureDelegation {
    const handler = new ConfigureDelegationHandler();
    return configureDelegation(handler.fromJSON(json));
}

/**
 * A configure validator (baker) transaction payload.
 */
export type ConfigureValidator = ConfigureBakerPayload & {
    readonly type: AccountTransactionType.ConfigureBaker;
};

/**
 * Creates a configure validator (baker) payload.
 * @param payload the validator configuration payload
 * @returns a configure validator payload
 */
export function configureValidator(payload: ConfigureBakerPayload): ConfigureValidator {
    return { type: AccountTransactionType.ConfigureBaker, ...payload };
}

function configureValidatorToJSON({
    type,
    ...value
}: ConfigureValidator): PayloadJSON<TransactionKindString.ConfigureBaker, ConfigureBakerPayloadJSON> {
    const handler = new ConfigureBakerHandler();
    return { type: TransactionKindString.ConfigureBaker, ...handler.toJSON(value) };
}

function configureValidatorFromJSON({
    type,
    ...json
}: ReturnType<typeof configureValidatorToJSON>): ConfigureValidator {
    const handler = new ConfigureBakerHandler();
    return configureValidator(handler.fromJSON(json));
}

/**
 * A token update transaction payload.
 */
export type TokenUpdate = TokenUpdatePayload & {
    readonly type: AccountTransactionType.TokenUpdate;
};

/**
 * Creates a token update payload.
 * @param payload the token update payload
 * @returns a token update payload
 */
export function tokenUpdate(payload: TokenUpdatePayload): TokenUpdate {
    return { type: AccountTransactionType.TokenUpdate, ...payload };
}

function tokenUpdateToJSON({
    type,
    ...value
}: TokenUpdate): PayloadJSON<TransactionKindString.TokenUpdate, TokenUpdatePayloadJSON> {
    const handler = new TokenUpdateHandler();
    return { type: TransactionKindString.TokenUpdate, ...handler.toJSON(value) };
}

function tokenUpdateFromJSON({ type, ...json }: ReturnType<typeof tokenUpdateToJSON>): TokenUpdate {
    const handler = new TokenUpdateHandler();
    return tokenUpdate(handler.fromJSON(json));
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

/**
 * Union type of all supported transaction payloads.
 */
export type Type = Payload;

/**
 * JSON representation of a transaction payload.
 */
export type JSON =
    | ReturnType<typeof transferToJSON>
    | ReturnType<typeof transferWithMemoToJSON>
    | ReturnType<typeof deployModuleToJSON>
    | ReturnType<typeof initContractToJSON>
    | ReturnType<typeof updateContractToJSON>
    | ReturnType<typeof updateCredentialsToJSON>
    | ReturnType<typeof registerDataToJSON>
    | ReturnType<typeof configureDelegationToJSON>
    | ReturnType<typeof configureValidatorToJSON>
    | ReturnType<typeof tokenUpdateToJSON>;

/**
 * Creates a typed transaction payload from a transaction type and raw payload data.
 *
 * NOTE: this does _not_ check the payload structure, and thus assumes that the `type` and `payload`
 * given actually match.
 *
 * @param type the transaction type
 * @param payload the raw transaction payload
 *
 * @returns the typed transaction payload
 * @throws if the transaction type is not supported
 */
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

/**
 * Converts a transaction payload to its intermediary JSON representation.
 *
 * Please note that `bigint`s are used internally, and representing these must be handled by the caller
 * e.g. by using a tool such as `json-bigint`.
 *
 * @param payload the payload to convert
 * @returns the JSON representation
 * @throws if the transaction type is not supported
 */
export function toJSON(payload: Transfer): ReturnType<typeof transferToJSON>;
export function toJSON(payload: TransferWithMemo): ReturnType<typeof transferWithMemoToJSON>;
export function toJSON(payload: DeployModule): ReturnType<typeof deployModuleToJSON>;
export function toJSON(payload: InitContract): ReturnType<typeof initContractToJSON>;
export function toJSON(payload: UpdateContract): ReturnType<typeof updateContractToJSON>;
export function toJSON(payload: UpdateCredentials): ReturnType<typeof updateCredentialsToJSON>;
export function toJSON(payload: RegisterData): ReturnType<typeof registerDataToJSON>;
export function toJSON(payload: ConfigureDelegation): ReturnType<typeof configureDelegationToJSON>;
export function toJSON(payload: ConfigureValidator): ReturnType<typeof configureValidatorToJSON>;
export function toJSON(payload: TokenUpdate): ReturnType<typeof tokenUpdateToJSON>;
export function toJSON(payload: Payload): JSON;

export function toJSON(payload: Payload): JSON {
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

/**
 * Converts a intermediary JSON representation created from {@linkcode toJSON} to a transaction payload.
 *
 * @param json the JSON to convert
 *
 * @returns the transaction payload
 * @throws if the JSON is invalid or the transaction type is not supported
 */
export function fromJSON(json: JSON): Payload {
    if (typeof json !== 'object' || json === null) throw new Error('Expected object');
    if (!('type' in json) || typeof json.type !== 'string') throw new Error('invalid transaction type');

    switch (json.type) {
        case getTransactionKindString(AccountTransactionType.Transfer):
            return transferFromJSON(json as any);
        case getTransactionKindString(AccountTransactionType.TransferWithMemo):
            return transferWithMemoFromJSON(json as any);
        case getTransactionKindString(AccountTransactionType.DeployModule):
            return deployModuleFromJSON(json as any);
        case getTransactionKindString(AccountTransactionType.InitContract):
            return initContractFromJSON(json as any);
        case getTransactionKindString(AccountTransactionType.Update):
            return updateContractFromJSON(json as any);
        case getTransactionKindString(AccountTransactionType.UpdateCredentials):
            return updateCredentialsFromJSON(json as any);
        case getTransactionKindString(AccountTransactionType.RegisterData):
            return registerDataFromJSON(json as any);
        case getTransactionKindString(AccountTransactionType.ConfigureDelegation):
            return configureDelegationFromJSON(json as any);
        case getTransactionKindString(AccountTransactionType.ConfigureBaker):
            return configureValidatorFromJSON(json as any);
        case getTransactionKindString(AccountTransactionType.TokenUpdate):
            return tokenUpdateFromJSON(json as any);
        default:
            throw new Error('The provided transaction type is not supported: ' + json.type);
    }
}

/**
 * Converts a {@linkcode Payload} to a JSON string.
 *
 * @param payload - the payload to convert
 * @returns the JSON string
 */
export function toJSONString(payload: Payload): string {
    return JSONBig.stringify(toJSON(payload));
}
/**
 * Converts a JSON string payload representation to a {@linkcode Payload}.
 *
 * @param jsonString - the json string to convert
 *
 * @returns the JSON string
 * @throws if the JSON is invalid or the transaction type is not supported
 */
export function fromJSONString(jsonString: string): Payload {
    return fromJSON(JSONBig.parse(jsonString));
}

/**
 * Serializes a transaction payload to the encoding expected by concordium nodes.
 * @param payload the payload to serialize
 * @returns the serialized payload as a byte array
 */
export function serialize(payload: Payload): Uint8Array {
    const serializedType = serializeAccountTransactionType(payload.type);

    const accountTransactionHandler = getAccountTransactionHandler(payload.type);
    const serializedPayload = accountTransactionHandler.serialize(payload);

    return Uint8Array.from(Buffer.concat([serializedType, serializedPayload]));
}

/**
 * Returns the size in bytes of a serialized transaction payload.
 * @param payload the payload to measure
 * @returns the size in bytes
 */
export function sizeOf(payload: Payload): number {
    return serialize(payload).length;
}

/**
 * Deserializes a transaction payload from the byte encoding used by concordium nodes.
 * @param value the bytes to deserialize, either as a Cursor or ArrayBuffer
 * @returns the deserialized payload
 * @throws if the transaction type is invalid or buffer is not fully consumed
 */
export function deserialize(value: Cursor | ArrayBuffer): Payload {
    const isRawBuffer = !(value instanceof Cursor);
    const cursor = isRawBuffer ? Cursor.fromBuffer(value) : value;

    const bufferForConfigureDelegation = isRawBuffer ? Buffer.from(value) : value;

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
            payload = updateCredentials(getAccountTransactionHandler(type).deserialize(cursor));
            break;
        case AccountTransactionType.RegisterData:
            payload = registerData(getAccountTransactionHandler(type).deserialize(cursor));
            break;
        case AccountTransactionType.ConfigureDelegation:
            payload = configureDelegation(getAccountTransactionHandler(type).deserialize(cursor));
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
