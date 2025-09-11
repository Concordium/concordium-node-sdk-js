import { AccountAddress, EncodedTokenModuleEvent, TransactionEventTag } from '../../../src/index.ts';
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
});
