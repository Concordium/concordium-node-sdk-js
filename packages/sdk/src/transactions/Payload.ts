import { deserializeUint8 } from '../deserialization.js';
import { Cursor } from '../deserializationHelpers.js';
import {
    AccountTransactionType,
    ConfigureBakerPayload,
    ConfigureDelegationPayload,
    DeployModulePayload,
    InitContractPayload,
    RegisterDataPayload,
    SimpleTransferPayload,
    SimpleTransferWithMemoPayload,
    TokenUpdatePayload,
    UpdateContractPayload,
    UpdateCredentialsPayload,
    getAccountTransactionHandler,
} from '../index.js';
import { serializeAccountTransactionType } from '../serialization.js';

export class Transfer {
    public readonly type = AccountTransactionType.Transfer;
    constructor(public readonly value: SimpleTransferPayload) {}
}

export class TransferWithMemo {
    public readonly type = AccountTransactionType.TransferWithMemo;
    constructor(public readonly value: SimpleTransferWithMemoPayload) {}
}

const isMemoPayload = (
    payload: SimpleTransferPayload | SimpleTransferWithMemoPayload
): payload is SimpleTransferWithMemoPayload => (payload as SimpleTransferWithMemoPayload).memo !== undefined;

export function transfer(payload: SimpleTransferPayload): Transfer;
export function transfer(payload: SimpleTransferWithMemoPayload): TransferWithMemo;
export function transfer(payload: SimpleTransferPayload | SimpleTransferWithMemoPayload): Transfer | TransferWithMemo {
    return isMemoPayload(payload) ? new TransferWithMemo(payload) : new Transfer(payload);
}

export class DeployModule {
    public readonly type = AccountTransactionType.DeployModule;
    constructor(public readonly value: DeployModulePayload) {}
}

export function deployModule(payload: DeployModulePayload): DeployModule {
    return new DeployModule(payload);
}

export class InitContract {
    public readonly type = AccountTransactionType.InitContract;
    constructor(public readonly value: InitContractPayload) {}
}

export function initContract(payload: InitContractPayload): InitContract {
    return new InitContract(payload);
}

export class UpdateContract {
    public readonly type = AccountTransactionType.Update;
    constructor(public readonly value: UpdateContractPayload) {}
}

export function updateContract(payload: UpdateContractPayload): UpdateContract {
    return new UpdateContract(payload);
}

export class UpdateCredentials {
    public readonly type = AccountTransactionType.UpdateCredentials;
    constructor(public readonly value: UpdateCredentialsPayload) {}
}

export function updateCredentials(payload: UpdateCredentialsPayload): UpdateCredentials {
    return new UpdateCredentials(payload);
}

export class RegisterData {
    public readonly type = AccountTransactionType.RegisterData;
    constructor(public readonly value: RegisterDataPayload) {}
}

export function registerData(payload: RegisterDataPayload): RegisterData {
    return new RegisterData(payload);
}

export class ConfigureDelegation {
    public readonly type = AccountTransactionType.ConfigureDelegation;
    constructor(public readonly value: ConfigureDelegationPayload) {}
}

export function configureDelegation(payload: ConfigureDelegationPayload): ConfigureDelegation {
    return new ConfigureDelegation(payload);
}

export class ConfigureValidator {
    public readonly type = AccountTransactionType.ConfigureBaker;
    constructor(public readonly value: ConfigureBakerPayload) {}
}

export function configureValidator(payload: ConfigureBakerPayload): ConfigureValidator {
    return new ConfigureValidator(payload);
}

export class TokenUpdate {
    public readonly type = AccountTransactionType.TokenUpdate;
    constructor(public readonly value: TokenUpdatePayload) {}
}

export function tokenUpdate(payload: TokenUpdatePayload): TokenUpdate {
    return new TokenUpdate(payload);
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

/**
 * Serializes a transaction payload.
 * @param accountTransaction the transaction which payload is to be serialized
 * @returns the account transaction payload serialized as a buffer.
 */
export function serialize(payload: Payload): Buffer {
    const serializedType = serializeAccountTransactionType(payload.type);

    const accountTransactionHandler = getAccountTransactionHandler(payload.type);
    const serializedPayload = accountTransactionHandler.serialize(payload.value);

    return Buffer.concat([serializedType, serializedPayload]);
}

/**
 * Deserializes an account transaction payload from a cursor.
 *
 * @param value - The cursor/buffer containing the serialized payload data.
 * @returns An object containing the transaction type and the deserialized payload.
 * @throws {Error} If the transaction type is not valid.
 */
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
