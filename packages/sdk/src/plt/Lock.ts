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
    LockConfig,
    LockController,
    LockId,
    LockInfo,
    Memo,
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
    /** The high-level lock creation flow did not produce a usable lock. */
    CREATE_FAILED = 'CREATE_FAILED',
}

/** Error thrown while interacting with PLT locks through the client. */
export abstract class LockError extends Error {
    public abstract readonly code: LockErrorCode;
    private _name: string = 'LockClientError';

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

    constructor(public readonly lockId: LockId.Type) {
        super(`Lock ${lockId} has expired.`);
    }
}

/** Error thrown when a high-level lock creation flow cannot resolve the created lock. */
export class CreateFailedError extends LockError {
    public readonly code = LockErrorCode.CREATE_FAILED;

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

    /** Re-fetch current on-chain lock info and update this instance. */
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

/** Options for high-level lock operations that support an optional memo. */
export type LockMemoOperationOptions = LockOperationOptions & {
    memo?: Memo;
};

/** Create a Lock instance from a lock id by querying the node. */
export async function fromId(grpc: ConcordiumGRPCClient, lockId: LockId.Type): Promise<Lock> {
    const response = await grpc.getLockInfo(lockId);
    return fromCbor(grpc, response.lockInfo);
}

/** Create a Lock instance from already-decoded lock info. */
export function fromInfo(grpc: ConcordiumGRPCClient, info: LockInfo): Lock {
    return new Lock(grpc, info);
}

/** Create a Lock instance by decoding CBOR-encoded lock info. */
export function fromCbor(grpc: ConcordiumGRPCClient, lockInfo: Cbor.Type): Lock {
    return new Lock(grpc, Cbor.decode(lockInfo, 'LockInfo'));
}

/** Submit a raw MetaUpdate payload for a lock operation. */
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

/** Submit one or more MetaUpdate operations for a lock. */
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

/** Submit a lockCreate MetaUpdate operation and return the transaction hash. */
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
 * @param finalizationTimeoutSeconds Optional timeout in seconds for waiting for finalization.
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

/** Validate that the sender can cancel the lock. */
export function validateCancelable(lock: Lock, sender: AccountAddress.Type): Promise<true> {
    return validateCapability(lock, sender, LockController.SimpleV0Capability.Cancel);
}

/** Validate that the sender can fund the lock. */
export function validateFund(lock: Lock, sender: AccountAddress.Type): Promise<true> {
    return validateCapability(lock, sender, LockController.SimpleV0Capability.Fund);
}

/** Validate that the sender can send funds controlled by the lock. */
export function validateSend(lock: Lock, sender: AccountAddress.Type): Promise<true> {
    return validateCapability(lock, sender, LockController.SimpleV0Capability.Send);
}

/** Validate that the sender can return funds controlled by the lock. */
export function validateReturn(lock: Lock, sender: AccountAddress.Type): Promise<true> {
    return validateCapability(lock, sender, LockController.SimpleV0Capability.Return);
}

/** Cancel a lock. */
export async function cancel(
    lock: Lock,
    sender: AccountAddress.Type,
    signer: AccountSigner,
    metadata?: LockUpdateMetadata,
    { validate = false, memo }: LockMemoOperationOptions = {}
): Promise<TransactionHash.Type> {
    if (validate) {
        await validateCancelable(lock, sender);
    }

    return sendOperations(
        lock,
        sender,
        { [MetaUpdateOperationType.LockCancel]: { lock: lock.info.lock, memo } },
        signer,
        metadata
    );
}

/** Fund a lock with tokens from the sender account. */
export async function fund(
    lock: Lock,
    sender: AccountAddress.Type,
    token: TokenId.Type,
    amount: TokenAmount.Type,
    signer: AccountSigner,
    metadata?: LockUpdateMetadata,
    { validate = false, memo }: LockMemoOperationOptions = {}
): Promise<TransactionHash.Type> {
    if (validate) {
        await validateFund(lock, sender);
    }

    return sendOperations(
        lock,
        sender,
        { [MetaUpdateOperationType.LockFund]: { token, lock: lock.info.lock, amount, memo } },
        signer,
        metadata
    );
}

/** Send locked funds to a recipient. */
export async function send(
    lock: Lock,
    sender: AccountAddress.Type,
    token: TokenId.Type,
    source: AccountAddress.Type,
    amount: TokenAmount.Type,
    recipient: AccountAddress.Type,
    signer: AccountSigner,
    metadata?: LockUpdateMetadata,
    { validate = false, memo }: LockMemoOperationOptions = {}
): Promise<TransactionHash.Type> {
    if (validate) {
        await validateSend(lock, sender);
    }

    return sendOperations(
        lock,
        sender,
        {
            [MetaUpdateOperationType.LockSend]: {
                token,
                lock: lock.info.lock,
                source: CborAccountAddress.fromAccountAddress(source),
                amount,
                recipient: CborAccountAddress.fromAccountAddress(recipient),
                memo,
            },
        },
        signer,
        metadata
    );
}

/** Return locked funds to their owner account. */
export async function returnFunds(
    lock: Lock,
    sender: AccountAddress.Type,
    token: TokenId.Type,
    source: AccountAddress.Type,
    amount: TokenAmount.Type,
    signer: AccountSigner,
    metadata?: LockUpdateMetadata,
    { validate = false, memo }: LockMemoOperationOptions = {}
): Promise<TransactionHash.Type> {
    if (validate) {
        await validateReturn(lock, sender);
    }

    return sendOperations(
        lock,
        sender,
        {
            [MetaUpdateOperationType.LockReturn]: {
                token,
                lock: lock.info.lock,
                source: CborAccountAddress.fromAccountAddress(source),
                amount,
                memo,
            },
        },
        signer,
        metadata
    );
}
