import { Buffer } from 'buffer/';
import { ConcordiumHdWallet } from '../src/HdWallet';
export const TEST_SEED_1 =
    'efa5e27326f8fa0902e647b52449bf335b7b605adc387015ec903f41d95080eb71361cbc7fb78721dcd4f3926a337340aa1406df83332c44c1cdcfe100603860';
import * as ed from '@noble/ed25519';

test('Mainnet signing key', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Mainnet');
    expect(wallet.getAccountSigningKey(0, 55, 7)).toEqual(
        Buffer.from(
            'e4d1693c86eb9438feb9cbc3d561fbd9299e3a8b3a676eb2483b135f8dbf6eb1',
            'hex'
        )
    );
});

test('Mainnet public key', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Mainnet');
    expect(wallet.getAccountPublicKey(1, 341, 9)).toEqual(
        Buffer.from(
            'd54aab7218fc683cbd4d822f7c2b4e7406c41ae08913012fab0fa992fa008e98',
            'hex'
        )
    );
});

test('Mainnet public and signing key match', async () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Mainnet');
    const privateKey = wallet.getAccountSigningKey(0, 0, 0);
    const publicKey = wallet.getAccountPublicKey(0, 0, 0);
    const message = 'abcd1234abcd5678';
    const signature = await ed.sign(message, privateKey.toString('hex'));
    expect(await ed.verify(signature, message, publicKey)).toBeTruthy();
});

test('Mainnet Id Cred Sec', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Mainnet');
    expect(wallet.getIdCredSec(2, 115)).toEqual(
        Buffer.from(
            '33b9d19b2496f59ed853eb93b9d374482d2e03dd0a12e7807929d6ee54781bb1',
            'hex'
        )
    );
});

test('Mainnet Prf Key', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Mainnet');
    expect(wallet.getPrfKey(3, 35)).toEqual(
        Buffer.from(
            '4409e2e4acffeae641456b5f7406ecf3e1e8bd3472e2df67a9f1e8574f211bc5',
            'hex'
        )
    );
});

test('Mainnet CredId', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Mainnet');
    expect(
        wallet.getCredentialId(10, 50, 5, {
            onChainCommitmentKey:
                'b14cbfe44a02c6b1f78711176d5f437295367aa4f2a8c2551ee10d25a03adc69d61a332a058971919dad7312e1fc94c5a8d45e64b6f917c540eee16c970c3d4b7f3caf48a7746284878e2ace21c82ea44bf84609834625be1f309988ac523fac',
        })
    ).toEqual(
        Buffer.from(
            '8a3a87f3f38a7a507d1e85dc02a92b8bcaa859f5cf56accb3c1bc7c40e1789b4933875a38dd4c0646ca3e940a02c42d8',
            'hex'
        )
    );
});

test('Mainnet blinding randomness', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Mainnet');
    expect(wallet.getSignatureBlindingRandomness(4, 5713)).toEqual(
        Buffer.from(
            '1e3633af2b1dbe5600becfea0324bae1f4fa29f90bdf419f6fba1ff520cb3167',
            'hex'
        )
    );
});

test('Mainnet attribute commitment randomness', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Mainnet');
    expect(wallet.getAttributeCommitmentRandomness(5, 0, 4, 0)).toEqual(
        Buffer.from(
            '6ef6ba6490fa37cd517d2b89a12b77edf756f89df5e6f5597440630cd4580b8f',
            'hex'
        )
    );
});

test('Testnet signing key', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Testnet');
    expect(wallet.getAccountSigningKey(0, 55, 7)).toEqual(
        Buffer.from(
            'aff97882c6df085e91ae2695a32d39dccb8f4b8d68d2f0db9637c3a95f845e3c',
            'hex'
        )
    );
});

test('Testnet public key', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Testnet');
    expect(wallet.getAccountPublicKey(1, 341, 9)).toEqual(
        Buffer.from(
            'ef6fd561ca0291a57cdfee896245db9803a86da74c9a6c1bf0252b18f8033003',
            'hex'
        )
    );
});

test('Testnet public and signing key match', async () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Testnet');
    const privateKey = wallet.getAccountSigningKey(0, 0, 0);
    const publicKey = wallet.getAccountPublicKey(0, 0, 0);
    const message = 'abcd1234abcd5678';
    const signature = await ed.sign(message, privateKey.toString('hex'));
    expect(await ed.verify(signature, message, publicKey)).toBeTruthy();
});

