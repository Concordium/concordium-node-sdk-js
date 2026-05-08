import * as Cbor from './Cbor.js';
import * as CborAccountAddress from './CborAccountAddress.js';
import * as TokenId from './TokenId.js';
import { Memo } from './TokenOperation.js';

/** Supported lock controller variants. */
export enum Variant {
    /** Simple protocol-level lock controller version 0. */
    SimpleV0 = 'simpleV0',
}

/** Capabilities that can be granted for the simple v0 lock controller. */
export enum SimpleV0Capability {
    /** Capability to perform `lockFund`. */
    Fund = 'fund',
    /** Capability to perform `lockReturn`. */
    Return = 'return',
    /** Capability to perform `lockSend`. */
    Send = 'send',
    /** Capability to perform `lockCancel` before expiry. */
    Cancel = 'cancel',
}

/** A grant of simple v0 lock controller capabilities to an account. */
export type SimpleV0Grant = {
    /** The account receiving the role grant. */
    account: CborAccountAddress.Type;
    /** The granted capabilities. */
    roles: SimpleV0Capability[];
};

/** Simple v0 lock controller configuration. */
export type SimpleV0 = {
    [Variant.SimpleV0]: {
        /** Capability grants. */
        grants: SimpleV0Grant[];
        /** Token ids the lock can hold. */
        tokens: TokenId.Type[];
        /** Whether the lock must remain alive until expiry unless explicitly cancelled. */
        keepAlive?: boolean;
        /** Optional controller memo. */
        memo?: Memo;
    };
};

/** Lock controller configuration. */
export type Type = SimpleV0;

/**
 * Construct a simple v0 lock controller configuration.
 *
 * @param grants capability grants for accounts.
 * @param tokens token ids the lock can hold.
 * @param options optional keep-alive and memo fields.
 * @returns a simple v0 lock controller configuration.
 */
export function simpleV0(
    grants: SimpleV0Grant[],
    tokens: TokenId.Type[],
    options?: { keepAlive?: boolean; memo?: Memo }
): SimpleV0 {
    return {
        [Variant.SimpleV0]: {
            grants,
            tokens,
            keepAlive: options?.keepAlive,
            memo: options?.memo,
        },
    };
}

/**
 * Convert a lock controller to its CBOR-compatible intermediary value.
 *
 * @param controller lock controller to convert.
 * @returns a value suitable for CBOR encoding.
 */
export function toCBORValue(controller: Type): object {
    return controller;
}

/**
 * Encode a lock controller to CBOR bytes.
 *
 * @param controller lock controller to encode.
 * @returns CBOR encoded bytes.
 */
export function toCBOR(controller: Type): Uint8Array {
    return Cbor.encode(toCBORValue(controller)).bytes;
}

/**
 * Decode a CBOR-compatible intermediary value as a lock controller.
 *
 * @param decoded decoded CBOR value.
 * @returns the decoded lock controller.
 */
export function fromCBORValue(decoded: unknown): Type {
    if (typeof decoded !== 'object' || decoded === null || !(Variant.SimpleV0 in decoded)) {
        throw new Error('Invalid lock controller: expected simpleV0 variant');
    }

    const simple = (decoded as Record<Variant.SimpleV0, unknown>)[Variant.SimpleV0];
    if (typeof simple !== 'object' || simple === null) {
        throw new Error('Invalid simpleV0 lock controller: expected object');
    }

    const value = simple as Record<string, unknown>;
    if (!Array.isArray(value.grants)) {
        throw new Error('Invalid simpleV0 lock controller: expected grants array');
    }
    if (!Array.isArray(value.tokens)) {
        throw new Error('Invalid simpleV0 lock controller: expected tokens array');
    }

    const grants = value.grants.map((grant) => {
        if (typeof grant !== 'object' || grant === null) {
            throw new Error('Invalid simpleV0 grant: expected object');
        }
        const grantValue = grant as Record<string, unknown>;
        if (!CborAccountAddress.instanceOf(grantValue.account)) {
            throw new Error('Invalid simpleV0 grant: expected account');
        }
        if (
            !Array.isArray(grantValue.roles) ||
            !grantValue.roles.every((role) => Object.values(SimpleV0Capability).includes(role as SimpleV0Capability))
        ) {
            throw new Error('Invalid simpleV0 grant: expected roles');
        }
        return {
            account: grantValue.account,
            roles: grantValue.roles as SimpleV0Capability[],
        };
    });

    const tokens = value.tokens.map((token) => {
        if (typeof token !== 'string') {
            throw new Error('Invalid simpleV0 lock controller: expected token ids as strings');
        }
        return TokenId.fromString(token);
    });

    if (value.keepAlive !== undefined && typeof value.keepAlive !== 'boolean') {
        throw new Error('Invalid simpleV0 lock controller: keepAlive must be a boolean');
    }

    return simpleV0(grants, tokens, {
        keepAlive: value.keepAlive,
        memo: value.memo as Memo | undefined,
    });
}

/**
 * Decode CBOR bytes as a lock controller.
 *
 * @param bytes CBOR encoded lock controller.
 * @returns the decoded lock controller.
 */
export function fromCBOR(bytes: Uint8Array): Type {
    return fromCBORValue(Cbor.decode(Cbor.fromBuffer(bytes)));
}
