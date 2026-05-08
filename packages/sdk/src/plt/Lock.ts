import { ConcordiumGRPCClient } from '../grpc/GRPCClient.js';
import { isKnown } from '../grpc/upward.js';
import { AccountAddress, MetaUpdatePayload, TransactionExpiry, TransactionHash } from '../pub/types.js';
import { AccountSigner } from '../signHelpers.js';
import { Transaction } from '../transactions/index.js';
import { TransactionSummaryType } from '../types.js';
import { TransactionKindString } from '../types/blockItemSummary.js';
import { SequenceNumber } from '../types/index.js';
import { LockCreatedEvent, TransactionEventTag } from '../types/transactionEvent.js';
import * as Token from './Token.js';
import {
    Cbor,
    CborAccountAddress,
    LockCancel,
    LockConfig,
    LockController,
    LockFund,
    LockId,
    LockInfo,
    LockReturn,
    LockSend,
    MetaUpdateOperation,
    MetaUpdateOperationType,
    TokenAmount,
    TokenId,
    createMetaUpdatePayload,
} from './index.js';

/** Enum representing the types of errors that can occur when interacting with PLT locks through the client. */
export enum LockErrorCode {
    /** The sender does not have the required lock controller capability. */
    MISSING_CAPABILITY = 'MISSING_CAPABILITY',
    /** The lock has expired. */
    LOCK_EXPIRED = 'LOCK_EXPIRED',
    /** The sender or source account does not have enough balance for the operation. */
    INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
    /** The token is not among the lock's configured tokens. */
    TOKEN_NOT_ALLOWED = 'TOKEN_NOT_ALLOWED',
    /** The recipient is not among the lock's configured recipients. */
    RECIPIENT_NOT_ALLOWED = 'RECIPIENT_NOT_ALLOWED',
    /** The high-level lock creation flow did not produce a usable lock. */
    CREATE_FAILED = 'CREATE_FAILED',
}

/** Error thrown while interacting with PLT locks through the client. */
export abstract class LockError extends Error {
    public abstract readonly code: LockErrorCode;
    private _name: string = 'LockClientError';

    /**
     * @param message The error message.
     */
    constructor(message: string) {
        super(message);
    }

    public override get name(): string {
        return `${this._name}.${this.code}`;
    }
}

/** Error thrown when the sender does not have the required lock controller capability. */
export class MissingCapabilityError extends LockError {
    public readonly code = LockErrorCode.MISSING_CAPABILITY;

    /**
     * @param sender The sender account lacking the required capability.
     * @param capability The missing capability.
     * @param lockId The lock id the capability is required for.
     */
    constructor(
        public readonly sender: AccountAddress.Type,
        public readonly capability: LockController.SimpleV0Capability,
        public readonly lockId: LockId.Type
    ) {
        super(`Account ${sender.address} does not have the '${capability}' capability for lock ${lockId}.`);
    }
}

/** Error thrown when an operation is attempted against an expired lock. */
export class LockExpiredError extends LockError {
    public readonly code = LockErrorCode.LOCK_EXPIRED;

    /**
     * @param lockId The expired lock id.
     */
    constructor(public readonly lockId: LockId.Type) {
        super(`Lock ${lockId} has expired.`);
    }
}

/** Error thrown when an account does not have enough token balance for a lock operation. */
export class InsufficientFundsError extends LockError {
    public readonly code = LockErrorCode.INSUFFICIENT_FUNDS;

    /**
     * @param sender The account lacking sufficient balance.
     * @param token The token involved in the operation.
     * @param requiredAmount The required amount for the operation.
     */
    constructor(
        public readonly sender: AccountAddress.Type,
        public readonly token: LockFund['token'],
        public readonly requiredAmount: LockFund['amount']
    ) {
        super(`Account ${sender.address} does not have enough balance of token ${token} for the lock operation.`);
    }
}

/** Error thrown when a token is not configured on the lock. */
export class TokenNotAllowedError extends LockError {
    public readonly code = LockErrorCode.TOKEN_NOT_ALLOWED;

