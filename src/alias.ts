import { AccountAddress } from './types/accountAddress';
import * as bs58check from 'bs58check';

const addressByteLength = 32;
const aliasBytesLength = 3;
const commonBytesLength = addressByteLength - aliasBytesLength;
const countAmount = 16777215; // 2^(8 * 3) - 1

/**
 * Given two accountAddresses, return whether they are aliases.
 * @param address an AccountAddress
 * @param alias another AccountAddress
 * @returns boolean that indicates whether address and alias are aliases
 */
export function isAlias(address: AccountAddress, alias: AccountAddress): boolean {
    return 0 === address.decodedAddress.compare(alias.decodedAddress, 0, commonBytesLength, 0, commonBytesLength);
}

/**
 * Given an AccountAddress and a counter, returns an alias for the address.
 * @param address accountAddress, for which the function should an alias for
 * @param counter number s.t. 1 <= counter < 2^24, decides which alias is returned.
 * If the counter is 0, then a copy of the address is returned,
 * and if a counter >= 2^24 is given, then the function will throw an exception
 * @returns an AccountAddress, which is an alias to the given address
 */
export function getAlias(address: AccountAddress, counter: number): AccountAddress {
    if (counter > 16777215) {
        throw new Error('counter exceed maximum number of aliases');
    }
    if (counter === 0) {
        return new AccountAddress(address.address);
    }
    const commonBytes = address.decodedAddress.slice(0,commonBytesLength);
    const aliasBytes = Buffer.alloc(aliasBytesLength);
    const canonicalCounter = address.decodedAddress.readUIntBE(commonBytesLength, aliasBytesLength);
    // If the counter is equal to the address last 3 bytes, we return the alias with alias bytes = 0, as that is unused.
    if (counter === canonicalCounter) {
        aliasBytes.writeUIntBE(0,  0, aliasBytesLength);
    } else {
        aliasBytes.writeUIntBE(counter,  0, aliasBytesLength);
    }
    const prefixedWithVersion = Buffer.concat([Buffer.of(1), commonBytes, aliasBytes]);
    return new AccountAddress(
        bs58check.encode(prefixedWithVersion)
    );
}
