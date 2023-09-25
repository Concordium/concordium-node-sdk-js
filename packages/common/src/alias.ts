import bs58check from 'bs58check';
import { Buffer } from 'buffer/index.js';
import { AccountAddress } from './types/accountAddress.js';

const addressByteLength = 32;
const aliasBytesLength = 3;
const commonBytesLength = addressByteLength - aliasBytesLength;
const maxCount = 16777215; // 2^(8 * 3) - 1

/**
 * Given two accountAddresses, return whether they are aliases.
 * @param address an AccountAddress
 * @param alias another AccountAddress
 * @returns boolean that indicates whether address and alias are aliases
 */
export function isAlias(
    address: AccountAddress,
    alias: AccountAddress
): boolean {
    return (
        0 ===
        address.decodedAddress.compare(
            alias.decodedAddress,
            0,
            commonBytesLength,
            0,
            commonBytesLength
        )
    );
}

/**
 * Given an AccountAddress and a counter, returns an alias for the address.
 * @param address the account address for which the function should get an alias for
 * @param counter number s.t. 0 <= counter < 2^24, decides which alias is returned.
 * If a counter outside this scope is given, then the function will throw an exception
 * @returns an AccountAddress, which is an alias to the given address
 */
export function getAlias(
    address: AccountAddress,
    counter: number
): AccountAddress {
    if (counter < 0 || counter > maxCount) {
        throw new Error(
            `An invalid counter value was given: ${counter}. The value has to satisfy that 0 <= counter < 2^24`
        );
    }
    const commonBytes = address.decodedAddress.slice(0, commonBytesLength);
    const aliasBytes = Buffer.alloc(aliasBytesLength);
    aliasBytes.writeUIntBE(counter, 0, aliasBytesLength);
    const prefixedWithVersion = Buffer.concat([
        Buffer.of(1),
        commonBytes,
        aliasBytes,
    ]);
    return new AccountAddress(bs58check.encode(prefixedWithVersion));
}
