import * as bs58check from 'bs58check';
import { Buffer } from 'buffer/';

/**
 * Representation of an account address, which enforces that it:
 * - Hash length exactly 50
 * - Is a valid base58 string
 */
export class AccountAddress {
    address: string;

    decodedAddress: Buffer;

    constructor(address: string) {
        if (address.length !== 50) {
            throw new Error(
                'The provided address ' +
                    address +
                    ' is invalid as its length was not 50'
            );
        }
        try {
            this.decodedAddress = Buffer.from(
                bs58check.decode(address).slice(1)
            );
            this.address = address;
        } catch (error) {
            throw error;
        }
    }

    static fromBytes(bytes: Buffer): AccountAddress {
        return new AccountAddress(
            bs58check.encode(Buffer.concat([Buffer.of(1), bytes]))
        );
    }

    toJSON(): string {
        return this.address;
    }
}