    /**
     * @param token The token not allowed by the lock configuration.
     * @param lockId The lock whose token list was checked.
     */
    constructor(
        public readonly token: TokenId.Type,
        public readonly lockId: LockId.Type
    ) {
        super(`Token ${token} is not a configured token for lock ${lockId}.`);
    }
}

/** Error thrown when the send recipient is not configured on the lock. */
export class RecipientNotAllowedError extends LockError {
    public readonly code = LockErrorCode.RECIPIENT_NOT_ALLOWED;

    /**
     * @param recipient The recipient not allowed by the lock configuration.
     * @param lockId The lock whose recipients list was checked.
     */
    constructor(
        public readonly recipient: AccountAddress.Type,
        public readonly lockId: LockId.Type
    ) {
        super(`Account ${recipient.address} is not a configured recipient for lock ${lockId}.`);
    }
}

/** Error thrown when a high-level lock creation flow cannot resolve the created lock. */
export class CreateFailedError extends LockError {
    public readonly code = LockErrorCode.CREATE_FAILED;

    /**
     * @param transactionHash The transaction hash of the failed creation flow.
     * @param message The failure description.
     */
    constructor(
        public readonly transactionHash: TransactionHash.Type,
        message: string
    ) {
        super(`Failed to create lock from transaction ${transactionHash}: ${message}`);
    }
}

/** Class representing a protocol-level lock. */
class Lock {
    private _info: LockInfo;

    public constructor(
        public readonly grpc: ConcordiumGRPCClient,
        info: LockInfo
    ) {
        this._info = info;
    }

    public get info(): LockInfo {
        return this._info;
    }

    /**
     * Re-fetch current on-chain lock info and update this instance.
     *
     * @returns This lock instance after refreshing its state.
     */
    public async refresh(): Promise<this> {
        const next = await this.grpc.getLockInfo(this._info.lock);
        this._info = Cbor.decode(next.lockInfo, 'LockInfo');
        return this;
    }
}

/** Handle for a submitted lock-creation transaction. */
class LockCreateTransaction {
    public constructor(
        private readonly grpc: ConcordiumGRPCClient,
        public readonly transactionHash: TransactionHash.Type
    ) {}

    /**
     * Wait until the transaction is finalized and return the created lock.
     *
     * @param finalizationTimeoutSeconds Optional timeout in seconds for waiting for finalization.
     * @returns The created lock.
     */
    public async waitUntilFinalized(finalizationTimeoutSeconds?: number): Promise<Type> {
        const outcome = await this.grpc.waitForTransactionFinalization(
            this.transactionHash,
            finalizationTimeoutSeconds !== undefined ? finalizationTimeoutSeconds * 1000 : undefined
        );

        if (!isKnown(outcome.summary)) {
            throw new CreateFailedError(this.transactionHash, 'finalization summary is unknown');
        }
        if (outcome.summary.type !== TransactionSummaryType.AccountTransaction) {
            throw new CreateFailedError(this.transactionHash, 'finalization summary is not an account transaction');
        }
        if (outcome.summary.transactionType === TransactionKindString.Failed) {
            throw new CreateFailedError(this.transactionHash, 'transaction was rejected');
        }
        if (outcome.summary.transactionType !== TransactionKindString.MetaUpdate) {
            throw new CreateFailedError(this.transactionHash, 'transaction summary is not a meta update');
        }

        const event = outcome.summary.events.filter(isKnown).find(isLockCreatedEvent);
        if (event === undefined) {
            throw new CreateFailedError(this.transactionHash, 'missing LockCreated event');
        }

        return fromId(this.grpc, event.lockId);
    }
}

/** Builder for a lockCreate transaction with optional subsequent operations. */
class LockCreateProposal {
    private readonly subsequent: SubsequentOperation[] = [];

    public constructor(
        private readonly grpc: ConcordiumGRPCClient,
        private readonly sender: AccountAddress.Type,
        private readonly config: LockConfig,
        private readonly creationOrder: bigint | number = 0n
    ) {}

    /**
     * Add a lockFund operation to the proposal.
     *
     * @param details The fund details excluding the lock id.
     * @returns This proposal.
     */
    public fund(details: FundDetails): this {
        this.subsequent.push({ [MetaUpdateOperationType.LockFund]: details });
        return this;
    }

