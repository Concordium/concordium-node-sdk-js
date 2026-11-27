import { cborDecode } from '../types/cbor.js';
import * as CborAccountAddress from './CborAccountAddress.js';
import * as CborEpoch from './CborEpoch.js';
import * as TokenId from './TokenId.js';

/** Known lock configuration variants. */
export enum Variant {
    /** Simple protocol-level lock version 0. */
    SimpleV0 = 'simpleV0',
}

/** Known effective capabilities for a simple v0 lock. */
export enum SimpleV0Capability {
    /** Authorizes funding the lock with a permitted token. */
    Fund = 'fund',
    /** Authorizes releasing funds from the lock. */
    Release = 'release',
    /** Authorizes sending funds from the lock to an eligible recipient. */
    Send = 'send',
    /** Authorizes cancelling the lock. */
    Cancel = 'cancel',
}

/** Effective capabilities for an account, including strings not recognized by this SDK. */
export type Role = {
    account: CborAccountAddress.Type;
    roles: string[];
};

/** Accounts permitted to receive funds controlled by a lock. */
export type Recipients = 'any' | CborAccountAddress.Type[];

/** Version-zero output with typed fields, regardless of whether the variant and roles are supported. */
export type V0 = {
    version: 0;
    variant: string;
    recipients: Recipients;
    holders: CborAccountAddress.Type[];
    expiry: CborEpoch.Type;
    roles: Role[];
    tokens: TokenId.Type[];
    /** Opaque bytes; use `LockMetadata.decode` to interpret them as typed metadata. */
    metadata?: Uint8Array;
};

/** Configuration from a version this SDK does not interpret. */
export type Unknown = {
    version: number;
    /** The full CBOR-decoded configuration without v0 field conversion. */
    data: unknown;
};

/** Versioned output; only unknown versions have a `data` field. */
export type Type = Known | Unknown;

/** Lock configurations with versions understood by this SDK. */
export type Known = V0;

/** Check whether the SDK understands the version of a decoded lock configuration. */
export function isKnown(config: Type): config is Known {
    return config.version === 0;
}

/** Decode a lock configuration from a CBOR-decoded value. Throws if the version or a v0 field is invalid. */
export function fromCBORValue(decoded: unknown): Type {
    if (typeof decoded !== 'object' || decoded === null || Array.isArray(decoded)) {
        throw new Error('Invalid lock config: expected a map');
    }
    const rawVersion =
        decoded instanceof Map ? decoded.get('version') : 'version' in decoded ? decoded.version : undefined;
    if (typeof rawVersion !== 'number' && typeof rawVersion !== 'bigint') {
        throw new Error('Invalid lock config: expected a numeric version');
    }
    const version = Number(rawVersion);
    if (!Number.isFinite(version)) throw new Error('Invalid lock config: expected a finite version');
    if (version !== 0) return { version, data: decoded };

    const fields =
        decoded instanceof Map ? Object.fromEntries([...decoded].filter(([key]) => typeof key === 'string')) : decoded;
    const { variant, recipients, holders, expiry, roles, tokens, metadata } = fields as Record<string, unknown>;
    if (typeof variant !== 'string') throw new Error('Invalid v0 lock config: expected a variant string');
    if (recipients !== 'any' && !(Array.isArray(recipients) && recipients.every(CborAccountAddress.instanceOf))) {
        throw new Error('Invalid v0 lock config: invalid recipients');
    }
    if (!Array.isArray(holders) || !holders.every(CborAccountAddress.instanceOf)) {
        throw new Error('Invalid v0 lock config: invalid holders');
    }
    if (!CborEpoch.instanceOf(expiry)) throw new Error('Invalid v0 lock config: invalid expiry');
    if (!Array.isArray(roles) || !Array.isArray(tokens)) {
        throw new Error('Invalid v0 lock config: expected roles and tokens arrays');
    }
    const effectiveRoles = roles.map((role): Role => {
        if (typeof role !== 'object' || role === null || Array.isArray(role)) {
            throw new Error('Invalid v0 lock role: expected an object');
        }
        const { account, roles: capabilities } = role as Record<string, unknown>;
        if (
            !CborAccountAddress.instanceOf(account) ||
            !Array.isArray(capabilities) ||
            !capabilities.every((capability): capability is string => typeof capability === 'string')
        ) {
            throw new Error('Invalid v0 lock role: expected an account and capability strings');
        }
        return { account, roles: capabilities };
    });
    const tokenIds = tokens.map((token) => {
        if (typeof token !== 'string') throw new Error('Invalid v0 lock config: expected token IDs as strings');
        return TokenId.fromString(token);
    });
    if (metadata !== undefined && !(metadata instanceof Uint8Array)) {
        throw new Error('Invalid v0 lock config: expected metadata bytes');
    }
    return { version, variant, recipients, holders, expiry, roles: effectiveRoles, tokens: tokenIds, metadata };
}

/** Decode CBOR-encoded lock configuration bytes. Throws if CBOR decoding or configuration parsing fails. */
export function fromCBOR(bytes: Uint8Array): Type {
    return fromCBORValue(cborDecode(bytes));
}
