import {
    AddressNotFoundDetails,
    AddressNotFoundRejectReason,
    Cbor,
    DeserializationFailureDetails,
    DeserializationFailureRejectReason,
    EncodedTokenModuleRejectReason,
    MintWouldOverflowDetails,
    MintWouldOverflowRejectReason,
    OperationNotPermittedDetails,
    OperationNotPermittedRejectReason,
    TokenAmount,
    TokenBalanceInsufficientDetails,
    TokenBalanceInsufficientRejectReason,
    TokenHolder,
    TokenId,
    TokenRejectReasonType,
    UnknownTokenRejectReason,
    UnsupportedOperationDetails,
    UnsupportedOperationRejectReason,
    parseTokenModuleRejectReason,
} from '../../../src/pub/plt.ts';
import { AccountAddress } from '../../../src/pub/types.ts';

function amt(value: number, decimals = 0) {
    return TokenAmount.create(BigInt(value), decimals);
}

function dummyTokenId() {
    return TokenId.fromString('PLT');
}

describe('PLT TokenModuleRejectReason', () => {
    it('parses addressNotFound correctly', () => {
        const addrBytes = new Uint8Array(32).fill(0x11);
        const details: AddressNotFoundDetails = {
            index: 2,
            address: TokenHolder.fromAccountAddress(AccountAddress.fromBuffer(addrBytes)),
        };
        const encoded: EncodedTokenModuleRejectReason = {
            tokenId: dummyTokenId(),
            type: TokenRejectReasonType.AddressNotFound,
            details: Cbor.encode(details),
        };
        const parsed = parseTokenModuleRejectReason(encoded) as AddressNotFoundRejectReason;
        expect(parsed.type).toBe(TokenRejectReasonType.AddressNotFound);
        expect(parsed.details.index).toBe(2);
        expect(parsed.details.address.type).toBe('account');
    });

    it('parses tokenBalanceInsufficient correctly', () => {
        const details: TokenBalanceInsufficientDetails = {
            index: 0,
            availableBalance: amt(100),
            requiredBalance: amt(200),
        };
        const encoded: EncodedTokenModuleRejectReason = {
            tokenId: dummyTokenId(),
            type: TokenRejectReasonType.TokenBalanceInsufficient,
            details: Cbor.encode(details),
        };
        const parsed = parseTokenModuleRejectReason(encoded) as TokenBalanceInsufficientRejectReason;
        expect(parsed.type).toBe(TokenRejectReasonType.TokenBalanceInsufficient);
        expect(parsed.details.availableBalance.value).toBe(100n);
        expect(parsed.details.requiredBalance.value).toBe(200n);
    });

    it('parses deserializationFailure correctly (with cause)', () => {
        const details: DeserializationFailureDetails = { cause: 'bad format' };
        const encoded: EncodedTokenModuleRejectReason = {
            tokenId: dummyTokenId(),
            type: TokenRejectReasonType.DeserializationFailure,
            details: Cbor.encode(details),
        };
        const parsed = parseTokenModuleRejectReason(encoded) as DeserializationFailureRejectReason;
        expect(parsed.type).toBe(TokenRejectReasonType.DeserializationFailure);
        expect(parsed.details.cause).toBe('bad format');
    });

    it('parses unsupportedOperation correctly', () => {
        const details: UnsupportedOperationDetails = { index: 3, operationType: 'freeze', reason: 'disabled' };
        const encoded: EncodedTokenModuleRejectReason = {
            tokenId: dummyTokenId(),
            type: TokenRejectReasonType.UnsupportedOperation,
            details: Cbor.encode(details),
        };
        const parsed = parseTokenModuleRejectReason(encoded) as UnsupportedOperationRejectReason;
        expect(parsed.type).toBe(TokenRejectReasonType.UnsupportedOperation);
        expect(parsed.details.operationType).toBe('freeze');
        expect(parsed.details.reason).toBe('disabled');
    });

    it('parses operationNotPermitted correctly (with address + reason)', () => {
        const addrBytes = new Uint8Array(32).fill(0x22);
        const details: OperationNotPermittedDetails = {
            index: 5,
            address: TokenHolder.fromAccountAddress(AccountAddress.fromBuffer(addrBytes)),
            reason: 'paused',
        };
        const encoded: EncodedTokenModuleRejectReason = {
            tokenId: dummyTokenId(),
            type: TokenRejectReasonType.OperationNotPermitted,
            details: Cbor.encode(details),
        };
        const parsed = parseTokenModuleRejectReason(encoded) as OperationNotPermittedRejectReason;
        expect(parsed.type).toBe(TokenRejectReasonType.OperationNotPermitted);
        expect(parsed.details.index).toBe(5);
        expect(parsed.details.reason).toBe('paused');
    });

    it('parses mintWouldOverflow correctly', () => {
        const details: MintWouldOverflowDetails = {
            index: 7,
            requestedAmount: amt(1000),
            currentSupply: amt(9000),
            maxRepresentableAmount: amt(9999),
        };
        const encoded: EncodedTokenModuleRejectReason = {
            tokenId: dummyTokenId(),
            type: TokenRejectReasonType.MintWouldOverflow,
            details: Cbor.encode(details),
        };
        const parsed = parseTokenModuleRejectReason(encoded) as MintWouldOverflowRejectReason;
        expect(parsed.type).toBe(TokenRejectReasonType.MintWouldOverflow);
        expect(parsed.details.currentSupply.value).toBe(9000n);
    });

    it('returns unknown variant for unrecognized reject reason type', () => {
        const encoded: EncodedTokenModuleRejectReason = {
            tokenId: dummyTokenId(),
            type: 'someNewFutureReason',
            details: Cbor.encode({ extra: 1 }),
        };
        const parsed = parseTokenModuleRejectReason(encoded) as UnknownTokenRejectReason;
        expect(parsed.type).toBe('someNewFutureReason');
        expect(parsed.details).toEqual({ extra: 1 });
    });

    it('throws for invalid details: addressNotFound missing address', () => {
        const bad: EncodedTokenModuleRejectReason = {
            tokenId: dummyTokenId(),
            type: TokenRejectReasonType.AddressNotFound,
            details: Cbor.encode({ index: 0 }),
        };
        expect(() => parseTokenModuleRejectReason(bad)).toThrow(/address/);
    });

    it('throws for invalid details: tokenBalanceInsufficient wrong availableBalance type', () => {
        const bad: EncodedTokenModuleRejectReason = {
            tokenId: dummyTokenId(),
            type: TokenRejectReasonType.TokenBalanceInsufficient,
            details: Cbor.encode({ index: 0, availableBalance: 5, requiredBalance: amt(10) }),
        };
        expect(() => parseTokenModuleRejectReason(bad)).toThrow(/availableBalance/);
    });

    it('throws for invalid details: unsupportedOperation missing operationType', () => {
        const bad: EncodedTokenModuleRejectReason = {
            tokenId: dummyTokenId(),
            type: TokenRejectReasonType.UnsupportedOperation,
            details: Cbor.encode({ index: 2 }),
        };
        expect(() => parseTokenModuleRejectReason(bad)).toThrow(/operationType/);
    });

    it('throws for invalid details: operationNotPermitted wrong address type', () => {
        const bad: EncodedTokenModuleRejectReason = {
            tokenId: dummyTokenId(),
            type: TokenRejectReasonType.OperationNotPermitted,
            details: Cbor.encode({ index: 1, address: 'notAHolder' }),
        };
        expect(() => parseTokenModuleRejectReason(bad)).toThrow(/address/);
    });

    it('throws for invalid details: mintWouldOverflow missing requestedAmount', () => {
        const bad: EncodedTokenModuleRejectReason = {
            tokenId: dummyTokenId(),
            type: TokenRejectReasonType.MintWouldOverflow,
            details: Cbor.encode({ index: 1, currentSupply: amt(1), maxRepresentableAmount: amt(2) }),
        };
        expect(() => parseTokenModuleRejectReason(bad)).toThrow(/requestedAmount/);
    });
});
