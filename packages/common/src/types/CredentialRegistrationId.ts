import { isHex } from '../util.js';

/**
 * Representation of a credential registration id, which enforces that it:
 * - Is a valid Hex string
 * - Has length exactly 96, because a credId is 48 bytes.
 * - Checks the first bit is 1, which indicates that the value represents a compressed BLS12-381 curve point.
 */
export class CredentialRegistrationId {
    credId: string;

    constructor(credId: string) {
        if (credId.length !== 96) {
            throw new Error(
                'The provided credId ' +
                    credId +
                    ' is invalid as its length was not 96'
            );
        }
        if (!isHex(credId)) {
            throw new Error(
                'The provided credId ' +
                    credId +
                    ' does not represent a hexidecimal value'
            );
        }
        // Check that the first bit is 1
        if ((parseInt(credId.substring(0, 2), 16) & 0b10000000) === 0) {
            throw new Error(
                'The provided credId ' +
                    credId +
                    'does not represent a compressed BLS12-381 point'
            );
        }

        this.credId = credId;
    }

    toJSON(): string {
        return this.credId;
    }
}