    /**
     * Add a lockSend operation to the proposal.
     *
     * @param details The send details excluding the lock id.
     * @returns This proposal.
     */
    public send(details: SendDetails): this {
        this.subsequent.push({
            [MetaUpdateOperationType.LockSend]: {
                ...details,
                source: CborAccountAddress.fromAccountAddress(details.source),
                recipient: CborAccountAddress.fromAccountAddress(details.recipient),
            },
        });
        return this;
    }

    /**
     * Add a lockReturn operation to the proposal.
     *
     * @param details The return details excluding the lock id.
     * @returns This proposal.
     */
    public returnFunds(details: ReturnDetails): this {
        this.subsequent.push({
            [MetaUpdateOperationType.LockReturn]: {
                ...details,
                source: CborAccountAddress.fromAccountAddress(details.source),
            },
        });
        return this;
    }

    /**
     * Add a lockCancel operation to the proposal.
     *
     * @returns This proposal.
     */
    public cancel(): this {
        this.subsequent.push({ [MetaUpdateOperationType.LockCancel]: {} });
        return this;
    }

    /**
     * Submit the composed transaction.
     *
     * @param signer The signer used to sign the transaction.
     * @param metadata Optional transaction metadata such as expiry and nonce.
     * @returns A submitted transaction handle.
     */
    public async submit(signer: AccountSigner, metadata?: LockUpdateMetadata): Promise<CreateTransaction> {
        const header = await resolveTransactionHeader(this.grpc, this.sender, metadata);
        const accountInfo = await this.grpc.getAccountInfo(this.sender);
        const lockId = LockId.create(accountInfo.accountIndex, header.nonce.value, BigInt(this.creationOrder));
        const payload = createMetaUpdatePayload([
            { [MetaUpdateOperationType.LockCreate]: this.config },
            ...bindLockId(lockId, this.subsequent),
        ]);
        const transactionHash = await submitPayload(this.grpc, header, payload, signer);
        return new LockCreateTransaction(this.grpc, transactionHash);
    }
}

/** Public lock client type. */
export type Type = Lock;

/** Public lock-create proposal builder type. */
export type CreateProposal = LockCreateProposal;

/** Public submitted lock-create transaction handle type. */
export type CreateTransaction = LockCreateTransaction;

/** Transaction metadata for lock MetaUpdate transactions. */
export type LockUpdateMetadata = {
    /** Optional transaction expiry. Defaults to five minutes in the future when omitted. */
    expiry?: TransactionExpiry.Type;
    /** Optional explicit account nonce. When omitted, the next account nonce is queried from chain. */
    nonce?: SequenceNumber.Type;
};

/** Options shared by high-level lock operations. */
export type LockOperationOptions = {
    /** Whether to run client-side validation before submission. */
    validate?: boolean;
};

/** Details for funding a lock. */
export type FundDetails = Omit<LockFund, 'lock'>;

/** Details for sending locked funds. */
export type SendDetails = Omit<LockSend, 'lock' | 'source' | 'recipient'> & {
    /** Account that currently holds the locked funds. */
    source: AccountAddress.Type;
    /** Account to receive the unlocked funds. */
    recipient: AccountAddress.Type;
};

/** Details for returning locked funds. */
export type ReturnDetails = Omit<LockReturn, 'lock' | 'source'> & {
    /** Account that currently holds the locked funds. */
    source: AccountAddress.Type;
};

/** Lock operations that can be composed after a lockCreate operation before the lock id is known on chain. */
export type SubsequentOperation =
    | { [MetaUpdateOperationType.LockCancel]: Omit<LockCancel, 'lock'> }
    | { [MetaUpdateOperationType.LockFund]: Omit<LockFund, 'lock'> }
    | { [MetaUpdateOperationType.LockSend]: Omit<LockSend, 'lock'> }
    | { [MetaUpdateOperationType.LockReturn]: Omit<LockReturn, 'lock'> };

