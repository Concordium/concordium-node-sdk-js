import { TransactionEventTag } from '../../../src/index.ts';
import * as Cbor from '../../../src/plt/Cbor.js';
import * as TokenAmount from '../../../src/plt/TokenAmount.js';
import * as TokenHolder from '../../../src/plt/TokenHolder.js';
import * as TokenMetadataUrl from '../../../src/plt/TokenMetadataUrl.js';
import { TokenAddAllowListEvent, TokenId, TokenModuleEvent, TokenPauseEvent } from '../../../src/plt/index.ts';
import {
    TokenListUpdateEventDetails,
    TokenOperationType,
    TokenPauseEventDetails,
    parseModuleEvent,
} from '../../../src/pub/plt.js';
import { AccountAddress } from '../../../src/types/index.js';

function parseAs<T extends TokenModuleEvent>(type: TokenOperationType, details: Cbor.Type): T {
    return parseModuleEvent({
        tag: TransactionEventTag.TokenModuleEvent,
        type,
        details,
        tokenId: TokenId.fromString(''),
    })! as T;
}

describe('Cbor', () => {
    describe('TokenModuleState', () => {
        test('should encode and decode TokenModuleState correctly', () => {
            const accountAddress = AccountAddress.fromBase58('3XSLuJcXg6xEua6iBPnWacc3iWh93yEDMCqX8FbE3RDSbEnT9P');
            const tokenHolder = TokenHolder.fromAccountAddress(accountAddress);
            const metadataUrl = TokenMetadataUrl.fromString('https://example.com/metadata.json');

            const state = {
                name: 'Test Token',
                metadata: metadataUrl,
                governanceAccount: tokenHolder,
                allowList: true,
                denyList: false,
                mintable: true,
                burnable: true,
                customField: 'custom value',
            };

            const encoded = Cbor.encode(state);
            const decoded = Cbor.decode(encoded, 'TokenModuleState');

            expect(decoded.name).toBe(state.name);
            expect(decoded.metadata).toEqual(state.metadata);
            expect(decoded.governanceAccount).toEqual(state.governanceAccount);
            expect(decoded.allowList).toBe(state.allowList);
            expect(decoded.denyList).toBe(state.denyList);
            expect(decoded.mintable).toBe(state.mintable);
            expect(decoded.burnable).toBe(state.burnable);
            expect(decoded.customField).toBe(state.customField);
        });

        test('should throw error if TokenModuleState is missing required fields', () => {
            // Missing governanceAccount
            const invalidState1 = {
                name: 'Test Token',
                metadata: TokenMetadataUrl.fromString('https://example.com/metadata.json'),
                // governanceAccount is missing
            };
            const encoded1 = Cbor.encode(invalidState1);
            expect(() => Cbor.decode(encoded1, 'TokenModuleState')).toThrow(/missing or invalid governanceAccount/);

            // Missing name
            const accountAddress = AccountAddress.fromBase58('3XSLuJcXg6xEua6iBPnWacc3iWh93yEDMCqX8FbE3RDSbEnT9P');
            const invalidState2 = {
                // name is missing
                metadata: TokenMetadataUrl.fromString('https://example.com/metadata.json'),
                governanceAccount: TokenHolder.fromAccountAddress(accountAddress),
            };
            const encoded2 = Cbor.encode(invalidState2);
            expect(() => Cbor.decode(encoded2, 'TokenModuleState')).toThrow(/missing or invalid name/);

            // Missing metadata
            const invalidState3 = {
                name: 'Test Token',
                // metadata is missing
                governanceAccount: TokenHolder.fromAccountAddress(accountAddress),
            };
            const encoded3 = Cbor.encode(invalidState3);
            expect(() => Cbor.decode(encoded3, 'TokenModuleState')).toThrow(/missing metadataUrl/);
        });

        test('should throw error if TokenModuleState has invalid field types', () => {
            const accountAddress = AccountAddress.fromBase58('3XSLuJcXg6xEua6iBPnWacc3iWh93yEDMCqX8FbE3RDSbEnT9P');
            const tokenHolder = TokenHolder.fromAccountAddress(accountAddress);
            const metadataUrl = TokenMetadataUrl.fromString('https://example.com/metadata.json');

            // Invalid allowList type
            const invalidState = {
                name: 'Test Token',
                metadata: metadataUrl,
                governanceAccount: tokenHolder,
                allowList: 'yes', // Should be boolean
            };
            const encoded = Cbor.encode(invalidState);
            expect(() => Cbor.decode(encoded, 'TokenModuleState')).toThrow(/allowList must be a boolean/);
        });
    });

    describe('TokenInitializationParameters', () => {
        test('should encode and decode TokenInitializationParameters correctly', () => {
            const accountAddress = AccountAddress.fromBase58('3XSLuJcXg6xEua6iBPnWacc3iWh93yEDMCqX8FbE3RDSbEnT9P');
            const tokenHolder = TokenHolder.fromAccountAddress(accountAddress);
            const metadataUrl = TokenMetadataUrl.fromString('https://example.com/metadata.json');
            const initialSupply = TokenAmount.fromDecimal('1.002', 3);

            const params = {
                name: 'Test Token',
                metadata: metadataUrl,
                governanceAccount: tokenHolder,
                allowList: true,
                denyList: false,
                initialSupply,
                mintable: true,
                burnable: true,
                customField: 'custom value',
            };

            const encoded = Cbor.encode(params);
            const decoded = Cbor.decode(encoded, 'TokenInitializationParameters');

            expect(decoded.name).toBe(params.name);
            expect(decoded.metadata).toEqual(params.metadata);
            expect(decoded.governanceAccount).toEqual(params.governanceAccount);
            expect(decoded.allowList).toBe(params.allowList);
            expect(decoded.denyList).toBe(params.denyList);
            expect(decoded.initialSupply).toEqual(params.initialSupply);
            expect(decoded.mintable).toBe(params.mintable);
            expect(decoded.burnable).toBe(params.burnable);
        });

        test('should throw error if TokenInitializationParameters is missing required fields', () => {
            // Missing governanceAccount
            const invalidParams1 = {
                name: 'Test Token',
                metadata: TokenMetadataUrl.fromString('https://example.com/metadata.json'),
                // governanceAccount is missing
            };
            const encoded1 = Cbor.encode(invalidParams1);
            expect(() => Cbor.decode(encoded1, 'TokenInitializationParameters')).toThrow(
                /missing or invalid governanceAccount/
            );

            // Missing name
            const accountAddress = AccountAddress.fromBase58('3XSLuJcXg6xEua6iBPnWacc3iWh93yEDMCqX8FbE3RDSbEnT9P');
            const invalidParams2 = {
                // name is missing
                metadata: TokenMetadataUrl.fromString('https://example.com/metadata.json'),
                governanceAccount: TokenHolder.fromAccountAddress(accountAddress),
            };
            const encoded2 = Cbor.encode(invalidParams2);
            expect(() => Cbor.decode(encoded2, 'TokenInitializationParameters')).toThrow(/missing or invalid name/);

            // Missing metadata
            const invalidParams3 = {
                name: 'Test Token',
                // metadata is missing
                governanceAccount: TokenHolder.fromAccountAddress(accountAddress),
            };
            const encoded3 = Cbor.encode(invalidParams3);
            expect(() => Cbor.decode(encoded3, 'TokenInitializationParameters')).toThrow(/missing metadataUrl/);
        });

        test('should throw error if TokenInitializationParameters has invalid field types', () => {
            const accountAddress = AccountAddress.fromBase58('3XSLuJcXg6xEua6iBPnWacc3iWh93yEDMCqX8FbE3RDSbEnT9P');
            const tokenHolder = TokenHolder.fromAccountAddress(accountAddress);
            const metadataUrl = TokenMetadataUrl.fromString('https://example.com/metadata.json');

            // Invalid allowList type
            const invalidParams = {
                name: 'Test Token',
                metadata: metadataUrl,
                governanceAccount: tokenHolder,
                allowList: 'yes', // Should be boolean
            };
            const encoded = Cbor.encode(invalidParams);
            expect(() => Cbor.decode(encoded, 'TokenInitializationParameters')).toThrow(/allowList must be a boolean/);
        });
    });

    describe('TokenModuleAccountState', () => {
        test('should encode and decode TokenModuleAccountState correctly', () => {
            const state = {
                allowList: true,
                denyList: false,
                customField: 'custom value',
            };

            const encoded = Cbor.encode(state);
            const decoded = Cbor.decode(encoded, 'TokenModuleAccountState');

            expect(decoded.allowList).toBe(state.allowList);
            expect(decoded.denyList).toBe(state.denyList);
            expect(decoded.customField).toBe(state.customField);
        });

        test('should throw error if TokenModuleAccountState has invalid field types', () => {
            // Invalid allowList type
            const invalidState = {
                allowList: 'yes', // Should be boolean
                denyList: false,
            };
            const encoded = Cbor.encode(invalidState);
            expect(() => Cbor.decode(encoded, 'TokenModuleAccountState')).toThrow(/allowList must be a boolean/);

            // Invalid denyList type
            const invalidState2 = {
                allowList: true,
                denyList: 'no', // Should be boolean
            };
            const encoded2 = Cbor.encode(invalidState2);
            expect(() => Cbor.decode(encoded2, 'TokenModuleAccountState')).toThrow(/denyList must be a boolean/);
        });
    });

    describe('TokenListUpdateEventDetails', () => {
        test('should encode and decode TokenEventDetails correctly', () => {
            const accountAddress = AccountAddress.fromBase58('3XSLuJcXg6xEua6iBPnWacc3iWh93yEDMCqX8FbE3RDSbEnT9P');
            const tokenHolder = TokenHolder.fromAccountAddress(accountAddress);

            const details: TokenListUpdateEventDetails = {
                target: tokenHolder,
            };

            const encoded = Cbor.encode(details);
            const decoded = parseAs<TokenAddAllowListEvent>(TokenOperationType.AddAllowList, encoded);
            expect(decoded.details).toEqual(details);
        });

        test('should throw error if TokenEventDetails is missing required fields', () => {
            // Missing target
            const invalidDetails = {
                // target is missing
                additionalInfo: 'Some extra information',
            };
            const encoded = Cbor.encode(invalidDetails);
            expect(() => parseAs<TokenAddAllowListEvent>(TokenOperationType.AddAllowList, encoded)).toThrow(
                /Expected 'target' to be a TokenHolder/
            );
        });

        test('should throw error if TokenEventDetails has invalid target type', () => {
            // Invalid target type
            const invalidDetails = {
                target: 'not-a-token-holder',
                additionalInfo: 'Some extra information',
            };
            const encoded = Cbor.encode(invalidDetails);
            expect(() => parseAs<TokenAddAllowListEvent>(TokenOperationType.AddAllowList, encoded)).toThrow(
                /Expected 'target' to be a TokenHolder/
            );
        });
    });

    describe('TokenPauseEventDetails', () => {
        test('should encode and decode TokenEventDetails correctly', () => {
            const details: TokenPauseEventDetails = {};
            const encoded = Cbor.encode(details);
            const decoded = parseAs<TokenPauseEvent>(TokenOperationType.Pause, encoded);
            expect(decoded.details).toEqual(details);
        });

        test('should throw error if TokenEventDetails has invalid target type', () => {
            // Invalid target type
            const invalidDetails = 'invalid';
            const encoded = Cbor.encode(invalidDetails);
            expect(() => parseAs<TokenPauseEvent>(TokenOperationType.Pause, encoded)).toThrow(
                /Invalid event details: "invalid". Expected an object./
            );
        });
    });
});
