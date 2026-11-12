import { getChainId, withGenesisChainId } from '../src/WalletConnect';
import { Network } from '../src/WalletConnection';

// The modal package ships untranspiled ESM; it is not needed to compute chain IDs.
jest.mock('@walletconnect/modal', () => ({
    WalletConnectModal: jest.fn(),
}));

// `constants` and `WalletConnect` import each other; the real constants are not needed here.
jest.mock('../src/constants', () => ({
    WALLET_CONNECT_SESSION_NAMESPACE: 'ccd',
}));

// Same names and genesis hashes as TESTNET, MAINNET and STAGENET in `src/constants.ts`.
function network(name: string, genesisHash: string): Network {
    return { name, genesisHash, grpcOpts: undefined, ccdScanBaseUrl: '' };
}
const TESTNET = network('testnet', '4221332d34e1694168c2a0c0b3fd0f273809612cb13d000d5c2e00e85f50f796');
const MAINNET = network('mainnet', '9dd9ca4d19e9393877d2c44b70f89acbfc0883c2243e5eeaecc0d1cd0503f478');
const STAGENET = network('stagenet', '853288fa5a45554d3cbbf8a756b85abcbfddf28e752b13223eb747209a4d0d3c');

describe('getChainId', () => {
    test('defaults to the network name (unchanged behaviour)', () => {
        expect(getChainId(TESTNET)).toBe('ccd:testnet');
        expect(getChainId(MAINNET)).toBe('ccd:mainnet');
        expect(getChainId(STAGENET)).toBe('ccd:stagenet');
    });

    test('genesis-based chain IDs are opt-in', () => {
        expect(getChainId(withGenesisChainId(TESTNET))).toBe('ccd:4221332d34e1694168c2a0c0b3fd0f27');
        expect(getChainId(withGenesisChainId(MAINNET))).toBe('ccd:9dd9ca4d19e9393877d2c44b70f89acb');
        expect(getChainId(withGenesisChainId(STAGENET))).toBe(`ccd:${STAGENET.genesisHash.slice(0, 32)}`);
    });

    test('custom network', () => {
        const custom = network('my-chain', '0123456789ABCDEF0123456789abcdef0123456789abcdef0123456789abcdef');
        expect(getChainId(custom)).toBe('ccd:my-chain');
        expect(getChainId({ ...custom, chainIdFormat: 'genesis' })).toBe('ccd:0123456789abcdef0123456789abcdef');
        expect(() => getChainId({ ...custom, genesisHash: 'nothex', chainIdFormat: 'genesis' })).toThrow();
    });

    test('withGenesisChainId does not mutate its input', () => {
        withGenesisChainId(TESTNET);
        expect(TESTNET.chainIdFormat).toBeUndefined();
    });
});
