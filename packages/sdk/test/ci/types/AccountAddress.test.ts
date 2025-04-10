import { AccountAddress } from '../../../src/index.js';

test('Base58 decode-encode results is the same', () => {
    const address = AccountAddress.fromBuffer(new Uint8Array(32));
    const base58 = AccountAddress.toBase58(address);
    const converted = AccountAddress.fromBase58(base58);
    expect(AccountAddress.equals(converted, address)).toBeTruthy();
});

test('Buffer encode-decode results is the same', () => {
    const address = AccountAddress.fromBase58('3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt');
    const buffer = AccountAddress.toBuffer(address);
    const converted = AccountAddress.fromBuffer(buffer);
    expect(AccountAddress.equals(converted, address)).toBeTruthy();
});

test('Account address cbor encoding', () => {
    const address = AccountAddress.fromBuffer(new Uint8Array(32).fill(0x15));
    const encoded = AccountAddress.toCBOR(address);
    const expected = Buffer.from(
        `
        d99d73 a2
          01
            d99d71
              A1
                01 19 0397
          03 5820 1515151515151515151515151515151515151515151515151515151515151515
        `.replace(/\s/g, ''),
        'hex'
    );
    expect(Buffer.from(encoded).toString('hex')).toEqual(expected.toString('hex'));
});

test('Account address cbor decoding with tagged-coininfo', () => {
    // Create a test address with known bytes
    const originalAddress = AccountAddress.fromBuffer(new Uint8Array(32).fill(0x15));

    // Encode to CBOR (with tagged-coininfo)
    const encoded = AccountAddress.toCBOR(originalAddress);

    // Decode from CBOR
    const decoded = AccountAddress.fromCBOR(encoded);

    // Verify the decoded address matches the original
    expect(AccountAddress.equals(decoded, originalAddress)).toBeTruthy();
    expect(AccountAddress.toBuffer(decoded)).toEqual(AccountAddress.toBuffer(originalAddress));
});

test('Account address cbor decoding without tagged-coininfo', () => {
    // Create a test address with known bytes
    const originalAddress = AccountAddress.fromBuffer(new Uint8Array(32).fill(0x15));

    // Create CBOR bytes manually without the tagged-coininfo (only the address bytes)
    const taggedAddressBytes = Buffer.from(
        `
        d99d73 a1
          03 5820 1515151515151515151515151515151515151515151515151515151515151515
        `.replace(/\s/g, ''),
        'hex'
    );

    // Decode from CBOR
    const decoded = AccountAddress.fromCBOR(taggedAddressBytes);

    // Verify the decoded address matches the original
    expect(AccountAddress.equals(decoded, originalAddress)).toBeTruthy();
    expect(AccountAddress.toBuffer(decoded)).toEqual(AccountAddress.toBuffer(originalAddress));
});

