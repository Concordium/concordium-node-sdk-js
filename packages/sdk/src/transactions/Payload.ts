import { deserializeUint8 } from '../deserialization.js';
import { Cursor } from '../deserializationHelpers.js';
import {
    type AccountAddress,
    type AccountTransactionPayload,
    AccountTransactionType,
    type BakerKeysWithProofs,
    type CcdAmount,
    ConfigureBakerHandler,
    type ConfigureBakerPayload,
    ConfigureDelegationHandler,
    type ConfigureDelegationPayload,
    type ContractAddress,
    type ContractName,
    type DataBlob,
    type DelegationTarget,
    DeployModuleHandler,
    type DeployModulePayload,
    type IndexedCredentialDeploymentInfo,
    InitContractHandler,
    type InitContractPayload,
    type ModuleReference,
    type OpenStatus,
    type Parameter,
    type ReceiveName,
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
import type { Cbor, TokenId } from '../plt/index.js';
import { serializeAccountTransactionType } from '../serialization.js';

export class Transfer implements SimpleTransferPayload {
    public readonly type = AccountTransactionType.Transfer;
    amount: CcdAmount.Type;
    toAddress: AccountAddress.Type;

    constructor({ toAddress, amount }: SimpleTransferPayload) {
        this.amount = amount;
        this.toAddress = toAddress;
    }

    toJSON() {
        const handler = new SimpleTransferHandler();
        return { type: this.type, ...handler.toJSON(this) };
    }

    static fromJSON(json: ReturnType<Transfer['toJSON']>): Transfer {
        const handler = new SimpleTransferHandler();
        return new Transfer(handler.fromJSON(json));
    }
}

export class TransferWithMemo implements SimpleTransferWithMemoPayload {
    public readonly type = AccountTransactionType.TransferWithMemo;
    amount: CcdAmount.Type;
    toAddress: AccountAddress.Type;
    memo: DataBlob;

    constructor({ toAddress, amount, memo }: SimpleTransferWithMemoPayload) {
        this.amount = amount;
        this.toAddress = toAddress;
        this.memo = memo;
    }

    toJSON() {
        const handler = new SimpleTransferWithMemoHandler();
        return { type: this.type, ...handler.toJSON(this) };
    }

    static fromJSON(json: ReturnType<TransferWithMemo['toJSON']>): TransferWithMemo {
        const handler = new SimpleTransferWithMemoHandler();
        return new TransferWithMemo(handler.fromJSON(json));
    }
}

export function transfer(payload: SimpleTransferPayload): Transfer;
export function transfer(payload: SimpleTransferPayload, memo: DataBlob): TransferWithMemo;
export function transfer(payload: SimpleTransferWithMemoPayload): TransferWithMemo;
export function transfer(
    payload: SimpleTransferPayload | SimpleTransferWithMemoPayload,
    memo: DataBlob = (payload as SimpleTransferWithMemoPayload).memo
): Transfer | TransferWithMemo {
    return memo !== undefined ? new TransferWithMemo({ ...payload, memo }) : new Transfer(payload);
}

export class DeployModule implements DeployModulePayload {
    public readonly type = AccountTransactionType.DeployModule;
    version?: number;
    source: Uint8Array;

    constructor({ version, source }: DeployModulePayload) {
        this.version = version;
        this.source = source;
    }

    toJSON() {
        const handler = new DeployModuleHandler();
        return { type: this.type, ...handler.toJSON(this) };
    }

    static fromJSON(json: ReturnType<DeployModule['toJSON']>): DeployModule {
        const handler = new DeployModuleHandler();
        return new DeployModule(handler.fromJSON(json));
    }
}

export function deployModule(payload: DeployModulePayload): DeployModule {
    return new DeployModule(payload);
}

export class InitContract implements InitContractPayload {
    public readonly type = AccountTransactionType.InitContract;
    amount: CcdAmount.Type;
    moduleRef: ModuleReference.Type;
    initName: ContractName.Type;
    param: Parameter.Type;

    constructor({ amount, moduleRef, initName, param }: InitContractPayload) {
        this.amount = amount;
        this.moduleRef = moduleRef;
        this.initName = initName;
        this.param = param;
    }

    toJSON() {
        const handler = new InitContractHandler();
        return { type: this.type, ...handler.toJSON(this) };
    }

    static fromJSON(json: ReturnType<InitContract['toJSON']>): InitContract {
        const handler = new InitContractHandler();
        return new InitContract(handler.fromJSON(json));
    }
}

export function initContract(payload: InitContractPayload): InitContract {
    return new InitContract(payload);
}

export class UpdateContract implements UpdateContractPayload {
    public readonly type = AccountTransactionType.Update;
    amount: CcdAmount.Type;
    address: ContractAddress.Type;
    receiveName: ReceiveName.Type;
    message: Parameter.Type;

    constructor({ amount, address, receiveName, message }: UpdateContractPayload) {
        this.amount = amount;
        this.address = address;
        this.receiveName = receiveName;
        this.message = message;
    }

    toJSON() {
        const handler = new UpdateContractHandler();
        return { type: this.type, ...handler.toJSON(this) };
    }

    static fromJSON(json: ReturnType<UpdateContract['toJSON']>): UpdateContract {
        const handler = new UpdateContractHandler();
        return new UpdateContract(handler.fromJSON(json));
    }
}

export function updateContract(payload: UpdateContractPayload): UpdateContract {
    return new UpdateContract(payload);
}

export class UpdateCredentials implements UpdateCredentialsPayload {
    public readonly type = AccountTransactionType.UpdateCredentials;
    newCredentials: IndexedCredentialDeploymentInfo[];
    removeCredentialIds: string[];
    threshold: number;
    currentNumberOfCredentials: bigint;

    constructor(value: UpdateCredentialsPayload) {
        this.newCredentials = value.newCredentials;
        this.removeCredentialIds = value.removeCredentialIds;
        this.threshold = value.threshold;
        this.currentNumberOfCredentials = value.currentNumberOfCredentials;
    }

    toJSON() {
        const handler = new UpdateCredentialsHandler();
        return { type: this.type, ...handler.toJSON(this) };
    }

    static fromJSON(json: ReturnType<UpdateCredentials['toJSON']>): UpdateCredentials {
        const handler = new UpdateCredentialsHandler();
        return new UpdateCredentials(handler.fromJSON(json));
    }
}

export function updateCredentials(payload: UpdateCredentialsPayload): UpdateCredentials {
    return new UpdateCredentials(payload);
}

export class RegisterData implements RegisterDataPayload {
    public readonly type = AccountTransactionType.RegisterData;
    data: DataBlob;

    constructor({ data }: RegisterDataPayload) {
        this.data = data;
    }

    toJSON() {
        const handler = new RegisterDataHandler();
        return { type: this.type, ...handler.toJSON(this) };
    }

    static fromJSON(json: ReturnType<RegisterData['toJSON']>): RegisterData {
        const handler = new RegisterDataHandler();
        return new RegisterData(handler.fromJSON(json));
    }
}

export function registerData(payload: RegisterDataPayload): RegisterData {
    return new RegisterData(payload);
}

export class ConfigureDelegation implements ConfigureDelegationPayload {
    public readonly type = AccountTransactionType.ConfigureDelegation;
    stake?: CcdAmount.Type;
    restakeEarnings?: boolean;
    delegationTarget?: DelegationTarget;

    constructor({ stake, restakeEarnings, delegationTarget }: ConfigureDelegationPayload) {
        this.stake = stake;
        this.restakeEarnings = restakeEarnings;
        this.delegationTarget = delegationTarget;
    }

    toJSON() {
        const handler = new ConfigureDelegationHandler();
        return { type: this.type, ...handler.toJSON(this) };
    }

    static fromJSON(json: ReturnType<ConfigureDelegation['toJSON']>): ConfigureDelegation {
        const handler = new ConfigureDelegationHandler();
        return new ConfigureDelegation(handler.fromJSON(json));
    }
}

export function configureDelegation(payload: ConfigureDelegationPayload): ConfigureDelegation {
    return new ConfigureDelegation(payload);
}

export class ConfigureValidator implements ConfigureBakerPayload {
    public readonly type = AccountTransactionType.ConfigureBaker;
    stake?: CcdAmount.Type;
    restakeEarnings?: boolean;
    openForDelegation?: OpenStatus;
    keys?: BakerKeysWithProofs;
    metadataUrl?: string;
    transactionFeeCommission?: number;
    bakingRewardCommission?: number;
    finalizationRewardCommission?: number;

    constructor(value: ConfigureBakerPayload) {
        this.stake = value.stake;
        this.restakeEarnings = value.restakeEarnings;
        this.openForDelegation = value.openForDelegation;
        this.keys = value.keys;
        this.metadataUrl = value.metadataUrl;
        this.transactionFeeCommission = value.transactionFeeCommission;
        this.bakingRewardCommission = value.bakingRewardCommission;
        this.finalizationRewardCommission = value.finalizationRewardCommission;
    }

    toJSON() {
        const handler = new ConfigureBakerHandler();
        return { type: this.type, ...handler.toJSON(this) };
    }

    static fromJSON(json: ReturnType<ConfigureValidator['toJSON']>): ConfigureValidator {
        const handler = new ConfigureBakerHandler();
        return new ConfigureValidator(handler.fromJSON(json));
    }
}

export function configureValidator(payload: ConfigureBakerPayload): ConfigureValidator {
    return new ConfigureValidator(payload);
}

export class TokenUpdate implements TokenUpdatePayload {
    public readonly type = AccountTransactionType.TokenUpdate;
    tokenId: TokenId.Type;
    operations: Cbor.Type;

    constructor({ tokenId, operations }: TokenUpdatePayload) {
        this.tokenId = tokenId;
        this.operations = operations;
    }

    toJSON() {
        const handler = new TokenUpdateHandler();
        return { type: this.type, ...handler.toJSON(this) };
    }

    static fromJSON(json: ReturnType<TokenUpdate['toJSON']>): TokenUpdate {
        const handler = new TokenUpdateHandler();
        return new TokenUpdate(handler.fromJSON(json));
    }
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

export function create(type: AccountTransactionType, payload: AccountTransactionPayload): Payload {
    switch (type) {
        case AccountTransactionType.Transfer:
            return new Transfer(payload as SimpleTransferPayload);
        case AccountTransactionType.TransferWithMemo:
            return new TransferWithMemo(payload as SimpleTransferWithMemoPayload);
        case AccountTransactionType.DeployModule:
            return new DeployModule(payload as DeployModulePayload);
        case AccountTransactionType.InitContract:
            return new InitContract(payload as InitContractPayload);
        case AccountTransactionType.Update:
            return new UpdateContract(payload as UpdateContractPayload);
        case AccountTransactionType.UpdateCredentials:
            return new UpdateCredentials(payload as UpdateCredentialsPayload);
        case AccountTransactionType.RegisterData:
            return new RegisterData(payload as RegisterDataPayload);
        case AccountTransactionType.ConfigureDelegation:
            return new ConfigureDelegation(payload as ConfigureDelegationPayload);
        case AccountTransactionType.ConfigureBaker:
            return new ConfigureValidator(payload as ConfigureBakerPayload);
        case AccountTransactionType.TokenUpdate:
            return new TokenUpdate(payload as TokenUpdatePayload);
        default:
            throw new Error('The provided transaction type is not supported: ' + type);
    }
}

export function fromJSON(json: unknown): Payload {
    if (typeof json !== 'object' || json === null) throw new Error('Expected object');
    if (!('type' in json) || typeof json.type !== 'number' || !isAccountTransactionType(json.type))
        throw new Error('invalid transction type');

    switch (json.type) {
        case AccountTransactionType.Transfer:
            return Transfer.fromJSON(json as any as any);
        case AccountTransactionType.TransferWithMemo:
            return TransferWithMemo.fromJSON(json as any);
        case AccountTransactionType.DeployModule:
            return DeployModule.fromJSON(json as any);
        case AccountTransactionType.InitContract:
            return InitContract.fromJSON(json as any);
        case AccountTransactionType.Update:
            return UpdateContract.fromJSON(json as any);
        case AccountTransactionType.UpdateCredentials:
            return UpdateCredentials.fromJSON(json as any);
        case AccountTransactionType.RegisterData:
            return RegisterData.fromJSON(json as any);
        case AccountTransactionType.ConfigureDelegation:
            return ConfigureDelegation.fromJSON(json as any);
        case AccountTransactionType.ConfigureBaker:
            return ConfigureValidator.fromJSON(json as any);
        case AccountTransactionType.TokenUpdate:
            return TokenUpdate.fromJSON(json as any);
        default:
            throw new Error('The provided transaction type is not supported: ' + json.type);
    }
}

/**
 * Serializes a transaction payload.
 * @param accountTransaction the transaction which payload is to be serialized
 * @returns the account transaction payload serialized as a buffer.
 */
export function serialize(payload: Payload): Uint8Array {
    const serializedType = serializeAccountTransactionType(payload.type);

    const accountTransactionHandler = getAccountTransactionHandler(payload.type);
    const serializedPayload = accountTransactionHandler.serialize(payload);

    return Uint8Array.from(Buffer.concat([serializedType, serializedPayload]));
}

export function sizeOf(payload: Payload): number {
    return serialize(payload).length;
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