test('Testnet Id Cred Sec', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Testnet');
    expect(wallet.getIdCredSec(2, 115)).toEqual(
        Buffer.from(
            '33c9c538e362c5ac836afc08210f4b5d881ba65a0a45b7e353586dad0a0f56df',
            'hex'
        )
    );
});

test('Testnet Prf Key', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Testnet');
    expect(wallet.getPrfKey(3, 35)).toEqual(
        Buffer.from(
            '41d794d0b06a7a31fb79bb76c44e6b87c63e78f9afe8a772fc64d20f3d9e8e82',
            'hex'
        )
    );
});

test('Testnet CredId', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Testnet');
    expect(
        wallet.getCredentialId(10, 50, 5, {
            onChainCommitmentKey:
                'b14cbfe44a02c6b1f78711176d5f437295367aa4f2a8c2551ee10d25a03adc69d61a332a058971919dad7312e1fc94c5a8d45e64b6f917c540eee16c970c3d4b7f3caf48a7746284878e2ace21c82ea44bf84609834625be1f309988ac523fac',
        })
    ).toEqual(
        Buffer.from(
            '9535e4f2f964c955c1dd0f312f2edcbf4c7d036fe3052372a9ad949ff061b9b7ed6b00f93bc0713e381a93a43715206c',
            'hex'
        )
    );
});

test('Testnet blinding randomness', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Testnet');
    expect(wallet.getSignatureBlindingRandomness(4, 5713)).toEqual(
        Buffer.from(
            '079eb7fe4a2e89007f411ede031543bd7f687d50341a5596e015c9f2f4c1f39b',
            'hex'
        )
    );
});

test('Testnet attribute commitment randomness', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Testnet');
    expect(wallet.getAttributeCommitmentRandomness(5, 0, 4, 0)).toEqual(
        Buffer.from(
            '409fa90314ec8fb4a2ae812fd77fe58bfac81765cad3990478ff7a73ba6d88ae',
            'hex'
        )
    );
});

test('Testnet CredId matches credDeployment test', () => {
    const wallet = ConcordiumHdWallet.fromHex(
        'efa5e27326f8fa0902e647b52449bf335b7b605adc387015ec903f41d95080eb71361cbc7fb78721dcd4f3926a337340aa1406df83332c44c1cdcfe100603860',
        'Testnet'
    );
    // This credId was generated by the credential Deployment tests.
    const expectedCredId =
        "b317d3fea7de56f8c96f6e72820c5cd502cc0eef8454016ee548913255897c6b52156cc60df965d3efb3f160eff6ced4'";
    expect(
        wallet.getCredentialId(0, 0, 1, {
            onChainCommitmentKey:
                'b14cbfe44a02c6b1f78711176d5f437295367aa4f2a8c2551ee10d25a03adc69d61a332a058971919dad7312e1fc94c5a8d45e64b6f917c540eee16c970c3d4b7f3caf48a7746284878e2ace21c82ea44bf84609834625be1f309988ac523fac',
        })
    ).toEqual(Buffer.from(expectedCredId, 'hex'));
});

test('Mainnet verifiable credential signing key', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Mainnet');
    expect(
        wallet.getVerifiableCredentialSigningKey({ index: 1n, subindex: 2n }, 1)
    ).toEqual(
        Buffer.from(
            '670d904509ce09372deb784e702d4951d4e24437ad3879188d71ae6db51f3301',
            'hex'
        )
    );
});

test('Mainnet verifiable credential public key', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Mainnet');
    expect(
        wallet.getVerifiableCredentialPublicKey(
            { index: 3n, subindex: 1232n },
            341
        )
    ).toEqual(
        Buffer.from(
            '16afdb3cb3568b5ad8f9a0fa3c741b065642de8c53e58f7920bf449e63ff2bf9',
            'hex'
        )
    );
});

test('Testnet verifiable credential signing key', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Testnet');
    expect(
        wallet.getVerifiableCredentialSigningKey(
            { index: 13n, subindex: 0n },
            1
        )
    ).toEqual(
        Buffer.from(
            'c75a161b97a1e204d9f31202308958e541e14f0b14903bd220df883bd06702bb',
            'hex'
        )
    );
});

test('Testnet verifiable credential public key', () => {
    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Testnet');
    expect(
        wallet.getVerifiableCredentialPublicKey(
            { index: 17n, subindex: 0n },
            341
        )
    ).toEqual(
        Buffer.from(
            'c52a30475bac88da9e65471cf9cf59f99dcce22ce31de580b3066597746b394a',
            'hex'
        )
    );
});
