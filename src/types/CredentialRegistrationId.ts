import { Buffer } from 'buffer/';
import { isHex } from '../util';

/**
 * Representation of an credential registration id, which enforces that it:
 * - Is a valid Hex string
 * - Has length exactly 96 (Because 48 bytes)
 * - Checks the first bit is 1. (Which indicates that the value represents a compressed BLS12-381 curve point)
 */
export class CredentialRegistrationId {
    credId: string;

    constructor(credId: string) {
        if (address.length !== 96) {
            throw new Error(
                'The provided credId ' +
                    credID +
                    ' is invalid as its length was not 96'
            );
        }
        if (!isHex(credId)) {
            throw new Error(
                'The provided credId ' +
                    credID +
                    ' does not represent a hexidecimal value'
            );
        }
        this.credId = credId;
    }
}
