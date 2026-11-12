import {
    AccountAddress,
    BlockHash,
    ConcordiumDID,
    ConcordiumHdWallet,
    ContractAddress,
    ContractInstanceDID,
    DIDIdentifier,
    GenesisHashPrefix,
    IdentityProviderDID,
    Network,
    createAccountAddressDID,
    createAccountDID,
    createIdentityStatementDID,
    createPublicKeyDID,
    createWeb3IdDID,
    getKeyDerivationNetwork,
    isSameNetwork,
    networkFromChainId,
    networkFromString,
    networkToChainId,
    networkToString,
} from '../../src/index.js';

const TESTNET_GENESIS_HASH = '4221332d34e1694168c2a0c0b3fd0f273809612cb13d000d5c2e00e85f50f796';

const TESTNET_PREFIX = '4221332d34e1694168c2a0c0b3fd0f27';
const MAINNET_PREFIX = '9dd9ca4d19e9393877d2c44b70f89acb';
const CUSTOM_PREFIX = '0123456789abcdef0123456789abcdef';

// Test vectors shared with `web3id::did` tests in concordium-base.
const ADDRESS = '3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G';
const CRED_ID = 'a5bedc6d92d6cc8333684aa69091095c425d0b5971f554964a6ac8e297a3074748d25268f1d217234c400f3103669f90';
const PUBLIC_KEY = '9cb20e36766a8c1fee1cae8e09eca75785f3bfda220f83b2f0d865cc8a44cd86';
const ENC_ID_CRED =
    '02000300000001ac5f20234d022490c77c18f9a9ec845811a9faa539361b166ee752ddd1cc71ba2a2c37d9b0b1d43b8dd04994d9b8da04b7b14843f9c078c28c20341d435358cd150ecdebdbab7d880a1397cd68346e8dd4c347d4efaaad32979237a71969c41e0000000281da2c786ecca7be2bb2c44f2ccce6ec658497d3481d1c761b728b718258341261331a25d257df8108ef8354af3ca5fa95ec67e89275e82f068d5406e1457b6f54c79992739161437f84fc269bc62c7d26b85befab6111825a4e96e47f4f3e4f00000003af3d3fa6bdd3be106fc225ce6dcaade80c8d1d74f1f6a76d5f6492aa668e6baad87ac13af2af2822ca37b4ef8c6ad63990a190cf220735cca125fb9843eb2dd9a155fda9f8fe112885ded270de3e16814d763ea3d0ee74c9970107d2286918ce';

const IDENTIFIERS: [string, DIDIdentifier][] = [
    [`acc:${ADDRESS}`, { type: 'acc', address: ADDRESS }],
    [`cred:${CRED_ID}`, { type: 'cred', credId: CRED_ID }],
    [
        'sci:37:123/viewStuff/7b0b00000d',
        { type: 'sci', index: 37n, subindex: 123n, entrypoint: 'viewStuff', parameter: '7b0b00000d' },
    ],
    ['sci:37:0/issuer', { type: 'sci', index: 37n, subindex: 0n, entrypoint: 'issuer' }],
    ['sci:37:0', { type: 'sci', index: 37n, subindex: 0n }],
    [`pkc:${PUBLIC_KEY}`, { type: 'pkc', key: PUBLIC_KEY }],
    ['idp:37', { type: 'idp', index: 37 }],
    [`encidcred:${ENC_ID_CRED}`, { type: 'encidcred', credId: ENC_ID_CRED }],
];

const NETWORKS: [string, Network][] = [
    ['testnet', 'Testnet'],
    ['mainnet', 'Mainnet'],
    [TESTNET_PREFIX, TESTNET_PREFIX as GenesisHashPrefix.Type],
    [CUSTOM_PREFIX, CUSTOM_PREFIX as GenesisHashPrefix.Type],
];

