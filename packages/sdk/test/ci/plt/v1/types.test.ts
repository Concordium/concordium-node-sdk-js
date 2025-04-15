import { encode } from 'cbor2';

import { TokenOperationType } from '../../../../src/plt/v1/types.ts';
import { Cbor, TokenAmount, V1 } from '../../../../src/pub/plt.js';
import { AccountAddress } from '../../../../src/pub/types.js';

describe('PLT v1 transactions', () => {
    // FIXME: if I remove the first test, the 2nd fails??
    it('serializes', () => {
        const account = AccountAddress.fromBuffer(new Uint8Array(32).fill(0x15));
        const cbor = encode(account);

        console.log(Buffer.from(cbor).toString('hex'));
    });

    it('serializes transfers correctly', () => {
        AccountAddress.registerCBOREncoder();

        const transfer: V1.TokenTransferOperation = {
            [TokenOperationType.Transfer]: {
                amount: TokenAmount.create(123n, 4),
                recipient: AccountAddress.fromBuffer(new Uint8Array(32).fill(0x15)),
            },
        };

        const cbor = V1.createTokenHolderPayload(transfer);

        // This is a CBOR encoded byte sequence.
        // It represents a nested structure with the following breakdown:
        // - 81: An array of 1 item.
        // - a1: A map with 1 key-value pair.
        //   - 687472616e73666572: Key "transfer" (in UTF-8).
        //   - a2: A map with 2 key-value pairs:
        //     - 66616d6f756e74 Key "amount" ( in UTF-8).
        //     - c4: A decfrac containing:
        //       - 23: Integer(-4).
        //       - 187b: Uint8(123).
        //     - 69726563697069656e74: Key "recipient" (in UTF-8).
        //     - d99d73: A tagged (40307) item with a map (a2) containing:
        //     - a2: A map with 2 key-value pairs
        //       - 01: Key 1.
        //       - d99d71: A tagged (40305) item containing:
        //       - a1: A map with 1 key-value pair
        //         - 01: Key 1.
        //         - 190397: Uint16(919).
        //         - 03: Key 3.
        //         - 5820: A byte string of length 32, representing a 32-byte identifier.
        //         - 151515151515151515151515151515151515151515151515151515151515151: The account address
        const expected = Buffer.from(
            `
            81
              a1
                687472616e73666572 a2
                  66616d6f756e74 c4
                    82
                      23
                        187b
                  69726563697069656e74 d99d73 a2
                    01 d99d71
                      a1
                        01 190397
                        03
                          5820 1515151515151515151515151515151515151515151515151515151515151515
            `.replace(/\s/g, ''),
            'hex'
        );

        expect(cbor.toString()).toEqual(expected.toString('hex'));

        const decoded = Cbor.decode(cbor);
        expect(decoded).toEqual([transfer]);
    });
});
