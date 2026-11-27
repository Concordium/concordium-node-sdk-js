import { Buffer } from 'buffer/index.js';

import * as AccountAddress from '../types/AccountAddress.js';
import * as CborAccountAddress from './CborAccountAddress.js';
import * as CborEpoch from './CborEpoch.js';
import type { Recipients } from './LockConfig.js';
import * as TokenId from './TokenId.js';

/** Explicit capabilities granted when creating a simple v0 lock. */
export enum SimpleV0Capability {
    Release = 'release',
    Send = 'send',
    Cancel = 'cancel',
}

/** Explicit capabilities assigned to an account. */
export type SimpleV0Role = {
    account: CborAccountAddress.Type;
    roles: SimpleV0Capability[];
};

/** Simple v0 lock creation parameters. */
export type SimpleV0 = {
    recipients: Recipients;
    holders: CborAccountAddress.Type[];
    expiry: CborEpoch.Type;
    roles: SimpleV0Role[];
    tokens: TokenId.Type[];
    metadata?: Uint8Array;
};

/** Externally keyed lock creation configuration. */
export type Type = { simpleV0: SimpleV0 };

/** Construct a simple v0 lock creation configuration. */
export function simpleV0(
    recipients: Recipients,
    holders: CborAccountAddress.Type[],
    expiry: CborEpoch.Type,
    roles: SimpleV0Role[],
    tokens: TokenId.Type[],
    metadata?: Uint8Array
): Type {
    return { simpleV0: { recipients, holders, expiry, roles, tokens, metadata } };
}

/** Decode a creation configuration from a CBOR-compatible value. */
export function fromCBORValue(decoded: unknown): Type {
    if (
        typeof decoded !== 'object' ||
        decoded === null ||
        Array.isArray(decoded) ||
        Object.keys(decoded).length !== 1 ||
        !('simpleV0' in decoded)
    ) {
        throw new Error('Invalid lock config: expected a single simpleV0 variant');
    }
    const simple = (decoded as { simpleV0: unknown }).simpleV0;
    if (typeof simple !== 'object' || simple === null || Array.isArray(simple)) {
        throw new Error('Invalid simpleV0 lock config: expected object');
    }
    const config = simple as Record<string, unknown>;
    if ('grants' in config) throw new Error('Invalid simpleV0 lock config: grants are not supported');
    if (
        config.recipients !== 'any' &&
        !(Array.isArray(config.recipients) && config.recipients.every(CborAccountAddress.instanceOf))
    ) {
        throw new Error('Invalid simpleV0 lock config: invalid recipients');
    }
    if (!CborEpoch.instanceOf(config.expiry)) throw new Error('Invalid simpleV0 lock config: invalid expiry');
    if (
        !Array.isArray(config.holders) ||
        !config.holders.every(CborAccountAddress.instanceOf) ||
        !Array.isArray(config.roles) ||
        !Array.isArray(config.tokens)
    ) {
        throw new Error('Invalid simpleV0 lock config: expected holders, roles and tokens arrays');
    }
    const roles = config.roles.map((role) => {
        if (typeof role !== 'object' || role === null || Array.isArray(role)) throw new Error('Invalid simpleV0 role');
        const entry = role as Record<string, unknown>;
        if (
            !CborAccountAddress.instanceOf(entry.account) ||
            !Array.isArray(entry.roles) ||
            !entry.roles.every((capability) =>
                Object.values(SimpleV0Capability).includes(capability as SimpleV0Capability)
            )
        ) {
            throw new Error('Invalid simpleV0 role: expected account and supported capabilities');
        }
        return { account: entry.account, roles: entry.roles as SimpleV0Capability[] };
    });
    const tokens = config.tokens.map((token) => {
        if (typeof token !== 'string') throw new Error('Invalid simpleV0 lock config: invalid token');
        return TokenId.fromString(token);
    });
    if (config.metadata !== undefined && !(config.metadata instanceof Uint8Array)) {
        throw new Error('Invalid simpleV0 lock config: invalid metadata');
    }
    return simpleV0(
        config.recipients,
        config.holders,
        config.expiry,
        roles,
        tokens,
        config.metadata as Uint8Array | undefined
    );
}

/** Count distinct holders, token IDs and holder or role accounts for creation pricing. */
export function getCreationComplexity(config: Type): { holders: number; tokens: number; roleAccounts: number } {
    const identity = (account: CborAccountAddress.Type) =>
        Buffer.from(AccountAddress.toBuffer(account.address).subarray(0, 29)).toString('hex');
    const holders = new Set(config.simpleV0.holders.map(identity));
    const roleAccounts = new Set([...holders, ...config.simpleV0.roles.map((role) => identity(role.account))]);
    return {
        holders: holders.size,
        tokens: new Set(config.simpleV0.tokens.map((token) => token.value.toLowerCase())).size,
        roleAccounts: roleAccounts.size,
    };
}
