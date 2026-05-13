import { cborDecode } from '../types/cbor.js';
import type { AccountLockAmount, LockAccountFund, LockInfo } from './cbor-types.js';
import {
    Cbor,
    CborAccountAddress,
    CborEpoch,
    LockConfig,
    LockController,
    LockId,
    MetaUpdateOperation,
    TokenAmount,
    TokenId,
    TokenInitializationParameters,
    TokenMetadataUrl,
    TokenModuleAccountState,
    TokenModuleState,
    TokenOperation,
    UnknownMetaUpdateOperation,
    UnknownTokenOperation,
    decodeMetaUpdateOperations,
    decodeTokenOperations,
} from './index.js';

function decodeTokenModuleState(value: Cbor.Type): TokenModuleState {
    const decoded = cborDecode(value.bytes);
    if (typeof decoded !== 'object' || decoded === null) throw new Error('Invalid CBOR data for TokenModuleState');

    // Validate optional fields
    if ('governanceAccount' in decoded && !CborAccountAddress.instanceOf(decoded.governanceAccount))
        throw new Error('Invalid TokenModuleState: missing or invalid governanceAccount');

    let metadata: TokenMetadataUrl.Type | undefined;
    try {
        if ('metadata' in decoded) metadata = TokenMetadataUrl.fromCBORValue(decoded.metadata);
    } catch {
        throw new Error('Invalid TokenModuleState: invalid metadata');
    }

    if ('name' in decoded && typeof decoded.name !== 'string')
        throw new Error('Invalid TokenModuleState: invalid name');
    if ('allowList' in decoded && typeof decoded.allowList !== 'boolean')
        throw new Error('Invalid TokenModuleState: allowList must be a boolean');
    if ('denyList' in decoded && typeof decoded.denyList !== 'boolean')
        throw Error('Invalid TokenModuleState: denyList must be a boolean');
    if ('mintable' in decoded && typeof decoded.mintable !== 'boolean')
        throw new Error('Invalid TokenModuleState: mintable must be a boolean');
    if ('burnable' in decoded && typeof decoded.burnable !== 'boolean')
        throw new Error('Invalid TokenModuleState: burnable must be a boolean');
    if ('paused' in decoded && typeof decoded.paused !== 'boolean')
        throw new Error('Invalid TokenModuleState: paused must be a boolean');

    return { ...decoded, metadata } as TokenModuleState;
}

function decodeAccountLockAmount(value: unknown): AccountLockAmount {
    if (typeof value !== 'object' || value === null) {
        throw new Error('Invalid TokenModuleAccountState: lock entry must be an object');
    }
    const entry = value as Record<string, unknown>;
    if (!LockId.instanceOf(entry.lock)) {
        throw new Error('Invalid TokenModuleAccountState: lock entry has missing or invalid lock id');
    }
    if (!TokenAmount.instanceOf(entry.amount)) {
        throw new Error('Invalid TokenModuleAccountState: lock entry has missing or invalid amount');
    }

    return { lock: entry.lock, amount: entry.amount };
}

function decodeTokenModuleAccountState(value: Cbor.Type): TokenModuleAccountState {
    const decoded = cborDecode(value.bytes);
    if (typeof decoded !== 'object' || decoded === null) {
        throw new Error('Invalid CBOR data for TokenModuleAccountState');
    }

    // Validate optional fields
    if ('allowList' in decoded && typeof decoded.allowList !== 'boolean') {
        throw new Error('Invalid TokenModuleAccountState: allowList must be a boolean');
    }
    if ('denyList' in decoded && typeof decoded.denyList !== 'boolean') {
        throw Error('Invalid TokenModuleAccountState: denyList must be a boolean');
    }

    const accountState = { ...decoded } as Record<string, unknown>;
    if ('locks' in accountState) {
        if (!Array.isArray(accountState.locks)) {
            throw new Error('Invalid TokenModuleAccountState: locks must be an array');
        }
        accountState.locks = accountState.locks.map(decodeAccountLockAmount);
    }
    if ('available' in accountState) {
        if (!TokenAmount.instanceOf(accountState.available)) {
            throw new Error('Invalid TokenModuleAccountState: available must be a token amount');
        }
    }

    return accountState as TokenModuleAccountState;
}

function decodeLockedTokenAndAmount(value: unknown): { token: TokenId.Type; amount: TokenAmount.Type } {
    if (typeof value !== 'object' || value === null) {
        throw new Error('Invalid LockInfo: amount entry must be an object');
    }
    const entry = value as Record<string, unknown>;
    if (typeof entry.token !== 'string') {
        throw new Error("Invalid LockInfo: amount entry missing or invalid 'token'");
    }
    if (!TokenAmount.instanceOf(entry.amount)) {
        throw new Error("Invalid LockInfo: amount entry missing or invalid 'amount'");
    }

    return {
        token: TokenId.fromString(entry.token),
        amount: entry.amount,
    };
}

function decodeLockAccountFund(value: unknown): LockAccountFund {
    if (typeof value !== 'object' || value === null) {
        throw new Error('Invalid LockInfo: fund entry must be an object');
    }
    const entry = value as Record<string, unknown>;
    if (!CborAccountAddress.instanceOf(entry.account)) {
        throw new Error("Invalid LockInfo: fund entry missing or invalid 'account'");
    }
    if (!Array.isArray(entry.amounts)) {
        throw new Error("Invalid LockInfo: fund entry 'amounts' must be an array");
    }

    return {
        account: entry.account,
        amounts: entry.amounts.map(decodeLockedTokenAndAmount),
    };
}