describe('network helpers', () => {
    test('parses names to the existing Network values and preserves the form', () => {
        expect(networkFromString('testnet')).toBe('Testnet');
        expect(networkFromString('mainnet')).toBe('Mainnet');
        expect(networkFromString(TESTNET_PREFIX)).toBe(TESTNET_PREFIX);
        expect(networkFromString(CUSTOM_PREFIX)).toBe(CUSTOM_PREFIX);
    });

    test.each(['Testnet', 'stagenet', TESTNET_PREFIX.toUpperCase(), TESTNET_PREFIX.slice(1), `${TESTNET_PREFIX}00`])(
        'rejects %s',
        (segment) => {
            expect(() => networkFromString(segment)).toThrow();
        }
    );

    test('formats networks', () => {
        expect(networkToString('Testnet')).toBe('testnet');
        expect(networkToString('Mainnet')).toBe('mainnet');
        // Lowercase names have always been accepted at runtime.
        expect(networkToString('testnet' as Network)).toBe('testnet');
        expect(networkToString(GenesisHashPrefix.fromHexString(CUSTOM_PREFIX))).toBe(CUSTOM_PREFIX);
    });

    test('sameChain compares the chain, not the spelling', () => {
        expect(isSameNetwork('Testnet', GenesisHashPrefix.TESTNET)).toBe(true);
        expect(isSameNetwork(GenesisHashPrefix.MAINNET, 'Mainnet')).toBe(true);
        expect(isSameNetwork('Testnet', 'Testnet')).toBe(true);
        expect(isSameNetwork('Testnet', 'Mainnet')).toBe(false);
        expect(isSameNetwork('Testnet', GenesisHashPrefix.fromHexString(CUSTOM_PREFIX))).toBe(false);
    });

    test('chain IDs', () => {
        expect(networkFromChainId('ccd:testnet')).toBe('Testnet');
        expect(networkFromChainId('ccd:mainnet')).toBe('Mainnet');
        expect(networkFromChainId(`ccd:${TESTNET_PREFIX}`)).toBe(TESTNET_PREFIX);
        expect(networkFromChainId(`ccd:${CUSTOM_PREFIX}`)).toBe(CUSTOM_PREFIX);
        expect(() => networkFromChainId('ccd:stagenet')).toThrow();
        expect(() => networkFromChainId(`eip155:${CUSTOM_PREFIX}`)).toThrow();

        expect(networkToChainId('Testnet')).toBe('ccd:testnet');
        expect(networkToChainId(GenesisHashPrefix.fromHexString(CUSTOM_PREFIX))).toBe(`ccd:${CUSTOM_PREFIX}`);
    });
});

describe('getKeyDerivationNetwork', () => {
    test('only mainnet derives as Mainnet; every other network derives as Testnet', () => {
        expect(getKeyDerivationNetwork('Mainnet')).toBe('Mainnet');
        expect(getKeyDerivationNetwork(GenesisHashPrefix.MAINNET)).toBe('Mainnet');
        expect(getKeyDerivationNetwork('Testnet')).toBe('Testnet');
        expect(getKeyDerivationNetwork(GenesisHashPrefix.TESTNET)).toBe('Testnet');
        expect(getKeyDerivationNetwork(GenesisHashPrefix.fromHexString(CUSTOM_PREFIX))).toBe('Testnet');
    });

    test('HD wallet keys follow the key derivation network', () => {
        const seed =
            'efa5e27326f8fa0902e647b52449bf335b7b605adc387015ec903f41d95080eb71361cbc7fb78721dcd4f3926a337340aa1406df83332c44c1cdcfe100603860';
        const key = (network: Network) =>
            ConcordiumHdWallet.fromHex(seed, network).getAccountSigningKey(0, 0, 0).toString('hex');
        expect(key(GenesisHashPrefix.MAINNET)).toBe(key('Mainnet'));
        expect(key(GenesisHashPrefix.fromHexString(CUSTOM_PREFIX))).toBe(key('Testnet'));
        expect(key('Testnet')).not.toBe(key('Mainnet'));
    });
});

describe('GenesisHashPrefix', () => {
    test('known prefixes', () => {
        expect(GenesisHashPrefix.TESTNET).toBe(TESTNET_PREFIX);
        expect(GenesisHashPrefix.MAINNET).toBe(MAINNET_PREFIX);
    });

    test('from a genesis hash', () => {
        expect(GenesisHashPrefix.fromGenesisHash(TESTNET_GENESIS_HASH)).toBe(TESTNET_PREFIX);
        expect(GenesisHashPrefix.fromGenesisHash(BlockHash.fromHexString(TESTNET_GENESIS_HASH))).toBe(TESTNET_PREFIX);
    });
});

describe('ConcordiumDID', () => {
    for (const [segment, network] of NETWORKS) {
        test.each(IDENTIFIERS)(`round trips did:ccd:${segment}:%s`, (identifierString, identifier) => {
            const did = `did:ccd:${segment}:${identifierString}`;
            const parsed = ConcordiumDID.fromJSON(did);
            expect(parsed).toEqual({ network, identifier });
            expect(parsed.toJSON()).toBe(did);
            expect(JSON.stringify({ did: parsed })).toBe(JSON.stringify({ did }));
        });
    }

    test.each(IDENTIFIERS)('a missing network means mainnet: did:ccd:%s', (identifierString, identifier) => {
        expect(ConcordiumDID.fromJSON(`did:ccd:${identifierString}`)).toEqual({ network: 'Mainnet', identifier });
    });

    test('an omitted subindex means 0', () => {
        expect(ConcordiumDID.fromJSON('did:ccd:testnet:sci:37/viewStuff').identifier).toEqual({
            type: 'sci',
            index: 37n,
            subindex: 0n,
            entrypoint: 'viewStuff',
        });
    });

    test.each([
        'did:example:123',
        'did:ccd:testnet:foo:1',
        'did:ccd:testnet:idp:abc',
        'did:ccd:testnet:idp:4294967296',
        `did:ccd:testnet:cred:${CRED_ID}ff`,
        `did:ccd:testnet:pkc:${PUBLIC_KEY.slice(2)}`,
        `did:ccd:${TESTNET_PREFIX.slice(1)}:idp:0`,
        `did:ccd:${TESTNET_PREFIX.toUpperCase()}:idp:0`,
        `did:ccd:${TESTNET_GENESIS_HASH}:idp:0`,
    ])('rejects %s', (did) => {
        expect(() => ConcordiumDID.fromJSON(did)).toThrow();
    });

    test('identifierOf checks the identifier type', () => {
        const did = ConcordiumDID.fromJSON('did:ccd:testnet:idp:3');
        expect(did.identifierOf('idp').index).toBe(3);
        expect(() => did.identifierOf('sci')).toThrow();
    });
});

