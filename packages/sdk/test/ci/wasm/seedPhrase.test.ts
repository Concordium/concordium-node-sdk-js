import { seedFromPhrase } from '../../../src/wasm/seedPhrase.js';

// BIP-39 256-bit zero-entropy vector, using the Concordium empty passphrase.
const phrase = 'abandon '.repeat(23) + 'art';

test('derives the empty-passphrase seed for a 24-word English BIP-39 vector', () => {
    expect(seedFromPhrase(phrase)).toBe(
        '408b285c123836004f4b8842c89324c1f01382450c0d439af345ba7fc49acf705489c6fc77dbd4e3dc1dd8cc6bc9f043db8ada1e243c4a0eafb290d399480840'
    );
});

test('rejects an invalid checksum even when every word is in the English list', () => {
    expect(() => seedFromPhrase('abandon '.repeat(23) + 'abandon')).toThrow('Invalid seed phrase.');
});