function decodeLockInfo(value: Cbor.Type): LockInfo {
    const decoded = cborDecode(value.bytes);
    if (typeof decoded !== 'object' || decoded === null || Array.isArray(decoded)) {
        throw new Error('Invalid CBOR data for LockInfo');
    }
    const map = decoded as Record<string, unknown>;
    if (!LockId.instanceOf(map.lock)) {
        throw new Error("Invalid LockInfo: missing or invalid 'lock'");
    }
    if (!Array.isArray(map.funds)) {
        throw new Error("Invalid LockInfo: 'funds' must be an array");
    }
    const config = convertLockConfig(map);

    return {
        lock: map.lock,
        ...config,
        funds: map.funds.map(decodeLockAccountFund),
    };
}

function decodeTokenInitializationParameters(value: Cbor.Type): TokenInitializationParameters {
    const decoded = cborDecode(value.bytes);
    if (typeof decoded !== 'object' || decoded === null) {
        throw new Error('Invalid CBOR data for TokenInitializationParameters');
    }

    // Validate optional fields
    if ('governanceAccount' in decoded && !CborAccountAddress.instanceOf(decoded.governanceAccount))
        throw new Error('Invalid TokenModuleState: invalid governanceAccount');

    let metadata: TokenMetadataUrl.Type | undefined;
    try {
        if ('metadata' in decoded) metadata = TokenMetadataUrl.fromCBORValue(decoded.metadata);
    } catch {
        throw new Error('Invalid TokenModuleState: invalid metadata');
    }

    if ('allowList' in decoded && typeof decoded.allowList !== 'boolean')
        throw new Error('Invalid TokenInitializationParameters: allowList must be a boolean');
    if ('denyList' in decoded && typeof decoded.denyList !== 'boolean')
        throw Error('Invalid TokenInitializationParameters: denyList must be a boolean');
    if ('mintable' in decoded && typeof decoded.mintable !== 'boolean')
        throw new Error('Invalid TokenInitializationParameters: mintable must be a boolean');
    if ('burnable' in decoded && typeof decoded.burnable !== 'boolean')
        throw new Error('Invalid TokenInitializationParameters: burnable must be a boolean');
    if ('paused' in decoded && typeof decoded.paused !== 'boolean')
        throw new Error('Invalid TokenInitializationParameters: paused must be a boolean');

    // Optional initial supply
    if ('initialSupply' in decoded && !TokenAmount.instanceOf(decoded.initialSupply))
        throw new Error(`Invalid TokenInitializationParameters: Expected 'initialSupply' to be of type 'TokenAmount'`);

    return { ...decoded, metadata } as TokenInitializationParameters;
}

function convertLockConfig(value: unknown): LockConfig {
    if (typeof value !== 'object' || value === null) {
        throw new Error('Invalid lock config: expected object');
    }

    const lockConfig = value as Record<string, unknown>;
    if (!Array.isArray(lockConfig.recipients) || !lockConfig.recipients.every(CborAccountAddress.instanceOf)) {
        throw new Error('Invalid lock config: expected recipients array');
    }
    if (!CborEpoch.instanceOf(lockConfig.expiry)) {
        throw new Error('Invalid lock config: expected expiry as CBOR epoch time');
    }

    return {
        recipients: lockConfig.recipients,
        expiry: lockConfig.expiry,
        controller: LockController.fromCBORValue(lockConfig.controller),
    };
}

function decodeLockConfig(value: Cbor.Type): LockConfig {
    const decoded = cborDecode(value.bytes);
    return convertLockConfig(decoded);
}

type DecodeTypeMap = {
    TokenModuleState: TokenModuleState;
    TokenModuleAccountState: TokenModuleAccountState;
    TokenInitializationParameters: TokenInitializationParameters;
    'TokenOperation[]': (TokenOperation | UnknownTokenOperation)[];
    'MetaUpdateOperation[]': (MetaUpdateOperation | UnknownMetaUpdateOperation)[];
    LockConfig: LockConfig;
    LockInfo: LockInfo;
};

/**
 * Decode CBOR encoded data into its original representation.
 * @param {Cbor.Type} cbor - The CBOR encoded data.
 * @param {string} type - type hint for decoding.
 * @returns {unknown} The decoded data.
 */
export function decode<T extends keyof DecodeTypeMap>(cbor: Cbor.Type, type: T): DecodeTypeMap[T];
/**
 * Decode CBOR encoded data into its original representation.
 * @param {Cbor.Type} cbor - The CBOR encoded data.
 * @returns {unknown} The decoded data.
 */
export function decode(cbor: Cbor.Type, type?: undefined): unknown;

/**
 * Decode CBOR encoded data into its original representation.
 * @param {Cbor.Type} cbor - The CBOR encoded data.
 * @param {string | undefined} type - Optional type hint for decoding.
 * @returns {unknown} The decoded data.
 */
export function decode<T extends keyof DecodeTypeMap | undefined>(cbor: Cbor.Type, type: T): unknown {
    switch (type) {
        case 'TokenModuleState':
            return decodeTokenModuleState(cbor);
        case 'TokenModuleAccountState':
            return decodeTokenModuleAccountState(cbor);
        case 'TokenInitializationParameters':
            return decodeTokenInitializationParameters(cbor);
        case 'TokenOperation[]':
            return decodeTokenOperations(cbor);
        case 'MetaUpdateOperation[]':
            return decodeMetaUpdateOperations(cbor);
        case 'LockConfig':
            return decodeLockConfig(cbor);
        case 'LockInfo':
            return decodeLockInfo(cbor);
        default:
            return cborDecode(cbor.bytes);
    }
}
