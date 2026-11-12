import * as Energy from './types/Energy.js';

export const DEFAULT_INVOKE_ENERGY: Energy.Type = Energy.create(1000000n);
export const MAX_U64 = 18446744073709551615n; // 2n ** 64n - 1n
export const MAX_U8 = 255; // 2 ** 8 - 1

/** Hash of the genesis block of Concordium testnet. */
export const TESTNET_GENESIS_HASH = '4221332d34e1694168c2a0c0b3fd0f273809612cb13d000d5c2e00e85f50f796';
/** Hash of the genesis block of Concordium mainnet. */
export const MAINNET_GENESIS_HASH = '9dd9ca4d19e9393877d2c44b70f89acbfc0883c2243e5eeaecc0d1cd0503f478';
