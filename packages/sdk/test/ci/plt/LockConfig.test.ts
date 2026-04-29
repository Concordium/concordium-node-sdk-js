import { Buffer } from 'buffer/index.js';

import { CborAccountAddress, LockConfig, LockController, TokenId } from '../../../src/pub/plt.ts';
import { AccountAddress, TransactionExpiry } from '../../../src/pub/types.ts';

describe('PLT LockConfig', () => {
    const account = CborAccountAddress.fromAccountAddress(AccountAddress.fromBuffer(new Uint8Array(32).fill(0x15)));
    const token = TokenId.fromString('tToken');

    it('encodes recipients, expiry, and controller', () => {
        const config = LockConfig.create(
            [account],
            TransactionExpiry.fromEpochSeconds(10n),
            LockController.simpleV0(
                [
                    {
                        account,
                        roles: [LockController.SimpleV0Capability.Fund, LockController.SimpleV0Capability.Send],
                    },
                ],
                [token]
            )
        );

        expect(Buffer.from(LockConfig.toCBOR(config)).toString('hex')).toBe(
            'a366657870697279c10a6a636f6e74726f6c6c6572a16873696d706c655630a2666772616e747381a265726f6c6573826466756e646473656e64676163636f756e74d99d73a201d99d71a101190397035820151515151515151515151515151515151515151515151515151515151515151566746f6b656e73816674546f6b656e6a726563697069656e747381d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515'
        );
        expect(LockConfig.fromCBOR(LockConfig.toCBOR(config))).toEqual(config);
    });
});
