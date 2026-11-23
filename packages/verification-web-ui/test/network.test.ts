// Run with: npx tsx --test test/network.test.ts
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
    parseStoredNetworkConfig,
    resolveNetworkFrom,
    serializeNetworkConfig,
    validateNetworkConfig,
    walletDeepLink,
} from '../src/utils/network';

const CUSTOM_CHAIN_ID = 'ccd:0123456789abcdef0123456789abcdef' as const;
const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14)';
const DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)';

describe('resolveNetworkFrom', () => {
    test('named networks keep their existing chain IDs and wallet schemes', () => {
        assert.deepEqual(resolveNetworkFrom('testnet', null), {
            kind: 'testnet',
            chainId: 'ccd:4221332d34e1694168c2a0c0b3fd0f27',
            walletDeepLinks: { ios: 'cryptoxtestnet', android: 'cryptox-wc' },
        });
        assert.deepEqual(resolveNetworkFrom('mainnet', null), {
            kind: 'mainnet',
            chainId: 'ccd:9dd9ca4d19e9393877d2c44b70f89acb',
            walletDeepLinks: { ios: 'cryptox', android: 'cryptox-wc' },
        });
    });

    test('env chain IDs override the named defaults', () => {
        assert.equal(
            resolveNetworkFrom('mainnet', null, { VITE_CHAIN_ID_MAINNET: 'ccd:mainnet' }).chainId,
            'ccd:mainnet'
        );
        assert.equal(
            resolveNetworkFrom('testnet', null, { VITE_CHAIN_ID_MAINNET: 'ccd:mainnet' }).chainId,
            'ccd:4221332d34e1694168c2a0c0b3fd0f27'
        );
    });

    test('defaults to testnet', () => {
        assert.equal(resolveNetworkFrom(undefined, null).kind, 'testnet');
        assert.equal(resolveNetworkFrom(undefined, 'garbage').kind, 'testnet');
    });

    test('legacy plain strings stored by earlier versions still resolve', () => {
        assert.equal(resolveNetworkFrom(undefined, 'mainnet').kind, 'mainnet');
        assert.equal(resolveNetworkFrom(undefined, 'testnet').kind, 'testnet');
    });

    test('configured value wins over the stored value', () => {
        assert.equal(resolveNetworkFrom('mainnet', 'testnet').kind, 'mainnet');
    });

    test('custom networks', () => {
        const custom = { chainId: CUSTOM_CHAIN_ID, walletDeepLinks: { ios: 'mywallet' } };
        assert.deepEqual(resolveNetworkFrom(custom, null), {
            kind: 'custom',
            chainId: CUSTOM_CHAIN_ID,
            walletDeepLinks: { ios: 'mywallet' },
        });
        // Round trips through storage.
        const stored = serializeNetworkConfig(custom);
        assert.deepEqual(parseStoredNetworkConfig(stored), custom);
        assert.equal(resolveNetworkFrom(undefined, stored).chainId, CUSTOM_CHAIN_ID);
    });

    test('named networks are stored as plain strings, as before', () => {
        assert.equal(serializeNetworkConfig('testnet'), 'testnet');
        assert.equal(serializeNetworkConfig('mainnet'), 'mainnet');
    });
});

describe('validateNetworkConfig', () => {
    for (const bad of [
        'stagenet',
        { chainId: 'ccd:0123' },
        { chainId: 'ccd:0123456789ABCDEF0123456789ABCDEF' },
        { chainId: 'eip155:1' },
        { chainId: CUSTOM_CHAIN_ID, walletDeepLinks: { ios: 1 } },
        null,
    ]) {
        test(`rejects ${JSON.stringify(bad)}`, () => {
            assert.throws(() => validateNetworkConfig(bad));
        });
    }
});

describe('walletDeepLink', () => {
    const uri = 'wc:abc@2?relay-protocol=irn';

    test('named networks', () => {
        assert.equal(
            walletDeepLink(resolveNetworkFrom('mainnet', null), uri, IOS),
            `cryptox://wc?uri=${encodeURIComponent(uri)}&redirect=googlechrome://`
        );
        assert.equal(
            walletDeepLink(resolveNetworkFrom('testnet', null), uri, ANDROID),
            `cryptox-wc://wc?uri=${encodeURIComponent(uri)}&go_back=true`
        );
        assert.equal(walletDeepLink(resolveNetworkFrom('testnet', null), uri, DESKTOP), null);
    });

    test('custom networks without a scheme fall back (null)', () => {
        const network = resolveNetworkFrom({ chainId: CUSTOM_CHAIN_ID, walletDeepLinks: { ios: 'mywallet' } }, null);
        assert.equal(
            walletDeepLink(network, uri, IOS),
            `mywallet://wc?uri=${encodeURIComponent(uri)}&redirect=googlechrome://`
        );
        assert.equal(walletDeepLink(network, uri, ANDROID), null);
        assert.equal(walletDeepLink(resolveNetworkFrom({ chainId: CUSTOM_CHAIN_ID }, null), uri, IOS), null);
    });
});
