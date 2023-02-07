import * as wasm from '@concordium/rust-bindings';
import { BakerKeysWithProofs } from '.';
import { AccountAddress } from './types/accountAddress';

export function generateBakerKeys(
    account: AccountAddress
): BakerKeysWithProofs {
    const rawKeys = wasm.generateBakerKeys(account.address);
    try {
        return JSON.parse(rawKeys);
    } catch (e) {
        throw new Error(rawKeys);
    }
}
