import { AccountAddress } from '../../../src/pub/types.js';

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