/**
 * Create a Lock instance from a lock id by querying the node.
 *
 * @param grpc The gRPC client used to query the lock.
 * @param lockId The identifier of the lock to fetch.
 * @returns A lock client instance backed by the fetched on-chain state.
 */
export async function fromId(grpc: ConcordiumGRPCClient, lockId: LockId.Type): Promise<Lock> {
    const response = await grpc.getLockInfo(lockId);
    return fromCbor(grpc, response.lockInfo);
}

/**
 * Create a Lock instance from already-decoded lock info.
 *
 * @param grpc The gRPC client associated with the lock.
 * @param info The decoded lock info snapshot to wrap.
 * @returns A lock client instance backed by the supplied lock info.
 */
export function fromInfo(grpc: ConcordiumGRPCClient, info: LockInfo): Lock {
    return new Lock(grpc, info);
}

/**
 * Create a Lock instance by decoding CBOR-encoded lock info.
 *
 * @param grpc The gRPC client associated with the lock.
 * @param lockInfo The CBOR-encoded lock info to decode.
 * @returns A lock client instance backed by the decoded lock info.
 */
export function fromCbor(grpc: ConcordiumGRPCClient, lockInfo: Cbor.Type): Lock {
    return new Lock(grpc, Cbor.decode(lockInfo, 'LockInfo'));
}

function bindLockId(
    lockId: LockId.Type,
    operations: SubsequentOperation | SubsequentOperation[]
): MetaUpdateOperation[] {
    return [operations].flat().map((operation) => {
        const [type] = Object.keys(operation) as [keyof SubsequentOperation];
        const details = operation[type] as object;
        return {
            [type]: {
                ...details,
                lock: lockId,
            },
        } as MetaUpdateOperation;
    });
}

async function resolveTransactionHeader(
    grpc: ConcordiumGRPCClient,
    sender: AccountAddress.Type,
    { expiry = TransactionExpiry.futureMinutes(5), nonce }: LockUpdateMetadata = {}
): Promise<Transaction.Metadata> {
    const { nonce: nextNonce } = nonce ? { nonce } : await grpc.getNextAccountNonce(sender);
    return {
        expiry,
        nonce: nextNonce,
        sender,
    };
}

async function submitPayload(
    grpc: ConcordiumGRPCClient,
    header: Transaction.Metadata,
    payload: MetaUpdatePayload,
    signer: AccountSigner
): Promise<TransactionHash.Type> {
    const transaction = Transaction.metaUpdate(payload).addMetadata(header).build();
    const signed = await Transaction.signAndFinalize(transaction, signer);
    return grpc.sendTransaction(signed);
}

/**
 * Compose a lockCreate operation with subsequent lock operations that target the created lock.
 *
 * The returned operations can be submitted together in a single MetaUpdate transaction.
 *
 * This predicts the lock id using {@link LockId.fromAccount}, so the composed operations are only
 * accurate as long as no other transaction consumes the account's next nonce before submission.
 *
 * @param grpc The gRPC client used to resolve the predicted lock id from chain state.
 * @param account The account address or account index of the account that will create the lock.
 * @param config The lock configuration to use for the initial `lockCreate` operation.
 * @param operations The subsequent lock operations to apply to the created lock, excluding the `lock` field.
 * @param [creationOrder] The 0-based creation order of the `lockCreate` operation within the transaction. Defaults to `0`.
 *
 * @returns The composed operations beginning with `lockCreate`.
 */
export async function composeCreateOperations(
    grpc: ConcordiumGRPCClient,
    account: AccountAddress.Type | bigint,
    config: LockConfig,
    operations: SubsequentOperation | SubsequentOperation[],
    creationOrder: bigint | number = 0n
): Promise<MetaUpdateOperation[]> {
    const lockId = await LockId.fromAccount(grpc, account, creationOrder);
    return [{ [MetaUpdateOperationType.LockCreate]: config }, ...bindLockId(lockId, operations)];
}

