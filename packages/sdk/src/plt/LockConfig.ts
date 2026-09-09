import { cborDecode } from '../types/cbor.js';
import * as CborAccountAddress from './CborAccountAddress.js';
import * as CborEpoch from './CborEpoch.js';
import * as CborMemo from './CborMemo.js';
import * as TokenId from './TokenId.js';
import type { Memo } from './TokenOperation.js';

/** Supported lock configuration variants. */
export enum Variant {
    /** Simple protocol-level lock version 0. */
    SimpleV0 = 'simpleV0',
}

/** Capabilities that can be granted for a simple v0 lock. */
export enum SimpleV0Capability {
    /** Authorizes funding the lock with a permitted token. */
    Fund = 'fund',
    /** Authorizes returning funds from the lock. */
    Return = 'return',
    /** Authorizes sending funds from the lock to an eligible recipient. */
    Send = 'send',
    /** Authorizes cancelling the lock. */
    Cancel = 'cancel',
}

/** A grant of simple v0 lock capabilities to an account. */
export type SimpleV0Grant = {
    /** Account receiving the capabilities. */
    account: CborAccountAddress.Type;
    /** Capabilities granted to the account. */
    roles: SimpleV0Capability[];
};

/** Accounts permitted to receive funds controlled by a lock. */
export type Recipients = 'any' | CborAccountAddress.Type[];

/** Simple v0 lock configuration payload. */
export type SimpleV0 = {
    /** Accounts eligible to receive funds from the lock. */
    recipients: Recipients;
    /** Time at which the lock expires. */
    expiry: CborEpoch.Type;
    /** Capability grants authorizing accounts to operate the lock. */
    grants: SimpleV0Grant[];
    /** Tokens that may be funded into the lock. */
    tokens: TokenId.Type[];
    /** Whether to retain the lock after all funds are returned. */
    keepAlive?: boolean;
    /** Optional memo attached to the lock. */
    memo?: Memo;
    /** Raw CBOR bytes. Use `LockMetadata.encode` and `LockMetadata.decode` for typed metadata. */
    metadata?: Uint8Array;
};

/** Tagged lock configuration. */
export type Type = { [Variant.SimpleV0]: SimpleV0 };

/**
 * Construct a simple v0 lock configuration.
 *
 * @param recipients Accounts eligible to receive funds from the lock.
 * @param expiry Time at which the lock expires.
 * @param grants Capability grants authorizing accounts to operate the lock.
 * @param tokens Tokens that may be funded into the lock.
 * @param keepAlive Whether to retain the lock after all funds are returned.
 * @param memo Optional memo attached to the lock.
 * @param metadata Optional raw CBOR metadata.
 * @returns Tagged simple v0 lock configuration.
 *
 * @example
 * ```ts
 * const config = LockConfig.simpleV0(recipients, expiry, grants, tokens);
 * ```
 */
export function simpleV0(
    recipients: Recipients,
    expiry: CborEpoch.Type,
    grants: SimpleV0Grant[],
    tokens: TokenId.Type[],
    keepAlive?: boolean,
    memo?: Memo,
    metadata?: Uint8Array
): Type {
    return { [Variant.SimpleV0]: { recipients, expiry, grants, tokens, keepAlive, memo, metadata } };
}

/** Decode a lock configuration from its CBOR-compatible value. */
export function fromCBORValue(decoded: unknown): Type {
    if (
        typeof decoded !== 'object' ||
        decoded === null ||
        Array.isArray(decoded) ||
        Object.keys(decoded).length !== 1 ||
        !(Variant.SimpleV0 in decoded)
    ) {
        throw new Error('Invalid lock config: expected a single simpleV0 variant');
    }
    const simple = (decoded as Record<Variant.SimpleV0, unknown>)[Variant.SimpleV0];
    if (typeof simple !== 'object' || simple === null || Array.isArray(simple)) {
        throw new Error('Invalid simpleV0 lock config: expected object');
    }
    const config = simple as Record<string, unknown>;
    if (
        config.recipients !== 'any' &&
        !(Array.isArray(config.recipients) && config.recipients.every(CborAccountAddress.instanceOf))
    ) {
        throw new Error(
            'Invalid simpleV0 lock config: expected recipients to be "any" or an array of CBOR account addresses'
        );
    }
    if (!CborEpoch.instanceOf(config.expiry)) {
        throw new Error('Invalid simpleV0 lock config: expected expiry as CBOR epoch time');
    }
    if (!Array.isArray(config.grants) || !Array.isArray(config.tokens)) {
        throw new Error('Invalid simpleV0 lock config: expected grants and tokens arrays');
    }
    const grants = config.grants.map((grant) => {
        if (typeof grant !== 'object' || grant === null) throw new Error('Invalid simpleV0 grant: expected object');
        const entry = grant as Record<string, unknown>;
        if (
            !CborAccountAddress.instanceOf(entry.account) ||
            !Array.isArray(entry.roles) ||
            !entry.roles.every((role) => Object.values(SimpleV0Capability).includes(role as SimpleV0Capability))
        ) {
            throw new Error('Invalid simpleV0 grant: expected account and roles');
        }
        return { account: entry.account, roles: entry.roles as SimpleV0Capability[] };
    });
    const tokens = config.tokens.map((token) => {
        if (typeof token !== 'string') throw new Error('Invalid simpleV0 lock config: expected token ids as strings');
        return TokenId.fromString(token);
    });
    if (config.keepAlive !== undefined && typeof config.keepAlive !== 'boolean')
        throw new Error('Invalid simpleV0 lock config: keepAlive must be a boolean');
    if (config.metadata !== undefined && !(config.metadata instanceof Uint8Array))
        throw new Error('Invalid simpleV0 lock config: expected metadata as CBOR bytes');
    if (config.memo !== undefined && !(config.memo instanceof Uint8Array) && !CborMemo.instanceOf(config.memo))
        throw new Error('Invalid simpleV0 lock config: expected memo as CBOR bytes or memo');

    return simpleV0(
        config.recipients,
        config.expiry,
        grants,
        tokens,
        config.keepAlive,
        config.memo as SimpleV0['memo'],
        config.metadata as Uint8Array | undefined
    );
}

/** Decode CBOR-encoded lock configuration bytes. */
export function fromCBOR(bytes: Uint8Array): Type {
    return fromCBORValue(cborDecode(bytes));
}
