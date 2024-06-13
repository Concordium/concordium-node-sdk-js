import * as AccountAddress from '../../src/types/AccountAddress.js';

test('isAlias is reflexive', () => {
    const address = AccountAddress.fromBuffer(
        Buffer.from('e718721402249e81f8fedcba6027f1c9bcb4445e9433b7905d579d83ec000002', 'hex')
    );
    expect(AccountAddress.isAlias(address, address)).toBeTruthy();
});

test('isAlias: Addresses with first 29 bytes in common are aliases', () => {
    const address = AccountAddress.fromBuffer(
        Buffer.from('e718721402249e81f8fedcba6027f1c9bcb4445e9433b7905d579d83ec000002', 'hex')
    );
    const alias = AccountAddress.fromBuffer(
        Buffer.from('e718721402249e81f8fedcba6027f1c9bcb4445e9433b7905d579d83ececb467', 'hex')
    );
    expect(AccountAddress.isAlias(address, alias)).toBeTruthy();
});

test('isAlias: Addresses with differences in the 5th byte are not aliases', () => {
    const address = AccountAddress.fromBuffer(
        Buffer.from('e718721412249e81f8fedcba6027f1c9bcb4445e9433b7905d579d83ec000002', 'hex')
    );
    const alias = AccountAddress.fromBuffer(
        Buffer.from('e718721402249e81f8fedcba6027f1c9bcb4445e9433b7905d579d83ec000002', 'hex')
    );
    expect(AccountAddress.isAlias(address, alias)).toBeFalsy();
});

test('isAlias: Addresses with differences in the 29th byte are not aliases', () => {
    const address = AccountAddress.fromBuffer(
        Buffer.from('e718721402249e81f8fedcba6027f1c9bcb4445e9433b7905d579d83ececb467', 'hex')
    );
    const alias = AccountAddress.fromBuffer(
        Buffer.from('e718721402249e81f8fedcba6027f1c9bcb4445e9433b7905d579d83e1ecb467', 'hex')
    );
    expect(AccountAddress.isAlias(address, alias)).toBeFalsy();
});

test('getAlias: getAlias returns an alias', () => {
    const address = AccountAddress.fromBase58('4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf');
    const alias = AccountAddress.getAlias(address, 1);
    expect(AccountAddress.isAlias(address, alias)).toBeTruthy();
});

test('getAlias: changing counter makes getAlias return different aliases', () => {
    const address = AccountAddress.fromBase58('4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf');
    const alias = AccountAddress.getAlias(address, 1);
    const otherAlias = AccountAddress.getAlias(address, 100);
    expect(otherAlias.address).not.toBe(alias.address);
    expect(AccountAddress.isAlias(otherAlias, alias)).toBeTruthy();
});

test('getAlias: last 3 bytes of alias matches counter', () => {
    const address = AccountAddress.fromBase58('4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf');
    let alias = AccountAddress.getAlias(address, 0xaaaaaa);
    expect(Buffer.from(alias.decodedAddress.slice(29, 32)).toString('hex')).toBe('aaaaaa');
    alias = AccountAddress.getAlias(address, 0x152637);
    expect(Buffer.from(alias.decodedAddress.slice(29, 32)).toString('hex')).toBe('152637');
    alias = AccountAddress.getAlias(address, 0x000000);
    expect(Buffer.from(alias.decodedAddress.slice(29, 32)).toString('hex')).toBe('000000');
    alias = AccountAddress.getAlias(address, 0xffffff);
    expect(Buffer.from(alias.decodedAddress.slice(29, 32)).toString('hex')).toBe('ffffff');
});

test('getAlias: using counter = "last 3 bytes of address" returns the address', () => {
    const address = AccountAddress.fromBase58('4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf');
    const alsoAddress = AccountAddress.getAlias(address, 0xecb198);
    expect(alsoAddress.address).toBe(address.address);
});

test('getAlias: accepts counter = 0', () => {
    const address = AccountAddress.fromBase58('4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf');
    const alias = AccountAddress.getAlias(address, 0);
    expect(AccountAddress.isAlias(address, alias)).toBeTruthy();
});

test('getAlias: does not accept counter = -1', () => {
    const address = AccountAddress.fromBase58('4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf');
    expect(() => AccountAddress.getAlias(address, -1)).toThrowError();
});

test('getAlias: accepts counter === 2^24 - 1', () => {
    const address = AccountAddress.fromBase58('4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf');
    const alias = AccountAddress.getAlias(address, 0xffffff);
    expect(AccountAddress.isAlias(address, alias)).toBeTruthy();
});

test('getAlias: does not accept counter === 2^24', () => {
    const address = AccountAddress.fromBase58('4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf');
    expect(() => AccountAddress.getAlias(address, 0x01000000)).toThrowError();
});
