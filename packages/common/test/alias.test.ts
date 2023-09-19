import { AccountAddress } from '../src/types/accountAddress';
import bs58check from 'bs58check';
import { getAlias, isAlias } from '../src/alias';
import { Buffer } from 'buffer/index.js';

test('isAlias is reflexive', () => {
    const address = new AccountAddress(
        bs58check.encode(
            Buffer.from(
                '01e718721402249e81f8fedcba6027f1c9bcb4445e9433b7905d579d83ec000002',
                'hex'
            )
        )
    );
    expect(isAlias(address, address)).toBeTruthy();
});

test('isAlias: Addresses with first 29 bytes in common are aliases', () => {
    const address = new AccountAddress(
        bs58check.encode(
            Buffer.from(
                '01e718721402249e81f8fedcba6027f1c9bcb4445e9433b7905d579d83ec000002',
                'hex'
            )
        )
    );
    const alias = new AccountAddress(
        bs58check.encode(
            Buffer.from(
                '01e718721402249e81f8fedcba6027f1c9bcb4445e9433b7905d579d83ececb467',
                'hex'
            )
        )
    );
    expect(isAlias(address, alias)).toBeTruthy();
});

test('isAlias: Addresses with differences in the 5th byte are not aliases', () => {
    const address = new AccountAddress(
        bs58check.encode(
            Buffer.from(
                '01e718721412249e81f8fedcba6027f1c9bcb4445e9433b7905d579d83ec000002',
                'hex'
            )
        )
    );
    const alias = new AccountAddress(
        bs58check.encode(
            Buffer.from(
                '01e718721402249e81f8fedcba6027f1c9bcb4445e9433b7905d579d83ec000002',
                'hex'
            )
        )
    );
    expect(isAlias(address, alias)).toBeFalsy();
});

test('isAlias: Addresses with differences in the 29th byte are not aliases', () => {
    const address = new AccountAddress(
        bs58check.encode(
            Buffer.from(
                '01e718721402249e81f8fedcba6027f1c9bcb4445e9433b7905d579d83ececb467',
                'hex'
            )
        )
    );
    const alias = new AccountAddress(
        bs58check.encode(
            Buffer.from(
                '01e718721402249e81f8fedcba6027f1c9bcb4445e9433b7905d579d83e1ecb467',
                'hex'
            )
        )
    );
    expect(isAlias(address, alias)).toBeFalsy();
});

test('getAlias: getAlias returns an alias', () => {
    const address = new AccountAddress(
        '4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf'
    );
    const alias = getAlias(address, 1);
    expect(isAlias(address, alias)).toBeTruthy();
});

test('getAlias: changing counter makes getAlias return different aliases', () => {
    const address = new AccountAddress(
        '4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf'
    );
    const alias = getAlias(address, 1);
    const otherAlias = getAlias(address, 100);
    expect(otherAlias.address).not.toBe(alias.address);
    expect(isAlias(otherAlias, alias)).toBeTruthy();
});

test('getAlias: last 3 bytes of alias matches counter', () => {
    const address = new AccountAddress(
        '4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf'
    );
    let alias = getAlias(address, 0xaaaaaa);
    expect(alias.decodedAddress.slice(29, 32).toString('hex')).toBe('aaaaaa');
    alias = getAlias(address, 0x152637);
    expect(alias.decodedAddress.slice(29, 32).toString('hex')).toBe('152637');
    alias = getAlias(address, 0x000000);
    expect(alias.decodedAddress.slice(29, 32).toString('hex')).toBe('000000');
    alias = getAlias(address, 0xffffff);
    expect(alias.decodedAddress.slice(29, 32).toString('hex')).toBe('ffffff');
});

test('getAlias: using counter = "last 3 bytes of address" returns the address', () => {
    const address = new AccountAddress(
        '4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf'
    );
    const alsoAddress = getAlias(address, 0xecb198);
    expect(alsoAddress.address).toBe(address.address);
});

test('getAlias: accepts counter = 0', () => {
    const address = new AccountAddress(
        '4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf'
    );
    const alias = getAlias(address, 0);
    expect(isAlias(address, alias)).toBeTruthy();
});

test('getAlias: does not accept counter = -1', () => {
    const address = new AccountAddress(
        '4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf'
    );
    expect(() => getAlias(address, -1)).toThrowError();
});

test('getAlias: accepts counter === 2^24 - 1', () => {
    const address = new AccountAddress(
        '4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf'
    );
    const alias = getAlias(address, 0xffffff);
    expect(isAlias(address, alias)).toBeTruthy();
});

test('getAlias: does not accept counter === 2^24', () => {
    const address = new AccountAddress(
        '4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf'
    );
    expect(() => getAlias(address, 0x01000000)).toThrowError();
});
