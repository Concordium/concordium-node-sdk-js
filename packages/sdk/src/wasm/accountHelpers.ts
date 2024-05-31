import * as wasm from '@concordium/rust-bindings/wallet';

import { GenerateBakerKeysOutput } from '../types.js';
import * as AccountAddress from '../types/AccountAddress.js';

/**
 * Generates random baker keys for the specified account, that can be used with the configureBaker transaction
 * @param account the address of the account that the keys should be added to.
 * @returns an object containing the public baker keys, their associated proofs and their associated private keys.
 */
export function generateBakerKeys(account: AccountAddress.Type): GenerateBakerKeysOutput {
    const rawKeys = wasm.generateBakerKeys(AccountAddress.toBase58(account));
    try {
        return JSON.parse(rawKeys);
    } catch (e) {
        throw new Error(rawKeys);
    }
}