/**
 * Submit a single MetaUpdate transaction that creates a lock and immediately executes subsequent
 * operations against that created lock.
 *
 * This predicts the lock id using {@link LockId.fromAccount}, so the composed operations are
 * only accurate as long as no other transaction consumes the account's next nonce before submission.
 *
 * @param grpc The gRPC client used to resolve the predicted lock id and submit the transaction.
 * @param sender The sender account that creates the lock and submits the transaction.
 * @param config The lock configuration to use for the initial `lockCreate` operation.
 * @param operations The subsequent lock operations to apply to the created lock, excluding the `lock` field.
 * @param signer The signer used to sign the composed transaction.
 * @param [metadata] Optional transaction metadata such as expiry and nonce.
 * @param [creationOrder] The 0-based creation order of the `lockCreate` operation within the transaction. Defaults to `0`.
 *
 * @returns The hash of the submitted transaction.
 */
export async function createAndSendOperations(
    grpc: ConcordiumGRPCClient,
    sender: AccountAddress.Type,
    config: LockConfig,
    operations: SubsequentOperation | SubsequentOperation[],
    signer: AccountSigner,
    metadata?: LockUpdateMetadata,
    creationOrder: bigint | number = 0n
): Promise<TransactionHash.Type> {
    const composed = await composeCreateOperations(grpc, sender, config, operations, creationOrder);
    return sendRawWithGrpc(grpc, sender, createMetaUpdatePayload(composed), signer, metadata);
}

/**
 * Submit a raw MetaUpdate payload for a lock operation.
 *
 * @param lock The lock client whose gRPC client is used for submission.
 * @param sender The sender account that submits the transaction.
 * @param payload The raw MetaUpdate payload to submit.
 * @param signer The signer used to sign the transaction.
 * @param metadata Optional transaction metadata such as expiry and nonce.
 * @returns The hash of the submitted transaction.
 */
export async function sendRaw(
    lock: Lock,
    sender: AccountAddress.Type,
    payload: MetaUpdatePayload,
    signer: AccountSigner,
    { expiry = TransactionExpiry.futureMinutes(5), nonce }: LockUpdateMetadata = {}
): Promise<TransactionHash.Type> {
    const { nonce: nextNonce } = nonce ? { nonce } : await lock.grpc.getNextAccountNonce(sender);
    const header: Transaction.Metadata = {
        expiry,
        nonce: nextNonce,
        sender,
    };

    const transaction = Transaction.metaUpdate(payload).addMetadata(header).build();
    const signed = await Transaction.signAndFinalize(transaction, signer);
    return lock.grpc.sendTransaction(signed);
}

/**
 * Submit one or more MetaUpdate operations for a lock.
 *
 * @param lock The lock client whose gRPC client is used for submission.
 * @param sender The sender account that submits the transaction.
 * @param operations The operation or operations to encode into the MetaUpdate payload.
 * @param signer The signer used to sign the transaction.
 * @param metadata Optional transaction metadata such as expiry and nonce.
 * @returns The hash of the submitted transaction.
 */
export function sendOperations(
    lock: Lock,
    sender: AccountAddress.Type,
    operations: MetaUpdateOperation | MetaUpdateOperation[],
    signer: AccountSigner,
    metadata?: LockUpdateMetadata
): Promise<TransactionHash.Type> {
    return sendRaw(lock, sender, createMetaUpdatePayload(operations), signer, metadata);
}

async function sendRawWithGrpc(
    grpc: ConcordiumGRPCClient,
    sender: AccountAddress.Type,
    payload: MetaUpdatePayload,
    signer: AccountSigner,
    metadata?: LockUpdateMetadata
): Promise<TransactionHash.Type> {
    const header = await resolveTransactionHeader(grpc, sender, metadata);
    return submitPayload(grpc, header, payload, signer);
}

/**
 * Submit a `lockCreate` MetaUpdate operation and return the transaction hash.
 *
 * @param grpc The gRPC client used for nonce lookup and submission.
 * @param sender The sender account that creates the lock.
 * @param config The lock configuration to encode into the `lockCreate` operation.
 * @param signer The signer used to sign the transaction.
 * @param metadata Optional transaction metadata such as expiry and nonce.
 * @returns The hash of the submitted transaction.
 */
