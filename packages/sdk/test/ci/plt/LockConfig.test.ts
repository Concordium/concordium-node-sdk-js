import {
    Cbor,
    CborAccountAddress,
    CborEpoch,
    LockId,
    LockMetadata,
    TokenAmount,
    TokenId,
} from '../../../src/pub/plt.js';
import { AccountAddress } from '../../../src/pub/types.js';

// output_fixture in concordium-base lock_config.rs at 7a495454a.
const OUTPUT_FIXTURE =
    'a765726f6c657381a265726f6c6573826466756e646473656e64676163636f756e74d99d73a201d99d71a1011903970358200102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f2066657870697279c11a6b93277066746f6b656e738162745467686f6c6465727381d99d73a201d99d71a1011903970358200102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f206776617269616e746873696d706c6556306776657273696f6e006a726563697069656e747363616e79';
const holder = CborAccountAddress.fromAccountAddress(
    AccountAddress.fromBuffer(Uint8Array.from({ length: 32 }, (_, i) => i + 1))
);
const lock = LockId.create(10001n, 5n, 0n);
const funds = [
    { account: holder, amounts: [{ token: TokenId.fromString('tT'), amount: TokenAmount.create(12300n, 2) }] },
];
const v0 = {
    version: 0,
    variant: 'simpleV0',
    recipients: 'any',
    holders: [holder],
    expiry: CborEpoch.fromEpochSeconds(1804806000n),
    roles: [{ account: holder, roles: ['fund', 'send'] }],
    tokens: ['tT'],
};
const { version, ...unversioned } = v0;
const typedV0 = { ...unversioned, version, tokens: [TokenId.fromString('tT')] };

describe.each([
    ['LockConfig', (config: unknown) => Cbor.decode(Cbor.encode(config), 'LockConfig')],
    ['LockInfo', (config: unknown) => Cbor.decode(Cbor.encode({ lock, config, funds }), 'LockInfo').config],
] as const)('PLT %s configuration reads', (_, decodeConfig) => {
    it('preserves opaque metadata bytes', () => {
        const metadata = Uint8Array.of(0xff, 0x00, 0x81);
        expect(decodeConfig({ ...v0, metadata })).toMatchObject({ ...typedV0, metadata });
    });

    it('exposes typed recipients and metadata bytes for the metadata helper', () => {
        const value = { name: 'Vesting lock', issuer: 'Concordium' };
        const metadata = LockMetadata.encode(value);
        const decoded = decodeConfig({ ...v0, recipients: [holder], metadata });
        expect(decoded).toMatchObject({ ...typedV0, recipients: [holder], metadata });
        if ('data' in decoded || decoded.metadata === undefined) throw new Error('Expected v0 metadata');
        expect(LockMetadata.decode(decoded.metadata)).toEqual(value);
    });

    it('preserves an unfamiliar v0 variant', () => {
        expect(decodeConfig({ ...v0, variant: 'futureVariant' })).toMatchObject({
            ...typedV0,
            variant: 'futureVariant',
        });
    });

    it('preserves an unfamiliar v0 capability', () => {
        const roles = [{ account: holder, roles: ['fund', 'futureCapability'] }];
        expect(decodeConfig({ ...v0, roles })).toMatchObject({ ...typedV0, roles });
    });

    it('exposes a wide version as a number without converting the original decoded data', () => {
        const data = new Map<unknown, unknown>([
            ['version', 9_007_199_254_740_993n],
            [1, holder],
        ]);
        expect(decodeConfig(data)).toEqual({ version: 9_007_199_254_740_992, data });
    });

    it.each([
        ['missing version', unversioned],
        ['nonnumeric version', { ...v0, version: '0' }],
        ['non-string capability', { ...v0, roles: [{ account: holder, roles: ['fund', 42] }] }],
        ['untagged expiry', { ...v0, expiry: 10 }],
        ['invalid metadata', { ...v0, metadata: 'not bytes' }],
    ])('rejects malformed output: %s', (_, config) => {
        expect(() => decodeConfig(config)).toThrow();
    });
});

describe('PLT pinned v0 output and future configuration reads', () => {
    it('decodes the pinned Rust v0 fixture standalone', () => {
        expect(Cbor.decode(Cbor.fromHexString(OUTPUT_FIXTURE), 'LockConfig')).toMatchObject(typedV0);
    });

    it('decodes the pinned Rust v0 fixture inside LockInfo', () => {
        // The three-entry map starts with config; append the entries from the two-entry lock/funds map.
        const envelope = Cbor.encode({ lock, funds }).toString().slice(2);
        const nested = Cbor.fromHexString(`a366636f6e666967${OUTPUT_FIXTURE}${envelope}`);
        expect(Cbor.decode(nested, 'LockInfo')).toMatchObject({ lock, funds, config: typedV0 });
    });

    const data = { version: 7, roles: null, controller: { owner: holder } };
    const expected = { version: 7, data };

    it('exposes a future version as a number with normal CBOR-decoded data', () => {
        const decoded = Cbor.decode(Cbor.encode(data), 'LockConfig');
        expect(decoded).toMatchObject(expected);
    });

    it('keeps the lock ID and funds readable with a future configuration', () => {
        const decoded = Cbor.decode(Cbor.encode({ lock, config: data, funds }), 'LockInfo');
        expect(decoded).toMatchObject({ lock, config: expected });
        expect(decoded.funds).toEqual(funds);
    });
});
