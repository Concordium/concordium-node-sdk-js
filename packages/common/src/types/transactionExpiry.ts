import { secondsSinceEpoch } from '../util.js';

/**
 * Representation of a transaction expiry date.
 *
 * A transaction expiry has to be in the future. Note that the concordium-node
 * will reject transactions that are too far into the future, currently the default
 * value for this rejection is 2 hours.
 */
export class TransactionExpiry {
    /** expiry is measured as seconds since epoch */
    expiryEpochSeconds: bigint;

    constructor(expiry: Date, allowExpired = false) {
        if (!allowExpired && expiry < new Date()) {
            throw new Error(
                'A transaction expiry is not allowed to be in the past: ' +
                    expiry
            );
        }
        this.expiryEpochSeconds = secondsSinceEpoch(expiry);
    }

    static fromEpochSeconds(
        seconds: bigint,
        allowExpired = false
    ): TransactionExpiry {
        return new TransactionExpiry(
            new Date(Number(seconds) * 1000),
            allowExpired
        );
    }

    toJSON(): number {
        return Number(this.expiryEpochSeconds);
    }
}
