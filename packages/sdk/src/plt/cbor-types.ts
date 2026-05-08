import { MAX_U8 } from '../constants.js';
import * as Cbor from './Cbor.js';
import type * as CborAccountAddress from './CborAccountAddress.js';
import type * as CborEpoch from './CborEpoch.js';
import type * as LockController from './LockController.js';
import type * as LockId from './LockId.js';
import type * as TokenAmount from './TokenAmount.js';
import type * as TokenId from './TokenId.js';
import type * as TokenMetadataUrl from './TokenMetadataUrl.js';
import type { CreatePLTPayload } from './types.js';

/**
 * The Token Module state represents global state information that is maintained by the Token Module,
 * and is returned as part of a `GetTokenInfo` query. It does not include state that is managed by
 * the Token Kernel, such as the token identifier, global supply and governance account. It also
 * does not (typically) include account-specific state, which is returned as part of
 * `GetAccountInfo` instead.
 *
 * The "name" and "metadata" fields are required. Other fields are optional, and can be omitted if
 * the module implementation does not support them. The structure supports additional fields for
 * future extensibility. Non-standard fields (i.e. any fields that are not defined by a standard,
 * and are specific to the module implementation) may be included, and their tags should be
 * prefixed with an underscore ("_") to distinguish them as such.
 */
export type TokenModuleState = {
    /** The name of the token. */
    name?: string;
    /** A URL pointing to the metadata of the token. */
    metadata?: TokenMetadataUrl.Type;
    /** The governance account for the token. */
    governanceAccount?: CborAccountAddress.Type;
    /** Whether the token supports an allow list */
    allowList?: boolean;
    /** Whether the token supports an deny list */
    denyList?: boolean;
    /** Whether the token is mintable */
    mintable?: boolean;
    /** Whether the token is burnable */
    burnable?: boolean;
    /** Whether the token operations are paused or not. */
    paused?: boolean;
    /** Any additional state information depending on the module implementation */
    [key: string]: unknown;
};

/**
 * The amount of a specific token controlled by a particular lock on an account.
 * Introduced in P11.
 */
export type AccountLockAmount = {
    /** The lock controlling an amount on the account. Introduced in P11. */
    lock: LockId.Type;
    /** The amount controlled by the lock. Introduced in P11. */
    amount: TokenAmount.Type;
};

/**
 * The account state represents account-specific information that is maintained by the Token
 * Module, and is returned as part of a `GetAccountInfo` query. It does not include state that is
 * managed by the Token Kernel, such as the token identifier and account balance.
 *
 * All fields are optional, and can be omitted if the module implementation does not support them.
 * The structure supports additional fields for future extensibility. Non-standard fields (i.e. any
 * fields that are not defined by a standard, and are specific to the module implementation) may
 * be included, and their tags should be prefixed with an underscore ("_") to distinguish them
 * as such.
 */
export type TokenModuleAccountState = {
    /** Whether the account is on the allow list. */
    allowList?: boolean;
    /** Whether the account is on the deny list. */
    denyList?: boolean;
    /** Locks that control funds associated with the account. Introduced in protocol version 11. */
    locks?: AccountLockAmount[];
    /** The total unencumbered balance on the account. Introduced in protocol version 11. */
    available?: TokenAmount.Type;
    /** Any additional state information depending on the module implementation. */
    [key: string]: unknown;
};

/**
 * A token amount locked for an account, pairing a token identifier with the
 * amount of that token controlled by the lock.
 */
export type LockedTokenAndAmount = {
    /** The token whose amount is locked. */
    token: TokenId.Type;
    /** The token amount controlled by a lock. */
    amount: TokenAmount.Type;
};

/**
 * The funds held on a single account that are controlled by a lock, consisting
 * of the account address and the list of locked token amounts.
 */
export type LockAccountFund = {
    /** The account whose funds are locked. */
    account: CborAccountAddress.Type;
    /** The token amounts locked for the account. */
    amounts: LockedTokenAndAmount[];
};

/**
 * The data returned by the `getLockInfo` query.
 */
export type LockInfo = LockConfig & {
    /** The lock identifier. */
    lock: LockId.Type;
    /** Per-account funds controlled by the lock. */
    funds: LockAccountFund[];
};

/**
 * Parameters passed to the token module when initializing a new token.
 */
export type TokenInitializationParameters = {
    /** The name of the token. */
    name?: string;
    /** A URL pointing to the metadata of the token. */
    metadata?: TokenMetadataUrl.Type;
    /** The governance account for the token. */
    governanceAccount?: CborAccountAddress.Type;
    /** Whether the token supports an allow list */
    allowList?: boolean;
    /** Whether the token supports an deny list */
    denyList?: boolean;
    /** The initial amount of tokens to be minted */
    initialSupply?: TokenAmount.Type;
    /** Whether the token is mintable */
    mintable?: boolean;
    /** Whether the token is burnable */
    burnable?: boolean;
};

/** Lock configuration used by `lockCreate` meta update operations. */
export type LockConfig = {
    /** Accounts that are permitted to receive funds controlled by the lock. */
    recipients: CborAccountAddress.Type[];
    /** Lock expiry time. */
    expiry: CborEpoch.Type;
    /** Lock controller configuration. */
    controller: LockController.Type;
};

/**
 * Creates a PLT (protocol-level token) payload with the specified initialization parameters.
 *
 * @param payload - The base payload for the PLT, excluding the initialization parameters.
 * @param params - The initialization parameters for the token, such as name, metadata, governance account, and feature flags.
 * @returns The complete PLT payload including the CBOR-encoded initialization parameters.
 */
export function createPltPayload(
    payload: Omit<CreatePLTPayload, 'initializationParameters'>,
    params: TokenInitializationParameters
): CreatePLTPayload {
    if (payload.decimals < 0 || payload.decimals > MAX_U8) {
        throw new Error('Token decimals must be in the range 0..255 (inclusive).');
    }
    return {
        ...payload,
        initializationParameters: Cbor.encode(params),
    };
}
