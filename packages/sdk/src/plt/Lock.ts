import { ConcordiumGRPCClient } from '../grpc/GRPCClient.js';
import { isKnown } from '../grpc/upward.js';
import { AccountAddress, MetaUpdatePayload, TransactionExpiry, TransactionHash } from '../pub/types.js';
import { AccountSigner } from '../signHelpers.js';
import { Transaction } from '../transactions/index.js';
import { TransactionSummaryType } from '../types.js';
import { TransactionKindString } from '../types/blockItemSummary.js';
import { SequenceNumber } from '../types/index.js';
import { LockCreatedEvent, TransactionEventTag } from '../types/transactionEvent.js';
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
    createMetaUpdatePayload,
} from './index.js';

/** Enum representing the types of errors that can occur when interacting with PLT locks through the client. */
export enum LockErrorCode {
    /** The sender does not have the required lock controller capability. */
    MISSING_CAPABILITY = 'MISSING_CAPABILITY',
    /** The lock has expired. */
    LOCK_EXPIRED = 'LOCK_EXPIRED',
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

export type Type = Lock;

/** Transaction metadata for lock MetaUpdate transactions. */
export type LockUpdateMetadata = {
    expiry?: TransactionExpiry.Type;
    nonce?: SequenceNumber.Type;
};

/** Options shared by high-level lock operations. */
export type LockOperationOptions = {
    validate?: boolean;
};

/** Details for funding a lock. */
export type FundDetails = Omit<LockFund, 'lock'>;

/** Details for sending locked funds. */
export type SendDetails = Omit<LockSend, 'lock' | 'source' | 'recipient'> & {
    source: AccountAddress.Type;
    recipient: AccountAddress.Type;
};

/** Details for returning locked funds. */
export type ReturnDetails = Omit<LockReturn, 'lock' | 'source'> & {
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
    { expiry = TransactionExpiry.futureMinutes(5), nonce }: LockUpdateMetadata = {}
): Promise<TransactionHash.Type> {
    const { nonce: nextNonce } = nonce ? { nonce } : await grpc.getNextAccountNonce(sender);
    const header: Transaction.Metadata = {
        expiry,
        nonce: nextNonce,
        sender,
    };

    const transaction = Transaction.metaUpdate(payload).addMetadata(header).build();
    const signed = await Transaction.signAndFinalize(transaction, signer);
    return grpc.sendTransaction(signed);
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
 * Create a lock, wait for finalization, and return a Lock instance for the created lock.
 *
 * @param grpc The gRPC client used for submission, finalization waiting, and lock lookup.
 * @param sender The sender account that creates the lock.
 * @param config The lock configuration to encode into the `lockCreate` operation.
 * @param signer The signer used to sign the transaction.
 * @param metadata Optional transaction metadata such as expiry and nonce.
 * @param finalizationTimeoutSeconds Optional timeout in seconds for waiting for finalization.
 * @returns A lock client instance for the created lock.
 */
export async function create(
    grpc: ConcordiumGRPCClient,
    sender: AccountAddress.Type,
    config: LockConfig,
    signer: AccountSigner,
    metadata?: LockUpdateMetadata,
    finalizationTimeoutSeconds?: number
): Promise<Lock> {
    const txHash = await createRaw(grpc, sender, config, signer, metadata);
    const outcome = await grpc.waitForTransactionFinalization(
        txHash,
        finalizationTimeoutSeconds !== undefined ? finalizationTimeoutSeconds * 1000 : undefined
    );

    if (!isKnown(outcome.summary)) {
        throw new CreateFailedError(txHash, 'finalization summary is unknown');
    }
    if (outcome.summary.type !== TransactionSummaryType.AccountTransaction) {
        throw new CreateFailedError(txHash, 'finalization summary is not an account transaction');
    }
    if (outcome.summary.transactionType === TransactionKindString.Failed) {
        throw new CreateFailedError(txHash, 'transaction was rejected');
    }
    if (outcome.summary.transactionType !== TransactionKindString.MetaUpdate) {
        throw new CreateFailedError(txHash, 'transaction summary is not a meta update');
    }

    const event = outcome.summary.events.filter(isKnown).find(isLockCreatedEvent);
    if (event === undefined) {
        throw new CreateFailedError(txHash, 'missing LockCreated event');
    }

    return fromId(grpc, event.lockId);
}

function isLockCreatedEvent(event: { tag: TransactionEventTag }): event is LockCreatedEvent {
    return event.tag === TransactionEventTag.LockCreated;
}

function isExpired(lock: Lock): boolean {
    return lock.info.expiry.expiry.expiryEpochSeconds * 1000n <= BigInt(Date.now());
}

function hasCapability(
    lock: Lock,
    sender: AccountAddress.Type,
    capability: LockController.SimpleV0Capability
): boolean {
    const simpleV0 = lock.info.controller[LockController.Variant.SimpleV0];
    if (simpleV0 === undefined) {
        return true;
    }

    return simpleV0.grants.some(
        (grant) => grant.account.address.address === sender.address && grant.roles.includes(capability)
    );
}

async function validateCapability(
    lock: Lock,
    sender: AccountAddress.Type,
    capability: LockController.SimpleV0Capability
): Promise<true> {
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
 */
export function canCancel(lock: Lock, sender: AccountAddress.Type): Promise<true> {
    return validateCapability(lock, sender, LockController.SimpleV0Capability.Cancel);
}

/**
 * Check whether the sender can fund the lock.
 *
 * @param lock The lock to validate against.
 * @param sender The sender account to validate.
 * @returns `true` if the sender can fund the lock.
 */
export function canFund(lock: Lock, sender: AccountAddress.Type): Promise<true> {
    return validateCapability(lock, sender, LockController.SimpleV0Capability.Fund);
}

/**
 * Check whether the sender can send funds controlled by the lock.
 *
 * @param lock The lock to validate against.
 * @param sender The sender account to validate.
 * @returns `true` if the sender can send funds controlled by the lock.
 */
export function canSend(lock: Lock, sender: AccountAddress.Type): Promise<true> {
    return validateCapability(lock, sender, LockController.SimpleV0Capability.Send);
}

/**
 * Check whether the sender can return funds controlled by the lock.
 *
 * @param lock The lock to validate against.
 * @param sender The sender account to validate.
 * @returns `true` if the sender can return funds controlled by the lock.
 */
export function canReturn(lock: Lock, sender: AccountAddress.Type): Promise<true> {
    return validateCapability(lock, sender, LockController.SimpleV0Capability.Return);
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
 */
export async function cancel(
    lock: Lock,
    sender: AccountAddress.Type,
    signer: AccountSigner,
    metadata?: LockUpdateMetadata,
    { validate = false }: LockOperationOptions = {}
): Promise<TransactionHash.Type> {
    if (validate) {
        await canCancel(lock, sender);
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
        await canFund(lock, sender);
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
 */
export async function send(
    lock: Lock,
    sender: AccountAddress.Type,
    { source, recipient, ...details }: SendDetails,
    signer: AccountSigner,
    metadata?: LockUpdateMetadata,
    { validate = false }: LockOperationOptions = {}
): Promise<TransactionHash.Type> {
    if (validate) {
        await canSend(lock, sender);
    }

    return sendOperations(
        lock,
        sender,
        {
            [MetaUpdateOperationType.LockSend]: {
                ...details,
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
 */
export async function returnFunds(
    lock: Lock,
    sender: AccountAddress.Type,
    { source, ...details }: ReturnDetails,
    signer: AccountSigner,
    metadata?: LockUpdateMetadata,
    { validate = false }: LockOperationOptions = {}
): Promise<TransactionHash.Type> {
    if (validate) {
        await canReturn(lock, sender);
    }

    return sendOperations(
        lock,
        sender,
        {
            [MetaUpdateOperationType.LockReturn]: {
                ...details,
                lock: lock.info.lock,
                source: CborAccountAddress.fromAccountAddress(source),
            },
        },
        signer,
        metadata
    );
}