export function createRaw(
    grpc: ConcordiumGRPCClient,
    sender: AccountAddress.Type,
    config: LockConfig,
    signer: AccountSigner,
    metadata?: LockUpdateMetadata
): Promise<TransactionHash.Type> {
    return sendRawWithGrpc(
        grpc,
        sender,
        createMetaUpdatePayload({ [MetaUpdateOperationType.LockCreate]: config }),
        signer,
        metadata
    );
}

/**
 * Begin building a lockCreate transaction with optional subsequent lock operations.
 *
 * @param grpc The gRPC client used for nonce lookup, submission, and later finalization waiting.
 * @param sender The sender account that creates the lock.
 * @param config The lock configuration to encode into the initial `lockCreate` operation.
 * @returns A proposal builder for the lock-creation transaction.
 */
export function create(grpc: ConcordiumGRPCClient, sender: AccountAddress.Type, config: LockConfig): CreateProposal {
    return new LockCreateProposal(grpc, sender, config);
}

function isLockCreatedEvent(event: { tag: TransactionEventTag }): event is LockCreatedEvent {
    return event.tag === TransactionEventTag.LockCreated;
}

function isExpired(lock: Lock): boolean {
    return lock.info.expiry.expiry.expiryEpochSeconds * 1000n <= BigInt(Date.now());
}

function simpleV0Controller(lock: Lock): LockController.Type[LockController.Variant.SimpleV0] | undefined {
    return lock.info.controller[LockController.Variant.SimpleV0];
}

function hasCapability(
    lock: Lock,
    sender: AccountAddress.Type,
    capability: LockController.SimpleV0Capability
): boolean {
    const simpleV0 = simpleV0Controller(lock);
    if (simpleV0 === undefined) {
        return true;
    }

    return simpleV0.grants.some(
        (grant) => grant.account.address.address === sender.address && grant.roles.includes(capability)
    );
}

function allowsToken(lock: Lock, token: TokenId.Type): boolean {
    const simpleV0 = simpleV0Controller(lock);
    if (simpleV0 === undefined) {
        return true;
    }

    return simpleV0.tokens.some((configured) => configured.value === token.value);
}

function lockedAmountOf(lock: Lock, source: AccountAddress.Type, token: TokenId.Type): TokenAmount.Type | undefined {
    return lock.info.funds
        .find((fund) => fund.account.address.address === source.address)
        ?.amounts.find((amount) => amount.token.value === token.value)?.amount;
}

function validateCapability(
    lock: Lock,
    sender: AccountAddress.Type,
    capability: LockController.SimpleV0Capability
): true {
    if (isExpired(lock)) {
        throw new LockExpiredError(lock.info.lock);
    }
    if (!hasCapability(lock, sender, capability)) {
        throw new MissingCapabilityError(sender, capability, lock.info.lock);
    }
    return true;
}

/**
 * Check whether the sender can cancel the lock.
 *
 * @param lock The lock to validate against.
 * @param sender The sender account to validate.
 * @returns `true` if the sender can cancel the lock.
 * @throws {LockExpiredError} If the lock has expired.
 * @throws {MissingCapabilityError} If the sender does not have the `cancel` capability for a `simpleV0` lock controller.
 *
 * For unknown controller variants, the capability check is skipped.
 */
export function canCancel(lock: Lock, sender: AccountAddress.Type): true {
    return validateCapability(lock, sender, LockController.SimpleV0Capability.Cancel);
}

/**
 * Check whether the sender can fund the lock.
 *
 * @param lock The lock to validate against.
 * @param sender The sender account to validate.
 * @param details The fund operation details, used to validate the sender's available balance.
 * @returns `true` if the sender can fund the lock.
 * @throws {LockExpiredError} If the lock has expired.
 * @throws {MissingCapabilityError} If the sender does not have the `fund` capability for a `simpleV0` lock controller.
 * @throws {TokenNotAllowedError} If the token is not configured on a `simpleV0` lock controller.
 * @throws {InsufficientFundsError} If the sender does not have enough available balance of the token.
 *
 * For unknown controller variants, the capability and configured-token checks are skipped.
 */
