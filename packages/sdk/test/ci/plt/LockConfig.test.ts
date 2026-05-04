import { Buffer } from 'buffer/index.js';

import { Cbor, CborAccountAddress, CborEpoch, LockController, TokenId } from '../../../src/pub/plt.ts';
import type { LockConfig } from '../../../src/pub/plt.ts';
import { AccountAddress } from '../../../src/pub/types.ts';

describe('PLT LockConfig', () => {
    const account = CborAccountAddress.fromAccountAddress(AccountAddress.fromBuffer(new Uint8Array(32).fill(0x15)));
    const token = TokenId.fromString('tToken');

    const config: LockConfig = {
        recipients: [account],
        expiry: CborEpoch.fromEpochSeconds(10n),
        controller: LockController.simpleV0(
            [
                {
                    account,
                    roles: [LockController.SimpleV0Capability.Fund, LockController.SimpleV0Capability.Send],
                },
            ],
            [token]
        ),
    };

    it('encodes recipients, expiry, and controller', () => {
        expect(Buffer.from(Cbor.encode(config).bytes).toString('hex')).toBe(
            'a366657870697279c10a6a636f6e74726f6c6c6572a16873696d706c655630a2666772616e747381a265726f6c6573826466756e646473656e64676163636f756e74d99d73a201d99d71a101190397035820151515151515151515151515151515151515151515151515151515151515151566746f6b656e73816674546f6b656e6a726563697069656e747381d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515'
        );
        const decoded = Cbor.decode(Cbor.encode(config), 'LockConfig');
        expect(decoded).toMatchObject({
            recipients: config.recipients,
            expiry: config.expiry,
            controller: {
                [LockController.Variant.SimpleV0]: {
                    grants: config.controller[LockController.Variant.SimpleV0].grants,
                    tokens: config.controller[LockController.Variant.SimpleV0].tokens,
                },
            },
        });
    });

    it('throws if recipients is not an array of CBOR account addresses', () => {
        const invalid = Cbor.encode({
            ...config,
            recipients: ['not-an-account'],
        });

        expect(() => Cbor.decode(invalid, 'LockConfig')).toThrow(/expected recipients array/);
    });

    it('throws if expiry is not a CBOR epoch time', () => {
        const invalid = Cbor.encode({
            ...config,
            expiry: 10,
        });

        expect(() => Cbor.decode(invalid, 'LockConfig')).toThrow(/expected expiry as CBOR epoch time/);
    });
});
