import { generateBakerKeys as generateBakerKeysWasm } from '@concordium/rust-bindings/wallet';
import { GenerateBakerKeysOutput } from '../types';
import { AccountAddress } from '../types/accountAddress';

/**
 * Generates random baker keys for the specified account, that can be used with the configureBaker transaction
 * @param account the address of the account that the keys should be added to.
 * @returns an object containing the public baker keys, their associated proofs and their associated private keys.
 */
export function generateBakerKeys(
    account: AccountAddress
): GenerateBakerKeysOutput {
    const rawKeys = generateBakerKeysWasm(account.address);
    try {
        return JSON.parse(rawKeys);
    } catch (e) {
        throw new Error(rawKeys);
    }
}
