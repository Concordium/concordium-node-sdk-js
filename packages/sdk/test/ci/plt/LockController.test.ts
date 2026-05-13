import { Buffer } from 'buffer/index.js';

import { CborAccountAddress, LockController, TokenId } from '../../../src/pub/plt.ts';
import { AccountAddress } from '../../../src/pub/types.ts';

describe('PLT LockController', () => {
    const account = CborAccountAddress.fromAccountAddress(AccountAddress.fromBuffer(new Uint8Array(32).fill(0x15)));
    const token = TokenId.fromString('tToken');

    it('represents simpleV0 as a variant and encodes its fields', () => {
        const controller = LockController.simpleV0(
            [
                {
                    account,
                    roles: [LockController.SimpleV0Capability.Fund, LockController.SimpleV0Capability.Send],
                },
            ],
            [token],
            { keepAlive: true, memo: new Uint8Array([1, 2]) }
        );

        expect(LockController.Variant.SimpleV0 in controller).toBe(true);
        expect(Buffer.from(LockController.toCBOR(controller)).toString('hex')).toBe(
            'a16873696d706c655630a4646d656d6f420102666772616e747381a265726f6c6573826466756e646473656e64676163636f756e74d99d73a201d99d71a101190397035820151515151515151515151515151515151515151515151515151515151515151566746f6b656e73816674546f6b656e696b656570416c697665f5'
        );
        expect(LockController.fromCBOR(LockController.toCBOR(controller))).toEqual(controller);
    });
});
