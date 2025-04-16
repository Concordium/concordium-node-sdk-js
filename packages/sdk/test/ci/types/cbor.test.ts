import { CborMemo } from '../../../src/pub/plt.ts';
import { AccountAddress, cborEncode } from '../../../src/pub/types.ts';

it('should encode types and type compositions correctly', () => {
    const account = AccountAddress.fromBuffer(new Uint8Array(32).fill(0x15));
    const accountCbor = cborEncode(account);
    // CBOR byte sequence is as follows:
    // - d99d73 a2: A tagged (40307) item containing a map with 2 key-value pairs
    //  - 01 d99d71 a1: Key 1 => d99d71: A tagged (40305) item containing a map with 1 key-value pair:
    //    - 01 190397: Key 1 => 190397: Uint16(919)
    //  - 03 5820 ...: Key 3 => A byte string of length 32, representing a 32-byte identifier followed by the account address
    const accountCborHex = `
      d99d73 a2
        01 d99d71 a1
          01 190397
        03 5820 1515151515151515151515151515151515151515151515151515151515151515`.replace(/\s/g, '');
    expect(Buffer.from(accountCbor).toString('hex')).toEqual(accountCborHex);

    const memo = CborMemo.fromString('Hello world');
    const memoCbor = cborEncode(memo);
    // - d818: Tag 24 (d8 = "next 1 byte is tag", 18 = 24 decimal)
    // - 4c: Byte string (major type 2) with length 12
    // - 6b: Text string (major type 3) with length 11
    // - 48656c6c6f20776f726c64: UTF-8 encoded string "Hello world"
    const memoCborHex = ` d818 4c 6b 48656c6c6f20776f726c64`.replace(/\s/g, '');
    expect(Buffer.from(memoCbor).toString('hex')).toEqual(memoCborHex);

    const composed = {
        account,
        memo,
    };
    const composedCbor = cborEncode(composed);
    // - a2: A map with 2 key-value pairs
    //  - 646d656d6f ...: Key "memo" (in UTF-8) followed by the memo CBOR
    //  - 676163636f756e74 ...: Key "account" (in UTF-8) followed by the account CBOR
    const composedCborHex = `
      a2
        646d656d6f ${memoCborHex}
        676163636f756e74 ${accountCborHex}
    `.replace(/\s/g, '');
    expect(Buffer.from(composedCbor).toString('hex')).toEqual(composedCborHex);
});

it('should lexicographically sort object keys when encoding', () => {
    const account = AccountAddress.fromBuffer(new Uint8Array(32).fill(0x15));
    // CBOR byte sequence is as follows:
    // - d99d73 a2: A tagged (40307) item containing a map with 2 key-value pairs
    //  - 01 d99d71 a1: Key 1 => d99d71: A tagged (40305) item containing a map with 1 key-value pair:
    //    - 01 190397: Key 1 => 190397: Uint16(919)
    //  - 03 5820 ...: Key 3 => A byte string of length 32, representing a 32-byte identifier followed by the account address
    const accountCborHex = `
      d99d73 a2
        01 d99d71 a1
          01 190397
        03 5820 1515151515151515151515151515151515151515151515151515151515151515`.replace(/\s/g, '');

    const memo = CborMemo.fromString('Hello world');
    // - d818: Tag 24 (d8 = "next 1 byte is tag", 18 = 24 decimal)
    // - 4c: Byte string (major type 2) with length 12
    // - 6b: Text string (major type 3) with length 11
    // - 48656c6c6f20776f726c64: UTF-8 encoded string "Hello world"
    const memoCborHex = ` d818 4c 6b 48656c6c6f20776f726c64`.replace(/\s/g, '');

    // Lexicographical sorting = sort by byte length and optionally compare each byte,
    // i.e. "memo" < "account"
    const sorted = {
        memo,
        account,
    };
    const unsorted = {
        account,
        memo,
    };

    // - a2: A map with 2 key-value pairs
    //  - 676163636f756e74 ...: Key "account" (in UTF-8) followed by the account CBOR
    //  - 646d656d6f ...: Key "memo" (in UTF-8) followed by the memo CBOR
    const sortedCborHex = `
      a2
        646d656d6f ${memoCborHex}
        676163636f756e74 ${accountCborHex}
    `.replace(/\s/g, '');

    const sortedCbor = cborEncode(sorted);
    expect(Buffer.from(sortedCbor).toString('hex')).toEqual(sortedCborHex);

    const unsortedCbor = cborEncode(unsorted);
    expect(Buffer.from(unsortedCbor).toString('hex')).toEqual(sortedCborHex);

    expect(sortedCbor).toEqual(unsortedCbor);
});

it('should remove undefined fields from plain objects, but not classes', () => {
    const obj = {
        a: 1,
        b: undefined,
    };
    expect(() => cborEncode(obj)).not.toThrow();

    class Test {
        constructor(
            public a: number = 1,
            public b: undefined = undefined
        ) {}
    }
    expect(() => cborEncode(new Test())).toThrow();
});
