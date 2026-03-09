import {
    AccountAddress,
    EncodedTokenModuleEvent,
    TokenAdminRole,
    TokenMetadataUrl,
    TokenUpdateAdminRolesDetails,
    TransactionEventTag,
} from '../../../src/index.ts';
import {
    Cbor,
    CborAccountAddress,
    TokenId,
    TokenListUpdateEventDetails,
    TokenPauseEventDetails,
    parseTokenModuleEvent,
} from '../../../src/plt/index.ts';

describe('PLT TokenModuleEvent', () => {
    const testEventParsing = (type: string, targetValue: number) => {
        it(`parses ${type} events correctly`, () => {
            const accountBytes = new Uint8Array(32).fill(targetValue);
            const details: TokenListUpdateEventDetails = {
                target: CborAccountAddress.fromAccountAddress(AccountAddress.fromBuffer(accountBytes)),
            };
            const validEvent: EncodedTokenModuleEvent = {
                tag: TransactionEventTag.TokenModuleEvent,
                type,
                tokenId: TokenId.fromString('PLT'),
                details: Cbor.encode(details),
            };
            expect(validEvent.details.toString()).toEqual(
                `a166746172676574d99d73a201d99d71a101190397035820${Buffer.from(accountBytes).toString('hex')}`
            );

            const parsedEvent = parseTokenModuleEvent(validEvent)!;
            expect(parsedEvent.type).toEqual(type);
            expect((parsedEvent.details as TokenListUpdateEventDetails).target.address.decodedAddress).toEqual(
                new Uint8Array(32).fill(targetValue)
            );
        });
    };

    testEventParsing('addAllowList', 0x15);
    testEventParsing('addDenyList', 0x16);
    testEventParsing('removeAllowList', 0x17);
    testEventParsing('removeDenyList', 0x18);

    it('parses pause event', () => {
        const details: TokenPauseEventDetails = {};
        const validEvent: EncodedTokenModuleEvent = {
            tag: TransactionEventTag.TokenModuleEvent,
            tokenId: TokenId.fromString('PLT'),
            type: 'pause',
            details: Cbor.encode(details),
        };
        expect(validEvent.details.toString()).toEqual('a0');

        const parsedEvent = parseTokenModuleEvent(validEvent)!;
        expect(parsedEvent.type).toEqual('pause');
        expect(parsedEvent.details).toEqual({});
    });

    it('parses unpause event', () => {
        const details: TokenPauseEventDetails = {};
        const validEvent: EncodedTokenModuleEvent = {
            tag: TransactionEventTag.TokenModuleEvent,
            tokenId: TokenId.fromString('PLT'),
            type: 'unpause',
            details: Cbor.encode(details),
        };
        expect(validEvent.details.toString()).toEqual('a0');

        const parsedEvent = parseTokenModuleEvent(validEvent)!;
        expect(parsedEvent.type).toEqual('unpause');
        expect(parsedEvent.details).toEqual({});
    });

    it('parses updateMetadata event', () => {
        const checksum = new Uint8Array(32);
        checksum.fill(1);
        const details = TokenMetadataUrl.create('https://example.com/token-metadata.json', checksum);

        const validEvent: EncodedTokenModuleEvent = {
            tag: TransactionEventTag.TokenModuleEvent,
            tokenId: TokenId.fromString('PLT'),
            type: 'updateMetadata',
            details: Cbor.encode(details),
        };

        const parsedEvent = parseTokenModuleEvent(validEvent)!;
        expect(parsedEvent.type).toEqual('updateMetadata');
        expect(parsedEvent.details).toEqual(details);
    });

    it('parses updateMetadata event against a FIXED hex string', () => {
        // got this hex by running the Cbor.encode(details) once with details created from TokenMetadata.create and checksum, then copying the output.
        const fixedHex = 'a26375726c782768747470733a2f2f6578616d706c652e636f6d2f746f6b656e2d6d657461646174612e6a736f6e6e636865636b73756d53686132353658200101010101010101010101010101010101010101010101010101010101010101';
        
        const validEvent: EncodedTokenModuleEvent = {
            tag: TransactionEventTag.TokenModuleEvent,
            tokenId: TokenId.fromString('PLT'),
            type: 'updateMetadata',
            details: Cbor.fromHexString(fixedHex),
        };

        const parsedEvent = parseTokenModuleEvent(validEvent)!;
        
        expect(parsedEvent.type).toEqual('updateMetadata');
        const details = parsedEvent.details as TokenMetadataUrl.Type;
        expect(details.url).toEqual('https://example.com/token-metadata.json');
        expect(Buffer.from(details.checksumSha256!).toString('hex')).toEqual('01'.repeat(32));
    });

    it('parses assignAdminRoles event', () => {
        const accountBytes = new Uint8Array(32).fill(0x20);
        const details: TokenUpdateAdminRolesDetails = {
            roles: [TokenAdminRole.UpdateAdminRoles],
            account: CborAccountAddress.fromAccountAddress(AccountAddress.fromBuffer(accountBytes)),
        };
        const validEvent: EncodedTokenModuleEvent = {
            tag: TransactionEventTag.TokenModuleEvent,
            tokenId: TokenId.fromString('PLT'),
            type: 'assignAdminRoles',
            details: Cbor.encode(details),
        };

        const parsedEvent = parseTokenModuleEvent(validEvent)!;
        expect(parsedEvent.type).toEqual('assignAdminRoles');
        expect((parsedEvent.details as TokenUpdateAdminRolesDetails).roles).toEqual([TokenAdminRole.UpdateAdminRoles]);
        expect((parsedEvent.details as TokenUpdateAdminRolesDetails).account.address.decodedAddress).toEqual(
            new Uint8Array(32).fill(0x20)
        );
    });

    it('parses assignAdminRoles event against a FIXED hex string', () => {
        const fixedHex = 'a265726f6c6573817075706461746541646d696e526f6c6573676163636f756e74d99d73a201d99d71a1011903970358202020202020202020202020202020202020202020202020202020202020202020';

        const validEvent: EncodedTokenModuleEvent = {
            tag: TransactionEventTag.TokenModuleEvent,
            tokenId: TokenId.fromString('PLT'),
            type: 'assignAdminRoles',
            details: Cbor.fromHexString(fixedHex),
        };

        const parsedEvent = parseTokenModuleEvent(validEvent)!;
        expect(parsedEvent.type).toEqual('assignAdminRoles');
        expect((parsedEvent.details as TokenUpdateAdminRolesDetails).roles).toEqual([TokenAdminRole.UpdateAdminRoles]);
        expect((parsedEvent.details as TokenUpdateAdminRolesDetails).account.address.decodedAddress).toEqual(
            new Uint8Array(32).fill(0x20)
        );
    });

    it('parses revokeAdminRoles event', () => {
        const accountBytes = new Uint8Array(32).fill(0x20);
        const details: TokenUpdateAdminRolesDetails = {
            roles: [TokenAdminRole.UpdateAdminRoles],
            account: CborAccountAddress.fromAccountAddress(AccountAddress.fromBuffer(accountBytes)),
        };
        const validEvent: EncodedTokenModuleEvent = {
            tag: TransactionEventTag.TokenModuleEvent,
            tokenId: TokenId.fromString('PLT'),
            type: 'revokeAdminRoles',
            details: Cbor.encode(details),
        };

        const parsedEvent = parseTokenModuleEvent(validEvent)!;
        expect(parsedEvent.type).toEqual('revokeAdminRoles');
        expect((parsedEvent.details as TokenUpdateAdminRolesDetails).roles).toEqual([TokenAdminRole.UpdateAdminRoles]);
        expect((parsedEvent.details as TokenUpdateAdminRolesDetails).account.address.decodedAddress).toEqual(
            new Uint8Array(32).fill(0x20)
        );
    });

    it('parses revokeAdminRoles event against a FIXED hex string', () => {
        const fixedHex = 'a265726f6c6573817075706461746541646d696e526f6c6573676163636f756e74d99d73a201d99d71a1011903970358202020202020202020202020202020202020202020202020202020202020202020';
        const validEvent: EncodedTokenModuleEvent = {
            tag: TransactionEventTag.TokenModuleEvent,
            tokenId: TokenId.fromString('PLT'),
            type: 'revokeAdminRoles',
            details: Cbor.fromHexString(fixedHex),
        };

        const parsedEvent = parseTokenModuleEvent(validEvent)!;
        expect(parsedEvent.type).toEqual('revokeAdminRoles');
        expect((parsedEvent.details as TokenUpdateAdminRolesDetails).roles).toEqual([TokenAdminRole.UpdateAdminRoles]);
        expect((parsedEvent.details as TokenUpdateAdminRolesDetails).account.address.decodedAddress).toEqual(
            new Uint8Array(32).fill(0x20)
        );
    });

    it('handles unknown events', () => {
        const unknownEvent: EncodedTokenModuleEvent = {
            tag: TransactionEventTag.TokenModuleEvent,
            tokenId: TokenId.fromString('PLT'),
            type: 'unknown',
            details: Cbor.encode({}),
        };
        const parsed = parseTokenModuleEvent(unknownEvent);
        expect(parsed.type).toEqual('unknown');
        expect(parsed.details).toEqual({});
    });

    it('throws an error for invalid event details for list update events', () => {
        const invalidDetailsEvent: EncodedTokenModuleEvent = {
            tag: TransactionEventTag.TokenModuleEvent,
            tokenId: TokenId.fromString('PLT'),
            type: 'addAllowList',
            details: Cbor.encode(null),
        };
        expect(() => parseTokenModuleEvent(invalidDetailsEvent)).toThrowError(/null/);
    });

    it("throws an error if 'target' is missing or invalid for list update events", () => {
        const missingTargetEvent: EncodedTokenModuleEvent = {
            tag: TransactionEventTag.TokenModuleEvent,
            tokenId: TokenId.fromString('PLT'),
            type: 'addAllowList',
            details: Cbor.encode({}),
        };
        expect(() => parseTokenModuleEvent(missingTargetEvent)).toThrowError(/{}/);
    });

    it('throws an error for invalid event details for pause events', () => {
        const invalidEvent: EncodedTokenModuleEvent = {
            tag: TransactionEventTag.TokenModuleEvent,
            tokenId: TokenId.fromString('PLT'),
            type: 'pause',
            details: Cbor.encode(null),
        };
        expect(() => parseTokenModuleEvent(invalidEvent)).toThrowError(/null/);
    });

    it('throws an error for invalid event details for unpause events', () => {
        const invalidEvent: EncodedTokenModuleEvent = {
            tag: TransactionEventTag.TokenModuleEvent,
            tokenId: TokenId.fromString('PLT'),
            type: 'unpause',
            details: Cbor.encode(null),
        };
        expect(() => parseTokenModuleEvent(invalidEvent)).toThrowError(/null/);
    });

    it('throws an error for null event details for updateMetadata events', () => {
        const invalidEvent: EncodedTokenModuleEvent = {
            tag: TransactionEventTag.TokenModuleEvent,
            tokenId: TokenId.fromString('PLT'),
            type: 'updateMetadata',
            details: Cbor.encode(null),
        };
        expect(() => parseTokenModuleEvent(invalidEvent)).toThrowError('Invalid CBOR value for TokenMetadataUrl');
    });

    it('throws an error for missing url details for updateMetadata events', () => {
        const invalidDetails = {
            checksumSha256: new Uint8Array(32),
            url: 123,
        };

        const invalidEvent: EncodedTokenModuleEvent = {
            tag: TransactionEventTag.TokenModuleEvent,
            tokenId: TokenId.fromString('PLT'),
            type: 'updateMetadata',
            details: Cbor.encode(invalidDetails),
        };
        expect(() => parseTokenModuleEvent(invalidEvent)).toThrowError(
            'Missing or invalid "url" field in TokenMetadataUrl'
        );
    });

    it('throws an error for null event details for revokeAdminRoles events', () => {
        const invalidEvent: EncodedTokenModuleEvent = {
            tag: TransactionEventTag.TokenModuleEvent,
            tokenId: TokenId.fromString('PLT'),
            type: 'revokeAdminRoles',
            details: Cbor.encode(null),
        };
        expect(() => parseTokenModuleEvent(invalidEvent)).toThrowError(
            'Invalid event details: null. Expected an object.'
        );
    });

    it('throws an error for missing account for revokeAdminRoles events', () => {
        const invalidDetails = {
            roles: [TokenAdminRole.UpdateAdminRoles],
        };

        const invalidEvent: EncodedTokenModuleEvent = {
            tag: TransactionEventTag.TokenModuleEvent,
            tokenId: TokenId.fromString('PLT'),
            type: 'revokeAdminRoles',
            details: Cbor.encode(invalidDetails),
        };
        expect(() => parseTokenModuleEvent(invalidEvent)).toThrowError(
            'Invalid event details: {"roles":["updateAdminRoles"]}. Expected \'account\''
        );
    });

    it('throws an error for null event details for assignAdminRoles events', () => {
        const invalidEvent: EncodedTokenModuleEvent = {
            tag: TransactionEventTag.TokenModuleEvent,
            tokenId: TokenId.fromString('PLT'),
            type: 'assignAdminRoles',
            details: Cbor.encode(null),
        };
        expect(() => parseTokenModuleEvent(invalidEvent)).toThrowError(
            'Invalid event details: null. Expected an object.'
        );
    });

    it('throws an error for missing account for assignAdminRoles events', () => {
        const invalidDetails = {
            roles: [TokenAdminRole.UpdateAdminRoles],
        };

        const invalidEvent: EncodedTokenModuleEvent = {
            tag: TransactionEventTag.TokenModuleEvent,
            tokenId: TokenId.fromString('PLT'),
            type: 'assignAdminRoles',
            details: Cbor.encode(invalidDetails),
        };
        expect(() => parseTokenModuleEvent(invalidEvent)).toThrowError(
            'Invalid event details: {"roles":["updateAdminRoles"]}. Expected \'account\''
        );
    });
});