describe('existing DID helpers are unchanged for named networks', () => {
    // Expected values are what the helpers produced before they were moved onto the DID module.
    test.each<Network>(['Testnet', 'Mainnet'])('%s', (network) => {
        const n = network.toLowerCase();
        expect(createAccountDID(network, CRED_ID)).toBe(`did:ccd:${n}:cred:${CRED_ID}`);
        expect(createIdentityStatementDID(network, 3)).toBe(`did:ccd:${n}:idp:3`);
        expect(createWeb3IdDID(network, PUBLIC_KEY, 5n, 1n)).toBe(`did:ccd:${n}:sci:5:1/credentialEntry/${PUBLIC_KEY}`);
        expect(new IdentityProviderDID(network, 3).toJSON()).toBe(`did:ccd:${n}:idp:3`);
        expect(new ContractInstanceDID(network, ContractAddress.create(5, 1)).toJSON()).toBe(`did:ccd:${n}:sci:5:1`);
    });

    test('fromJSON returns the existing capitalised Network values', () => {
        expect(IdentityProviderDID.fromJSON('did:ccd:testnet:idp:0').network).toBe('Testnet');
        expect(IdentityProviderDID.fromJSON('did:ccd:mainnet:idp:7').index).toBe(7);
        const contract = ContractInstanceDID.fromJSON('did:ccd:testnet:sci:5:1');
        expect(contract.network).toBe('Testnet');
        expect(contract.address).toEqual(ContractAddress.create(5, 1));
    });
});

describe('DID helpers with genesis hash prefixes', () => {
    const prefix = GenesisHashPrefix.fromHexString(CUSTOM_PREFIX);

    test('create', () => {
        expect(createAccountDID(prefix, CRED_ID)).toBe(`did:ccd:${CUSTOM_PREFIX}:cred:${CRED_ID}`);
        expect(createIdentityStatementDID(prefix, 3)).toBe(`did:ccd:${CUSTOM_PREFIX}:idp:3`);
        expect(createWeb3IdDID(prefix, PUBLIC_KEY, 5n, 1n)).toBe(
            `did:ccd:${CUSTOM_PREFIX}:sci:5:1/credentialEntry/${PUBLIC_KEY}`
        );
        expect(createAccountAddressDID(prefix, AccountAddress.fromBase58(ADDRESS))).toBe(
            `did:ccd:${CUSTOM_PREFIX}:acc:${ADDRESS}`
        );
        expect(createPublicKeyDID('Testnet', PUBLIC_KEY)).toBe(`did:ccd:testnet:pkc:${PUBLIC_KEY}`);
    });

    test('IdentityProviderDID', () => {
        const did = `did:ccd:${TESTNET_PREFIX}:idp:0`;
        const idp = IdentityProviderDID.fromJSON(did);
        expect(idp.network).toBe(TESTNET_PREFIX);
        expect(idp.toJSON()).toBe(did);
        expect(isSameNetwork(idp.network, 'Testnet')).toBe(true);

        expect(IdentityProviderDID.fromChainId('ccd:testnet', 2).toJSON()).toBe('did:ccd:testnet:idp:2');
        expect(IdentityProviderDID.fromChainId(`ccd:${CUSTOM_PREFIX}`, 2).toJSON()).toBe(
            `did:ccd:${CUSTOM_PREFIX}:idp:2`
        );
    });

    test('fromJSON rejects other DID types', () => {
        expect(() => IdentityProviderDID.fromJSON('did:ccd:testnet:sci:5:1')).toThrow();
        expect(() => ContractInstanceDID.fromJSON('did:ccd:testnet:idp:0')).toThrow();
        expect(() => ContractInstanceDID.fromJSON('did:ccd:testnet:sci:5:1/issuer')).toThrow();
    });
});
