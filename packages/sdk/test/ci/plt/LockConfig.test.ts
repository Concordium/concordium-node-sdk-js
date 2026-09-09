import { Buffer } from 'buffer/index.js';

import { Cbor, CborAccountAddress, CborEpoch, LockConfig, LockMetadata, TokenId } from '../../../src/pub/plt.ts';
import { AccountAddress } from '../../../src/pub/types.ts';

describe('PLT LockConfig', () => {
    const account = CborAccountAddress.fromAccountAddress(AccountAddress.fromBuffer(new Uint8Array(32).fill(0x15)));
    const token = TokenId.fromString('tToken');
    const config = LockConfig.simpleV0(
        [account],
        CborEpoch.fromEpochSeconds(10n),
        [{ account, roles: [LockConfig.SimpleV0Capability.Fund, LockConfig.SimpleV0Capability.Send] }],
        [token]
    );

    it('decodes CBOR values directly', () => {
        expect(
            LockConfig.fromCBORValue({
                simpleV0: {
                    recipients: [account],
                    expiry: CborEpoch.fromEpochSeconds(10n),
                    grants: [],
                    tokens: [token.value],
                },
            })
        ).toEqual(LockConfig.simpleV0([account], CborEpoch.fromEpochSeconds(10n), [], [token]));
    });

    it('decodes CBOR bytes directly and through generic dispatch', () => {
        const fixture =
            'a16873696d706c655630a466657870697279c10a666772616e747381a265726f6c6573826466756e646473656e64676163636f756e74d99d73a201d99d71a101190397035820151515151515151515151515151515151515151515151515151515151515151566746f6b656e73816674546f6b656e6a726563697069656e747381d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515';
        const bytes = Cbor.fromHexString(fixture).bytes;

        expect(LockConfig.fromCBOR(bytes)).toEqual(config);
        const decoded = Cbor.decode(Cbor.fromHexString(fixture), 'LockConfig');
        expect(decoded).toEqual(config);
        expect(Buffer.from(Cbor.encode(decoded).bytes).toString('hex')).toBe(fixture);
    });

    it('decodes and re-encodes the fixed complete simpleV0 fixture', () => {
        const fixture =
            'a16873696d706c655630a7646d656d6f42010266657870697279c10a666772616e74738066746f6b656e73816674546f6b656e686d657461646174615825a2646e616d656c56657374696e67206c6f636b666973737565726a436f6e636f726469756d696b656570416c697665f56a726563697069656e747381d99d73a201d99d71a1011903970358201515151515151515151515151515151515151515151515151515151515151515';
        const decoded = Cbor.decode(Cbor.fromHexString(fixture), 'LockConfig');

        expect(decoded).toEqual(
            LockConfig.simpleV0([account], CborEpoch.fromEpochSeconds(10n), [], [token], {
                keepAlive: true,
                memo: new Uint8Array([1, 2]),
                metadata: LockMetadata.encode({ name: 'Vesting lock', issuer: 'Concordium' }),
            })
        );
        expect(Buffer.from(Cbor.encode(decoded).bytes).toString('hex')).toBe(fixture);
    });

    it('decodes and re-encodes the fixed any-recipient fixture', () => {
        const fixture =
            'a16873696d706c655630a466657870697279c10a666772616e74738066746f6b656e73816674546f6b656e6a726563697069656e747363616e79';
        const decoded = Cbor.decode(Cbor.fromHexString(fixture), 'LockConfig');

        expect(decoded).toEqual(LockConfig.simpleV0('any', CborEpoch.fromEpochSeconds(10n), [], [token]));
        expect(Buffer.from(Cbor.encode(decoded).bytes).toString('hex')).toBe(fixture);
    });

    it('round-trips typed metadata and preserves invalid opaque metadata for helper rejection', () => {
        const metadata = LockMetadata.encode({
            name: 'Vesting lock',
            description: 'Tokens locked',
            issuer: 'Concordium',
        });
        const decoded = Cbor.decode(
            Cbor.encode(LockConfig.simpleV0([account], CborEpoch.fromEpochSeconds(10n), [], [token], { metadata })),
            'LockConfig'
        );
        expect(LockMetadata.decode(decoded.simpleV0.metadata!)).toEqual({
            name: 'Vesting lock',
            description: 'Tokens locked',
            issuer: 'Concordium',
        });

        const invalid = new Uint8Array([0x01]);
        const invalidDecoded = Cbor.decode(
            Cbor.encode(
                LockConfig.simpleV0([account], CborEpoch.fromEpochSeconds(10n), [], [token], { metadata: invalid })
            ),
            'LockConfig'
        );
        expect(invalidDecoded.simpleV0.metadata).toEqual(invalid);
        expect(() => LockMetadata.decode(invalidDecoded.simpleV0.metadata!)).toThrow(/Invalid LockMetadata/);
    });

    it('constructs complete simpleV0 configurations with default and explicit optional fields', () => {
        expect(LockConfig.simpleV0([account], CborEpoch.fromEpochSeconds(10n), [], [token])).toEqual({
            simpleV0: { recipients: [account], expiry: CborEpoch.fromEpochSeconds(10n), grants: [], tokens: [token] },
        });
        expect(
            LockConfig.simpleV0([account], CborEpoch.fromEpochSeconds(10n), [], [token], {
                keepAlive: true,
                memo: new Uint8Array([1, 2]),
                metadata: new Uint8Array([3]),
            })
        ).toEqual({
            simpleV0: {
                recipients: [account],
                expiry: CborEpoch.fromEpochSeconds(10n),
                grants: [],
                tokens: [token],
                keepAlive: true,
                memo: new Uint8Array([1, 2]),
                metadata: new Uint8Array([3]),
            },
        });
    });

    it('rejects invalid variants and payload shapes', () => {
        const valid = { recipients: [account], expiry: CborEpoch.fromEpochSeconds(10n), grants: [], tokens: [] };
        for (const value of [[], { unknown: valid }, { simpleV0: valid, unknown: null }, { simpleV0: [] }]) {
            expect(() => Cbor.decode(Cbor.encode(value), 'LockConfig')).toThrow();
        }
    });

    it('rejects missing required fields', () => {
        const valid = { recipients: [account], expiry: CborEpoch.fromEpochSeconds(10n), grants: [], tokens: [] };
        for (const field of ['recipients', 'expiry', 'grants', 'tokens'] as const) {
            const { [field]: _, ...invalid } = valid;
            expect(() => Cbor.decode(Cbor.encode({ simpleV0: invalid }), 'LockConfig')).toThrow();
        }
    });

    it('rejects invalid simpleV0 fields', () => {
        const valid = { recipients: [account], expiry: CborEpoch.fromEpochSeconds(10n), grants: [], tokens: [] };
        const invalidValues = [
            { ...valid, recipients: 'everybody' },
            { ...valid, recipients: 1 },
            { ...valid, recipients: ['not-an-account'] },
            { ...valid, expiry: 10 },
            { ...valid, grants: 'no' },
            { ...valid, grants: [{}] },
            { ...valid, grants: [{ account: 'not-an-account', roles: [] }] },
            { ...valid, grants: [{ account, roles: 'fund' }] },
            { ...valid, grants: [{ account, roles: ['unknown'] }] },
            { ...valid, tokens: 'no' },
            { ...valid, tokens: [1] },
            { ...valid, metadata: {} },
            { ...valid, keepAlive: 'true' },
            { ...valid, memo: 'memo' },
        ];
        for (const invalid of invalidValues) {
            expect(() => Cbor.decode(Cbor.encode({ simpleV0: invalid }), 'LockConfig')).toThrow();
        }
    });
});
