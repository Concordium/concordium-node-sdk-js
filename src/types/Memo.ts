import { Buffer } from 'buffer/';

/**
 * Representation of a transaction memo, which enforces that it:
 * - byte length is <= 256
 */
export class Memo {
    memo: Buffer;

    constructor(memo: Buffer) {
        if (memo.length > 256) {
            throw new Error(
                'A transaction memo\'s size cannot exceed 256 bytes'
            );
        }
        this.memo = memo;
    }
}
