import { Buffer } from 'buffer/';
import { Network } from '../src/types';
import { ConcordiumHdWallet } from '../src/HdWallet';
const TEST_SEED_1 =
    'efa5e27326f8fa0902e647b52449bf335b7b605adc387015ec903f41d95080eb71361cbc7fb78721dcd4f3926a337340aa1406df83332c44c1cdcfe100603860';
import * as ed from '@noble/ed25519';

test('Mainnet signing key', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Mainnet');
    expect(wallet.getAccountSigningKey(55, 7)).toEqual(
        Buffer.from(
            'b44f7320f156971927596f471a2302e5be8d3717a85bedfc5a0e2994615eea7d',
            'hex'
        )
    );
});

test('Mainnet public key', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Mainnet');
    expect(wallet.getAccountPublicKey(341, 9)).toEqual(
        Buffer.from(
            'cc2f4d34bdd0d8e206cf1704516d7ce533f83773492f670144fcbeda33774c5c',
            'hex'
        )
    );
});

test('Mainnet public and signing key match', async () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Mainnet');
    const privateKey = wallet.getAccountSigningKey(0, 0);
    const publicKey = wallet.getAccountPublicKey(0, 0);
    const message = 'abcd1234abcd5678';
    const signature = await ed.sign(message, privateKey.toString('hex'));
    expect(await ed.verify(signature, message, publicKey)).toBeTruthy();
});

test('Mainnet Id Cred Sec', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Mainnet');
    expect(wallet.getIdCredSec(115)).toEqual(
        Buffer.from(
            '27db5d5c1e346670bd2d9b4235a180629c750b067a83942e55fc43303531c1aa',
            'hex'
        )
    );
});

test('Mainnet Prf Key', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Mainnet');
    expect(wallet.getPrfKey(35)).toEqual(
        Buffer.from(
            '1c8a30e2136dcc5e4f8b6fa359e908718d65ea2c2638d8fa6ff72c24d8ed3d68',
            'hex'
        )
    );
});

test('Mainnet blinding randomness', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Mainnet');
    expect(wallet.getSignatureBlindingRandomness(5713)).toEqual(
        Buffer.from(
            '2924d5bc605cc06632e061cec491c1f6b476b3abe51e526f641bcea355cd8bf6',
            'hex'
        )
    );
});

test('Mainnet attribute commitment randomness', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Mainnet');
    expect(wallet.getAttributeCommitmentRandomness(0, 4, 0)).toEqual(
        Buffer.from(
            '462e12bbda5b58ac6e3be920d41adce8b9d0779c13c34913b1f61748f0bbf051',
            'hex'
        )
    );
});

test('Testnet signing key', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Testnet');
    expect(wallet.getAccountSigningKey(55, 7)).toEqual(
        Buffer.from(
            '67a5619aaa5d67b548f83c857c92024f57a9d902f273a62f283f2536fcb203aa',
            'hex'
        )
    );
});

test('Testnet public key', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Testnet');
    expect(wallet.getAccountPublicKey(341, 9)).toEqual(
        Buffer.from(
            'b90e8e5f45c1181e93d5cad6ad7414036538c6c806140cb4bf7957d8ff350004',
            'hex'
        )
    );
});

test('Testnet public and signing key match', async () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Testnet');
    const privateKey = wallet.getAccountSigningKey(0, 0);
    const publicKey = wallet.getAccountPublicKey(0, 0);
    const message = 'abcd1234abcd5678';
    const signature = await ed.sign(message, privateKey.toString('hex'));
    expect(await ed.verify(signature, message, publicKey)).toBeTruthy();
});

test('Testnet Id Cred Sec', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Testnet');
    expect(wallet.getIdCredSec(115)).toEqual(
        Buffer.from(
            '719130a7429a69d1f673a7d051043e63ab237098928ffa2066bdddbc3f93bdb1',
            'hex'
        )
    );
});

test('Testnet Prf Key', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Testnet');
    expect(wallet.getPrfKey(35)).toEqual(
        Buffer.from(
            '623cc233afcdf8063800615d7b52aa535533f0ab054891b4f821e2912018a2fb',
            'hex'
        )
    );
});

test('Testnet blinding randomness', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Testnet');
    expect(wallet.getSignatureBlindingRandomness(5713)).toEqual(
        Buffer.from(
            '2d6093f16ce3cc2d1d7eca2c7c4c7a80449980b10baf0b3366dc70ba2564c7aa',
            'hex'
        )
    );
});

test('Testnet attribute commitment randomness', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Testnet');
    expect(wallet.getAttributeCommitmentRandomness(0, 4, 0)).toEqual(
        Buffer.from(
            '50cb39a9009b36c8ce21fdedab9db520de300a6405e5ffe4786c3c75b09f9ae0',
            'hex'
        )
    );
});