export async function canFund(lock: Lock, sender: AccountAddress.Type, details: FundDetails): Promise<true> {
    validateCapability(lock, sender, LockController.SimpleV0Capability.Fund);

    if (!allowsToken(lock, details.token)) {
        throw new TokenNotAllowedError(details.token, lock.info.lock);
    }

    const senderInfo = await lock.grpc.getAccountInfo(sender);
    const availableAmount = Token.availableBalanceOf(details.token, senderInfo);
    if (availableAmount === undefined || availableAmount.value < details.amount.value) {
        throw new InsufficientFundsError(sender, details.token, details.amount);
    }

    return true;
}

/**
 * Check whether the sender can send funds controlled by the lock.
 *
 * @param lock The lock to validate against.
 * @param sender The sender account to validate.
 * @param details The send operation details, used to validate the locked amount on the source account.
 * @returns `true` if the sender can send funds controlled by the lock.
 * @throws {LockExpiredError} If the lock has expired.
 * @throws {MissingCapabilityError} If the sender does not have the `send` capability for a `simpleV0` lock controller.
 * @throws {RecipientNotAllowedError} If the recipient is not configured on the lock.
 * @throws {InsufficientFundsError} If the source account does not have enough of the token locked in the lock.
 *
 * For unknown controller variants, the capability check is skipped.
 */
export function canSend(lock: Lock, sender: AccountAddress.Type, details: SendDetails): true {
    validateCapability(lock, sender, LockController.SimpleV0Capability.Send);

    const recipientAllowed = lock.info.recipients.some(
        (recipient) => recipient.address.address === details.recipient.address
    );
    if (!recipientAllowed) {
        throw new RecipientNotAllowedError(details.recipient, lock.info.lock);
    }

    const lockedAmount = lockedAmountOf(lock, details.source, details.token);
    if (lockedAmount === undefined || TokenAmount.toDecimal(lockedAmount).lt(TokenAmount.toDecimal(details.amount))) {
        throw new InsufficientFundsError(details.source, details.token, details.amount);
    }

    return true;
}

/**
 * Check whether the sender can return funds controlled by the lock.
 *
 * @param lock The lock to validate against.
 * @param sender The sender account to validate.
 * @returns `true` if the sender can return funds controlled by the lock.
 * @throws {LockExpiredError} If the lock has expired.
 * @throws {MissingCapabilityError} If the sender does not have the `return` capability for a `simpleV0` lock controller.
 * @throws {InsufficientFundsError} If the source account does not have enough of the token locked in the lock.
 *
 * For unknown controller variants, the capability check is skipped.
 */
export function canReturn(lock: Lock, sender: AccountAddress.Type, details: ReturnDetails): true {
    validateCapability(lock, sender, LockController.SimpleV0Capability.Return);

    const lockedAmount = lockedAmountOf(lock, details.source, details.token);
    if (lockedAmount === undefined || TokenAmount.toDecimal(lockedAmount).lt(TokenAmount.toDecimal(details.amount))) {
        throw new InsufficientFundsError(details.source, details.token, details.amount);
    }

    return true;
}

/**
 * Cancel a lock.
 *
 * @param lock The lock to cancel.
 * @param sender The sender account that submits the transaction.
 * @param signer The signer used to sign the transaction.
 * @param metadata Optional transaction metadata such as expiry and nonce.
 * @param options Optional validation behavior.
 * @returns The hash of the submitted transaction.
 * @throws {LockExpiredError} If `options.validate` is `true` and the lock has expired.
 * @throws {MissingCapabilityError} If `options.validate` is `true` and the sender does not have the `cancel` capability.
 */
export async function cancel(
    lock: Lock,
    sender: AccountAddress.Type,
    signer: AccountSigner,
    metadata?: LockUpdateMetadata,
    { validate = false }: LockOperationOptions = {}
): Promise<TransactionHash.Type> {
    if (validate) {
        canCancel(lock, sender);
    }

    return sendOperations(
        lock,
        sender,
        { [MetaUpdateOperationType.LockCancel]: { lock: lock.info.lock } },
        signer,
        metadata
    );
}

/**
 * Fund a lock with tokens from the sender account.
 *
 * @param lock The lock to fund.
 * @param sender The sender account that submits the transaction.
 * @param details The operation details excluding the lock id.
 * @param signer The signer used to sign the transaction.
 * @param metadata Optional transaction metadata such as expiry and nonce.
 * @param options Optional validation behavior.
 * @returns The hash of the submitted transaction.
 * @throws {LockExpiredError} If `options.validate` is `true` and the lock has expired.
 * @throws {MissingCapabilityError} If `options.validate` is `true` and the sender does not have the `fund` capability.
 * @throws {TokenNotAllowedError} If `options.validate` is `true` and the token is not configured on the lock.
 * @throws {InsufficientFundsError} If `options.validate` is `true` and the sender does not have enough available balance of the token.
 */
export async function fund(
    lock: Lock,
    sender: AccountAddress.Type,
    details: FundDetails,
    signer: AccountSigner,
    metadata?: LockUpdateMetadata,
    { validate = false }: LockOperationOptions = {}
): Promise<TransactionHash.Type> {
    if (validate) {
        await canFund(lock, sender, details);
    }

    return sendOperations(
        lock,
        sender,
        { [MetaUpdateOperationType.LockFund]: { ...details, lock: lock.info.lock } },
        signer,
        metadata
    );
}

/**
 * Send locked funds to a recipient.
 *
 * @param lock The lock controlling the funds.
 * @param sender The sender account that submits the transaction.
 * @param details The operation details excluding the lock id.
 * @param signer The signer used to sign the transaction.
 * @param metadata Optional transaction metadata such as expiry and nonce.
 * @param options Optional validation behavior.
 * @returns The hash of the submitted transaction.
 * @throws {LockExpiredError} If `options.validate` is `true` and the lock has expired.
 * @throws {MissingCapabilityError} If `options.validate` is `true` and the sender does not have the `send` capability.
 * @throws {RecipientNotAllowedError} If `options.validate` is `true` and the recipient is not configured on the lock.
 * @throws {InsufficientFundsError} If `options.validate` is `true` and the source account does not have enough of the token locked in the lock.
 */
export async function send(
    lock: Lock,
    sender: AccountAddress.Type,
    details: SendDetails,
    signer: AccountSigner,
    metadata?: LockUpdateMetadata,
    { validate = false }: LockOperationOptions = {}
): Promise<TransactionHash.Type> {
    const { source, recipient, ...common } = details;
    if (validate) {
        canSend(lock, sender, details);
    }

    return sendOperations(
        lock,
        sender,
        {
            [MetaUpdateOperationType.LockSend]: {
                ...common,
                lock: lock.info.lock,
                source: CborAccountAddress.fromAccountAddress(source),
                recipient: CborAccountAddress.fromAccountAddress(recipient),
            },
        },
        signer,
        metadata
    );
}

/**
 * Return locked funds to their owner account.
 *
 * @param lock The lock controlling the funds.
 * @param sender The sender account that submits the transaction.
 * @param details The operation details excluding the lock id.
 * @param signer The signer used to sign the transaction.
 * @param metadata Optional transaction metadata such as expiry and nonce.
 * @param options Optional validation behavior.
 * @returns The hash of the submitted transaction.
 * @throws {LockExpiredError} If `options.validate` is `true` and the lock has expired.
 * @throws {MissingCapabilityError} If `options.validate` is `true` and the sender does not have the `return` capability.
 * @throws {InsufficientFundsError} If `options.validate` is `true` and the source account does not have enough of the token locked in the lock.
 */
export async function returnFunds(
    lock: Lock,
    sender: AccountAddress.Type,
    details: ReturnDetails,
    signer: AccountSigner,
    metadata?: LockUpdateMetadata,
    { validate = false }: LockOperationOptions = {}
): Promise<TransactionHash.Type> {
    if (validate) {
        canReturn(lock, sender, details);
    }

    const { source, ...common } = details;

    return sendOperations(
        lock,
        sender,
        {
            [MetaUpdateOperationType.LockReturn]: {
                ...common,
                lock: lock.info.lock,
                source: CborAccountAddress.fromAccountAddress(source),
            },
        },
        signer,
        metadata
    );
}
