import { cborDecode } from '../../../src/index.ts';
import * as Cbor from '../../../src/plt/Cbor.js';
import * as CborMemo from '../../../src/plt/CborMemo.js';
import * as TokenAmount from '../../../src/plt/TokenAmount.js';
import * as TokenHolder from '../../../src/plt/TokenHolder.js';
import * as TokenMetadataUrl from '../../../src/plt/TokenMetadataUrl.js';
import { TokenId } from '../../../src/plt/index.ts';
import {
    TokenListUpdateEventDetails,
    TokenOperationType,
    TokenPauseEventDetails,
    createTokenUpdatePayload,
} from '../../../src/plt/module.js';
import { AccountAddress } from '../../../src/types/index.js';

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
            const decoded = Cbor.decode(encoded, 'TokenListUpdateEventDetails');
            expect(decoded.target).toEqual(details.target);
        });

        test('should throw error if TokenEventDetails is missing required fields', () => {
            // Missing target
            const invalidDetails = {
                // target is missing
                additionalInfo: 'Some extra information',
            };
            const encoded = Cbor.encode(invalidDetails);
            expect(() => Cbor.decode(encoded, 'TokenListUpdateEventDetails')).toThrow(
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
            expect(() => Cbor.decode(encoded, 'TokenListUpdateEventDetails')).toThrow(
                /Expected 'target' to be a TokenHolder/
            );
        });
    });

    describe('TokenPauseEventDetails', () => {
        test('should encode and decode TokenEventDetails correctly', () => {
            const details: TokenPauseEventDetails = {};
            const encoded = Cbor.encode(details);
            const decoded = Cbor.decode(encoded, 'TokenPauseEventDetails');
            expect(decoded).toEqual(details);
        });

        test('should throw error if TokenEventDetails has invalid target type', () => {
            // Invalid target type
            const invalidDetails = 'invalid';
            const encoded = Cbor.encode(invalidDetails);
            expect(() => Cbor.decode(encoded, 'TokenPauseEventDetails')).toThrow(
                /Invalid event details: "invalid". Expected an object./
            );
        });
    });

    describe('TokenOperations', () => {
        test('empty operations encodes correctly', () => {
            const encoded = createTokenUpdatePayload(TokenId.fromString('TEST'), []).operations;
            expect(encoded.toString()).toBe('80');
        });
        test('empty operations decodes correctly', () => {
            const decoded = Cbor.decode(Cbor.fromHexString('80'));
            expect(decoded).toEqual([]);
        });
        test('empty operations (indefinite length) decodes correctly', () => {
            const decoded = Cbor.decode(Cbor.fromHexString('9fff'));
            expect(decoded).toEqual([]);
        });
        test('pause operation encodes correctly', () => {
            const encoded = createTokenUpdatePayload(TokenId.fromString('TEST'), {
                [TokenOperationType.Pause]: {},
            }).operations;
            expect(encoded.toString()).toBe('81a1657061757365a0');
        });
        test('pause operation decodes correctly', () => {
            const decoded = Cbor.decode(Cbor.fromHexString('81a1657061757365a0'));
            expect(decoded).toEqual([{ [TokenOperationType.Pause]: {} }]);
        });
        test('pause operation (indefinite length) decodes correctly', () => {
            const decoded = Cbor.decode(Cbor.fromHexString('9fa1657061757365a0ff'));
            expect(decoded).toEqual([{ [TokenOperationType.Pause]: {} }]);
        });
        test('pause operation (indefinite map) decodes correctly', () => {
            const decoded = Cbor.decode(Cbor.fromHexString('81a1657061757365bfff'));
            expect(decoded).toEqual([{ [TokenOperationType.Pause]: {} }]);
        });
        test('pause operation ([reject] indefinite tag string (1 segment)) decodes correctly', () => {
            // Note: this is rejected by the Haskell Token Module implementation.
            const decoded = Cbor.decode(Cbor.fromHexString('81a17f657061757365ffa0'));
            expect(decoded).toEqual([{ [TokenOperationType.Pause]: {} }]);
        });
        test('pause operation ([reject] indefinite tag string (2 segments)) decodes correctly', () => {
            // Note: this is rejected by the Haskell Token Module implementation.
            const decoded = Cbor.decode(Cbor.fromHexString('81a17f63706175627365ffa0'));
            expect(decoded).toEqual([{ [TokenOperationType.Pause]: {} }]);
        });
        test('pause operation ([reject] null body) decodes correctly', () => {
            // Note: this is rejected by the Haskell Token Module implementation, as the
            // null body is not a valid map.
            const decoded = Cbor.decode(Cbor.fromHexString('81a1657061757365f6'));
            expect(decoded).toEqual([{ [TokenOperationType.Pause]: null }]);
        });
        test('pause operation ([reject] non-empty body) decodes correctly', () => {
            // Note: this is rejected by the Haskell Token Module implementation, as the
            // body must be empty for the Pause operation.
            const decoded = Cbor.decode(Cbor.fromHexString('81a1657061757365a1657061757365a0'));
            expect(decoded).toEqual([{ [TokenOperationType.Pause]: { pause: {} } }]);
        });
        test('unpause operation encodes correctly', () => {
            const encoded = createTokenUpdatePayload(TokenId.fromString('TEST'), {
                [TokenOperationType.Unpause]: {},
            }).operations;
            expect(encoded.toString()).toBe('81a167756e7061757365a0');
        });
        test('unpause operation decodes correctly', () => {
            const decoded = Cbor.decode(Cbor.fromHexString('81a167756e7061757365a0'));
            expect(decoded).toEqual([{ [TokenOperationType.Unpause]: {} }]);
        });
        test('unpause operation (indefinite lengths and maps) decodes correctly', () => {
            const decoded = Cbor.decode(Cbor.fromHexString('9fbf67756e7061757365bfffffff'));
            expect(decoded).toEqual([{ [TokenOperationType.Unpause]: {} }]);
        });
        test('unpause operation ([reject] indefinite everything) decodes correctly', () => {
            // Note: this is rejected by the Haskell Token Module implementation, due to the
            // indefinite tag string.
            const decoded = Cbor.decode(Cbor.fromHexString('9fa17f6175636e70616063757365ffbfffff'));
            expect(decoded).toEqual([{ [TokenOperationType.Unpause]: {} }]);
        });
        const accountAddress = AccountAddress.fromBase58('4BH5qnFPDfaD3MxnDzfhnu1jAHoBWXnq2i57T6G1eZn1kC194e');
        const tokenHolder = TokenHolder.fromAccountAddress(accountAddress);
        test('addAllowList operation encodes correctly', () => {
            const encoded = createTokenUpdatePayload(TokenId.fromString('TEST'), {
                [TokenOperationType.AddAllowList]: { target: tokenHolder },
            }).operations;
            expect(encoded.toString()).toBe(
                '81a16c616464416c6c6f774c697374a166746172676574d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
            );
        });
        test('addAllowList operation decodes correctly', () => {
            const decoded = Cbor.decode(
                Cbor.fromHexString(
                    '81a16c616464416c6c6f774c697374a166746172676574d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                )
            );
            expect(decoded).toEqual([{ [TokenOperationType.AddAllowList]: { target: tokenHolder } }]);
        });
        test('addAllowList operation ([reject] indefinite account address) decodes correctly', () => {
            // Note: this is rejected by the Haskell Token Module implementation, due to the
            // indefinite length byte string in the account address.
            const decoded = Cbor.decode(
                Cbor.fromHexString(
                    '81a16c616464416c6c6f774c697374a166746172676574d99d73a201d99d71a101190397035f41a24040581f6c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15ff'
                )
            );
            expect(decoded).toEqual([{ [TokenOperationType.AddAllowList]: { target: tokenHolder } }]);
        });
        test('addAllowList operation (oversize tag) decodes correctly', () => {
            const decoded = Cbor.decode(
                Cbor.fromHexString(
                    '81a16c616464416c6c6f774c697374a166746172676574da00009d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                )
            );
            expect(decoded).toEqual([{ [TokenOperationType.AddAllowList]: { target: tokenHolder } }]);
        });
        test('addAllowList operation (more oversize tags) decodes correctly', () => {
            const decoded = Cbor.decode(
                Cbor.fromHexString(
                    '81a16c616464416c6c6f774c697374a166746172676574db0000000000009d73a201db0000000000009d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                )
            );
            expect(decoded).toEqual([{ [TokenOperationType.AddAllowList]: { target: tokenHolder } }]);
        });
        test('addAllowList operation (oversize int) decodes correctly', () => {
            const decoded = Cbor.decode(
                Cbor.fromHexString(
                    '81a16c616464416c6c6f774c697374a166746172676574d99d73a201d99d71a1011a00000397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                )
            );
            expect(decoded).toEqual([{ [TokenOperationType.AddAllowList]: { target: tokenHolder } }]);
        });
        test('addAllowList operation (more oversize int) decodes correctly', () => {
            const decoded = Cbor.decode(
                Cbor.fromHexString(
                    '81a16c616464416c6c6f774c697374a166746172676574d99d73a201d99d71a1011b0000000000000397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                )
            );
            expect(decoded).toEqual([{ [TokenOperationType.AddAllowList]: { target: tokenHolder } }]);
        });
        test('addAllowList operation (oversize int key) decodes correctly', () => {
            const decoded = Cbor.decode(
                Cbor.fromHexString(
                    '81a16c616464416c6c6f774c697374a166746172676574d99d73a21801d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                )
            );
            expect(decoded).toEqual([{ [TokenOperationType.AddAllowList]: { target: tokenHolder } }]);
        });
        test('addAllowList operation (oversize int keys) decodes correctly', () => {
            const decoded = Cbor.decode(
                Cbor.fromHexString(
                    '81a16c616464416c6c6f774c697374a166746172676574d99d73a21b0000000000000001d99d71a11a000000011903971900035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                )
            );
            expect(decoded).toEqual([{ [TokenOperationType.AddAllowList]: { target: tokenHolder } }]);
        });
        test('addAllowList operation (reordered keys) decodes correctly', () => {
            const decoded = Cbor.decode(
                Cbor.fromHexString(
                    '81a16c616464416c6c6f774c697374a166746172676574d99d73a2035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b1501d99d71a101190397'
                )
            );
            expect(decoded).toEqual([{ [TokenOperationType.AddAllowList]: { target: tokenHolder } }]);
        });
        test('addAllowList operation ([reject] big int for int) fails decoding', () => {
            // Note: this is rejected by the Haskell Token Module implementation, due to the
            // big int used for the coininfo network identifier.
            expect(() =>
                Cbor.decode(
                    Cbor.fromHexString(
                        '81a16c616464416c6c6f774c697374a166746172676574d99d73a201d99d71a101c2480000000000000397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                    )
                )
            ).toThrow(/coin info does not contain Concordium network identifier/);
        });
        test('addAllowList operation ([reject] big int for int 2) fails decoding', () => {
            // Note: this is rejected by the Haskell Token Module implementation, due to the
            // big int used for the coininfo network identifier.
            expect(() =>
                Cbor.decode(
                    Cbor.fromHexString(
                        '81a16c616464416c6c6f774c697374a166746172676574d99d73a201d99d71a101c2420397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                    )
                )
            ).toThrow(/coin info does not contain Concordium network identifier/);
        });
        test('addAllowList operation ([reject] half-precision float for int) decodes correctly', () => {
            // Note: this is rejected by the Haskell Token Module implementation, due to the
            // half-precision float used for the coininfo network identifier.
            const decoded = Cbor.decode(
                Cbor.fromHexString(
                    '81a16c616464416c6c6f774c697374a166746172676574d99d73a201d99d71a101f9632e035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                )
            );
            expect(decoded).toEqual([{ [TokenOperationType.AddAllowList]: { target: tokenHolder } }]);
        });
        test('addAllowList operation ([reject] single-precision float for int) decodes correctly', () => {
            // Note: this is rejected by the Haskell Token Module implementation, due to the
            // single-precision float used for the coininfo network identifier.
            const decoded = Cbor.decode(
                Cbor.fromHexString(
                    '81a16c616464416c6c6f774c697374a166746172676574d99d73a201d99d71a101fa4465c000035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                )
            );
            expect(decoded).toEqual([{ [TokenOperationType.AddAllowList]: { target: tokenHolder } }]);
        });
        test('addAllowList operation ([reject] double-precision float for int) decodes correctly', () => {
            // Note: this is rejected by the Haskell Token Module implementation, due to the
            // double-precision float used for the coininfo network identifier.
            const decoded = Cbor.decode(
                Cbor.fromHexString(
                    '81a16c616464416c6c6f774c697374a166746172676574d99d73a201d99d71a101fb408cb80000000000035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                )
            );
            expect(decoded).toEqual([{ [TokenOperationType.AddAllowList]: { target: tokenHolder } }]);
        });
        test('addAllowList operation ([reject] half-precision float for int tags) decodes correctly', () => {
            // Note: this is rejected by the Haskell Token Module implementation, due to the
            // half-precision float used for the int tag.
            const decoded = Cbor.decode(
                Cbor.fromHexString(
                    '81a16c616464416c6c6f774c697374a166746172676574d99d73a201d99d71a1f93c00190397f942005820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                )
            );
            expect(decoded).toEqual([{ [TokenOperationType.AddAllowList]: { target: tokenHolder } }]);
        });
        test('addAllowList operation ([reject] single-precision float for int tags) decodes correctly', () => {
            // Note: this is rejected by the Haskell Token Module implementation, due to the
            // single-precision float used for the int tag.
            const decoded = Cbor.decode(
                Cbor.fromHexString(
                    '81a16c616464416c6c6f774c697374a166746172676574d99d73a2fa3f800000d99d71a1fa3f800000190397fa404000005820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                )
            );
            expect(decoded).toEqual([{ [TokenOperationType.AddAllowList]: { target: tokenHolder } }]);
        });
        test('addAllowList operation ([reject] double-precision float for int tags) decodes correctly', () => {
            // Note: this is rejected by the Haskell Token Module implementation, due to the
            // double-precision float used for the int tag.
            const decoded = Cbor.decode(
                Cbor.fromHexString(
                    '81a16c616464416c6c6f774c697374a166746172676574d99d73a2fb3ff0000000000000d99d71a1fb3ff0000000000000190397fb40080000000000005820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                )
            );
            expect(decoded).toEqual([{ [TokenOperationType.AddAllowList]: { target: tokenHolder } }]);
        });
        const tokenHolderNoCoinInfo = TokenHolder.fromAccountAddressNoCoinInfo(accountAddress);
        test('removeAllowList operation encodes correctly', () => {
            const encoded = createTokenUpdatePayload(TokenId.fromString('TEST'), {
                [TokenOperationType.RemoveAllowList]: { target: tokenHolderNoCoinInfo },
            }).operations;
            expect(encoded.toString()).toBe(
                '81a16f72656d6f7665416c6c6f774c697374a166746172676574d99d73a1035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
            );
        });
        test('removeAllowList operation decodes correctly', () => {
            const decoded = Cbor.decode(
                Cbor.fromHexString(
                    '81a16f72656d6f7665416c6c6f774c697374a166746172676574d99d73a1035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                )
            );
            expect(decoded).toEqual([{ [TokenOperationType.RemoveAllowList]: { target: tokenHolderNoCoinInfo } }]);
        });
        test('removeAllowList operation (indefinite lengths and oversized ints) decodes correctly', () => {
            const decoded = Cbor.decode(
                Cbor.fromHexString(
                    '81a16f72656d6f7665416c6c6f774c697374a166746172676574d99d73a1035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                )
            );
            expect(decoded).toEqual([{ [TokenOperationType.RemoveAllowList]: { target: tokenHolderNoCoinInfo } }]);
        });
        test('addDenyList operation encodes correctly', () => {
            const encoded = createTokenUpdatePayload(TokenId.fromString('TEST'), {
                [TokenOperationType.AddDenyList]: { target: tokenHolder },
            }).operations;
            expect(encoded.toString()).toBe(
                '81a16b61646444656e794c697374a166746172676574d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
            );
        });
        test('addDenyList operation decodes correctly', () => {
            const decoded = Cbor.decode(
                Cbor.fromHexString(
                    '81a16b61646444656e794c697374a166746172676574d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                )
            );
            expect(decoded).toEqual([{ [TokenOperationType.AddDenyList]: { target: tokenHolder } }]);
        });
        test('addDenyList operation ([reject] coininfo includes network) decodes correctly', () => {
            // Note: this is rejected by the Haskell Token Module implementation, due to the
            // coininfo including a network identifier.
            const decoded = Cbor.decode(
                Cbor.fromHexString(
                    '81a16b61646444656e794c697374a166746172676574d99d73a201d99d71a2011903970200035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                )
            );
            expect(decoded).toEqual([{ [TokenOperationType.AddDenyList]: { target: tokenHolder } }]);
        });
        test('addDenyList operation ([reject] coininfo with bad coin type) fails decoding', () => {
            // Note: this is rejected by the Haskell Token Module implementation, due to the
            // coininfo including a bad coin type (60 instead of 919).
            expect(() =>
                Cbor.decode(
                    Cbor.fromHexString(
                        '81a16b61646444656e794c697374a166746172676574d99d73a201d99d71a101183c035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                    )
                )
            ).toThrow(/coin info does not contain Concordium network identifier/);
        });
        test('removeDenyList operation encodes correctly', () => {
            const encoded = createTokenUpdatePayload(TokenId.fromString('TEST'), {
                [TokenOperationType.RemoveDenyList]: { target: tokenHolder },
            }).operations;
            expect(encoded.toString()).toBe(
                '81a16e72656d6f766544656e794c697374a166746172676574d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
            );
        });
        test('removeDenyList operation decodes correctly', () => {
            const decoded = Cbor.decode(
                Cbor.fromHexString(
                    '81a16e72656d6f766544656e794c697374a166746172676574d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                )
            );
            expect(decoded).toEqual([{ [TokenOperationType.RemoveDenyList]: { target: tokenHolder } }]);
        });
        test('removeDenyList operation ([reject] RemoveDenyList) decodes correctly', () => {
            // Note: this is rejected by the Haskell token module implementation, due to
            // the incorrect case of the operation name. Here, it decodes successfully,
            // but the value differs from that of the correct 'removeDenyList' operation.
            const decoded = Cbor.decode(
                Cbor.fromHexString(
                    '81a16e52656d6f766544656e794c697374a166746172676574d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                )
            );
            expect(decoded).toEqual([{ RemoveDenyList: { target: tokenHolder } }]);
        });
        test('removeDenyList operation ([reject] remove-deny-list) decodes correctly', () => {
            // Note: this is rejected by the Haskell token module implementation, due to
            // the incorrect case of the operation name. Here, it decodes successfully,
            // but the value differs from that of the correct 'removeDenyList' operation.
            const decoded = Cbor.decode(
                Cbor.fromHexString(
                    '81a17072656d6f76652d64656e792d6c697374a166746172676574d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                )
            );
            expect(decoded).toEqual([{ 'remove-deny-list': { target: tokenHolder } }]);
        });
        test('removeDenyList operation ([reject] Target) decodes correctly', () => {
            // Note: this is rejected by the Haskell token module implementation, due to
            // the incorrect case of the 'target' field. Here, it decodes successfully,
            // but the value differs from that of the correct 'removeDenyList' operation.
            const decoded = Cbor.decode(
                Cbor.fromHexString(
                    '81a16e72656d6f766544656e794c697374a166546172676574d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                )
            );
            expect(decoded).toEqual([{ [TokenOperationType.RemoveDenyList]: { Target: tokenHolder } }]);
        });
        test('removeDenyList operation ([reject] no target) decodes correctly', () => {
            // Note: this is rejected by the Haskell token module implementation, due to
            // the empty body of the 'removeDenyList' operation.
            const decoded = Cbor.decode(Cbor.fromHexString('81a16e72656d6f766544656e794c697374a0'));
            expect(decoded).toEqual([{ [TokenOperationType.RemoveDenyList]: {} }]);
        });
        test("removeDenyList operation ([reject] unexpected 'list') decodes correctly", () => {
            // Note: this is rejected by the Haskell token module implementation, due to
            // the additional 'list' field in the body of the 'removeDenyList' operation.
            const decoded = Cbor.decode(
                Cbor.fromHexString(
                    '81a16e72656d6f766544656e794c697374a2646c6973740066746172676574d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                )
            );
            expect(decoded).toEqual([{ [TokenOperationType.RemoveDenyList]: { list: 0, target: tokenHolder } }]);
        });
        test('removeDenyList operation ([reject] duplicate target) decodes', () => {
            // Note: this is rejected by the Haskell Token Module implementation, due to
            // the duplicate 'target' field in the body of the 'removeDenyList' operation.
            const decoded = Cbor.decode(
                Cbor.fromHexString(
                    '81a16e72656d6f766544656e794c697374a266746172676574d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b1566746172676574d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                )
            );
            expect(decoded).toEqual([{ [TokenOperationType.RemoveDenyList]: { target: tokenHolder } }]);
        });
        test('transfer operation encodes correctly', () => {
            const encoded = createTokenUpdatePayload(TokenId.fromString('TEST'), {
                [TokenOperationType.Transfer]: { recipient: tokenHolder, amount: TokenAmount.fromDecimal('1.00', 2) },
            }).operations;
            expect(encoded.toString()).toBe(
                '81a1687472616e73666572a266616d6f756e74c48221186469726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
            );
        });
        test('transfer operation decodes correctly', () => {
            const decoded = Cbor.decode(
                Cbor.fromHexString(
                    '81a1687472616e73666572a266616d6f756e74c48221186469726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                )
            );
            expect(decoded).toEqual([
                {
                    [TokenOperationType.Transfer]: {
                        recipient: tokenHolder,
                        amount: TokenAmount.fromDecimal('1.00', 2),
                    },
                },
            ]);
        });
        test('transfer operation (max amount) encodes correctly', () => {
            const encoded = createTokenUpdatePayload(TokenId.fromString('TEST'), {
                [TokenOperationType.Transfer]: {
                    recipient: tokenHolder,
                    amount: TokenAmount.create(BigInt('18446744073709551615'), 0),
                },
            }).operations;
            expect(encoded.toString()).toBe(
                '81a1687472616e73666572a266616d6f756e74c482001bffffffffffffffff69726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
            );
        });
        test('transfer operation (max amount) decodes correctly', () => {
            const decoded = Cbor.decode(
                Cbor.fromHexString(
                    '81a1687472616e73666572a266616d6f756e74c482001bffffffffffffffff69726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                )
            );
            expect(decoded).toEqual([
                {
                    [TokenOperationType.Transfer]: {
                        recipient: tokenHolder,
                        amount: TokenAmount.create(BigInt('18446744073709551615'), 0),
                    },
                },
            ]);
        });
        test('transfer operation (max decimals) encodes correctly', () => {
            const encoded = createTokenUpdatePayload(TokenId.fromString('TEST'), {
                [TokenOperationType.Transfer]: {
                    recipient: tokenHolder,
                    amount: TokenAmount.create(BigInt('18446744073709551615'), 255),
                },
            }).operations;
            expect(encoded.toString()).toBe(
                '81a1687472616e73666572a266616d6f756e74c48238fe1bffffffffffffffff69726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
            );
        });
        test('transfer operation (max decimals) decodes correctly', () => {
            const decoded = Cbor.decode(
                Cbor.fromHexString(
                    '81a1687472616e73666572a266616d6f756e74c48238fe1bffffffffffffffff69726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15'
                )
            );
            expect(decoded).toEqual([
                {
                    [TokenOperationType.Transfer]: {
                        recipient: tokenHolder,
                        amount: TokenAmount.create(BigInt('18446744073709551615'), 255),
                    },
                },
            ]);
        });
        test('transfer operation ([reject] oversize amount) fails to decode', () => {
            const hex =
                '81a1687472616e73666572a266616d6f756e74c48238fec24901000000000000000069726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15';
            expect(() => Cbor.decode(Cbor.fromHexString(hex))).toThrow(
                /Token amounts cannot be larger than 18446744073709551615/
            );
        });
        test('transfer operation ([reject] oversize decimals) fails to decode', () => {
            const hex =
                '81a1687472616e73666572a266616d6f756e74c48238ff1bffffffffffffffff69726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15';
            expect(() => Cbor.decode(Cbor.fromHexString(hex))).toThrow(/exponent is too small/);
        });
        test('transfer operation ([reject] positive amount exponent) fails to decode', () => {
            const hex =
                '81a1687472616e73666572a266616d6f756e74c482010169726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15';
            expect(() => Cbor.decode(Cbor.fromHexString(hex))).toThrow(/exponent cannot have a positive amount/);
        });
        test('transfer operation ([reject] negative amount) fails to decode', () => {
            const hex =
                '81a1687472616e73666572a266616d6f756e74c482002069726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15';
            expect(() => Cbor.decode(Cbor.fromHexString(hex))).toThrow(/decimals cannot be negative/);
        });
        test('transfer operation ([non-canonical] bigint amount) decodes correctly', () => {
            const hex =
                '81a1687472616e73666572a266616d6f756e74c48221c248000000000000006469726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15';
            const decoded = Cbor.decode(Cbor.fromHexString(hex));
            expect(decoded).toEqual([
                {
                    [TokenOperationType.Transfer]: {
                        recipient: tokenHolder,
                        amount: TokenAmount.create(BigInt(100), 2),
                    },
                },
            ]);
        });
        test('transfer operation ([non-canonical] oversize int amount 1) decodes correctly', () => {
            const hex =
                '81a1687472616e73666572a266616d6f756e74c4822119006469726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15';
            const decoded = Cbor.decode(Cbor.fromHexString(hex));
            expect(decoded).toEqual([
                {
                    [TokenOperationType.Transfer]: {
                        recipient: tokenHolder,
                        amount: TokenAmount.create(BigInt(100), 2),
                    },
                },
            ]);
        });
        test('transfer operation ([non-canonical] oversize int amount 2) decodes correctly', () => {
            const hex =
                '81a1687472616e73666572a266616d6f756e74c482211a0000006469726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15';
            const decoded = Cbor.decode(Cbor.fromHexString(hex));
            expect(decoded).toEqual([
                {
                    [TokenOperationType.Transfer]: {
                        recipient: tokenHolder,
                        amount: TokenAmount.create(BigInt(100), 2),
                    },
                },
            ]);
        });
        test('transfer operation ([non-canonical] oversize int amount 3) decodes correctly', () => {
            const hex =
                '81a1687472616e73666572a266616d6f756e74c482211b000000000000006469726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15';
            const decoded = Cbor.decode(Cbor.fromHexString(hex));
            expect(decoded).toEqual([
                {
                    [TokenOperationType.Transfer]: {
                        recipient: tokenHolder,
                        amount: TokenAmount.create(BigInt(100), 2),
                    },
                },
            ]);
        });
        test('transfer operation ([non-canonical] oversize int exponent 1) decodes correctly', () => {
            const hex =
                '81a1687472616e73666572a266616d6f756e74c482390001186469726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15';
            const decoded = Cbor.decode(Cbor.fromHexString(hex));
            expect(decoded).toEqual([
                {
                    [TokenOperationType.Transfer]: {
                        recipient: tokenHolder,
                        amount: TokenAmount.create(BigInt(100), 2),
                    },
                },
            ]);
        });
        test('transfer operation ([non-canonical] oversize int exponent 2) decodes correctly', () => {
            const hex =
                '81a1687472616e73666572a266616d6f756e74c4823a00000001186469726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15';
            const decoded = Cbor.decode(Cbor.fromHexString(hex));
            expect(decoded).toEqual([
                {
                    [TokenOperationType.Transfer]: {
                        recipient: tokenHolder,
                        amount: TokenAmount.create(BigInt(100), 2),
                    },
                },
            ]);
        });
        test('transfer operation ([non-canonical] oversize int exponent 3) decodes correctly', () => {
            const hex =
                '81a1687472616e73666572a266616d6f756e74c4823b0000000000000001186469726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15';
            const decoded = Cbor.decode(Cbor.fromHexString(hex));
            expect(decoded).toEqual([
                {
                    [TokenOperationType.Transfer]: {
                        recipient: tokenHolder,
                        amount: TokenAmount.create(BigInt(100), 2),
                    },
                },
            ]);
        });
        test('transfer operation ([reject] bigint exponent 1) fails to decode', () => {
            const hex =
                '81a1687472616e73666572a266616d6f756e74c482c34101186469726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15';
            expect(() => Cbor.decode(Cbor.fromHexString(hex))).toThrow(/exponent must be a number/);
        });
        test('transfer operation ([reject] bigint exponent 2) fails to decode', () => {
            const hex =
                '81a1687472616e73666572a266616d6f756e74c482c349000000000000000001186469726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15';
            expect(() => Cbor.decode(Cbor.fromHexString(hex))).toThrow(/exponent must be a number/);
        });
        test('transfer operation ([reject] floating point amount 1) decodes correctly', () => {
            // Note, this is rejected by the Haskell implementation of the token module, due
            // to representing the amount as a floating point number.
            const hex =
                '81a1687472616e73666572a266616d6f756e74c48221f9564069726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15';
            const decoded = Cbor.decode(Cbor.fromHexString(hex));
            expect(decoded).toEqual([
                {
                    [TokenOperationType.Transfer]: {
                        recipient: tokenHolder,
                        amount: TokenAmount.create(BigInt(100), 2),
                    },
                },
            ]);
        });
        test('transfer operation ([reject] floating point amount 2) decodes correctly', () => {
            // Note, this is rejected by the Haskell implementation of the token module, due
            // to representing the amount as a floating point number.
            const hex =
                '81a1687472616e73666572a266616d6f756e74c48221fa42c8000069726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15';
            const decoded = Cbor.decode(Cbor.fromHexString(hex));
            expect(decoded).toEqual([
                {
                    [TokenOperationType.Transfer]: {
                        recipient: tokenHolder,
                        amount: TokenAmount.create(BigInt(100), 2),
                    },
                },
            ]);
        });
        test('transfer operation ([reject] floating point amount 3) decodes correctly', () => {
            // Note, this is rejected by the Haskell implementation of the token module, due
            // to representing the amount as a floating point number.
            const hex =
                '81a1687472616e73666572a266616d6f756e74c48221fb405900000000000069726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15';
            const decoded = Cbor.decode(Cbor.fromHexString(hex));
            expect(decoded).toEqual([
                {
                    [TokenOperationType.Transfer]: {
                        recipient: tokenHolder,
                        amount: TokenAmount.create(BigInt(100), 2),
                    },
                },
            ]);
        });
        test('transfer operation ([reject] floating point exponent 1) decodes correctly', () => {
            // Note, this is rejected by the Haskell implementation of the token module, due
            // to representing the amount exponent as a floating point number.
            const hex =
                '81a1687472616e73666572a266616d6f756e74c482f9c000186469726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15';
            const decoded = Cbor.decode(Cbor.fromHexString(hex));
            expect(decoded).toEqual([
                {
                    [TokenOperationType.Transfer]: {
                        recipient: tokenHolder,
                        amount: TokenAmount.create(BigInt(100), 2),
                    },
                },
            ]);
        });

        test('transfer operation ([reject] floating point exponent 2) decodes correctly', () => {
            // Note, this is rejected by the Haskell implementation of the token module, due
            // to representing the amount exponent as a floating point number.
            const hex =
                '81a1687472616e73666572a266616d6f756e74c482fac0000000186469726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15';
            const decoded = Cbor.decode(Cbor.fromHexString(hex));
            expect(decoded).toEqual([
                {
                    [TokenOperationType.Transfer]: {
                        recipient: tokenHolder,
                        amount: TokenAmount.create(BigInt(100), 2),
                    },
                },
            ]);
        });
        test('transfer operation ([reject] floating point exponent 3) decodes correctly', () => {
            // Note, this is rejected by the Haskell implementation of the token module, due
            // to representing the amount exponent as a floating point number.
            const hex =
                '81a1687472616e73666572a266616d6f756e74c482fbc000000000000000186469726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15';
            const decoded = Cbor.decode(Cbor.fromHexString(hex));
            expect(decoded).toEqual([
                {
                    [TokenOperationType.Transfer]: {
                        recipient: tokenHolder,
                        amount: TokenAmount.create(BigInt(100), 2),
                    },
                },
            ]);
        });
        test('transfer operation (memo) decodes correctly', () => {
            const hex =
                '81a1687472616e73666572a3646d656d6f590100000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfeff66616d6f756e74c48221186469726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15';
            const decoded = Cbor.decode(Cbor.fromHexString(hex));

            expect(decoded).toEqual([
                {
                    [TokenOperationType.Transfer]: {
                        memo: Uint8Array.from([
                            0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e,
                            0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d,
                            0x1e, 0x1f, 0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x2b, 0x2c,
                            0x2d, 0x2e, 0x2f, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x3b,
                            0x3c, 0x3d, 0x3e, 0x3f, 0x40, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a,
                            0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50, 0x51, 0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
                            0x5a, 0x5b, 0x5c, 0x5d, 0x5e, 0x5f, 0x60, 0x61, 0x62, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68,
                            0x69, 0x6a, 0x6b, 0x6c, 0x6d, 0x6e, 0x6f, 0x70, 0x71, 0x72, 0x73, 0x74, 0x75, 0x76, 0x77,
                            0x78, 0x79, 0x7a, 0x7b, 0x7c, 0x7d, 0x7e, 0x7f, 0x80, 0x81, 0x82, 0x83, 0x84, 0x85, 0x86,
                            0x87, 0x88, 0x89, 0x8a, 0x8b, 0x8c, 0x8d, 0x8e, 0x8f, 0x90, 0x91, 0x92, 0x93, 0x94, 0x95,
                            0x96, 0x97, 0x98, 0x99, 0x9a, 0x9b, 0x9c, 0x9d, 0x9e, 0x9f, 0xa0, 0xa1, 0xa2, 0xa3, 0xa4,
                            0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xab, 0xac, 0xad, 0xae, 0xaf, 0xb0, 0xb1, 0xb2, 0xb3,
                            0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xbb, 0xbc, 0xbd, 0xbe, 0xbf, 0xc0, 0xc1, 0xc2,
                            0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xcb, 0xcc, 0xcd, 0xce, 0xcf, 0xd0, 0xd1,
                            0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xdb, 0xdc, 0xdd, 0xde, 0xdf, 0xe0,
                            0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xeb, 0xec, 0xed, 0xee, 0xef,
                            0xf0, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xfb, 0xfc, 0xfd, 0xfe,
                            0xff,
                        ]),
                        recipient: tokenHolder,
                        amount: TokenAmount.create(BigInt(100), 2),
                    },
                },
            ]);
        });
        test('transfer operation (CBOR memo) decodes correctly', () => {
            const hex =
                '81a1687472616e73666572a3646d656d6fd818590100000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfeff66616d6f756e74c48221186469726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15';
            const decoded = Cbor.decode(Cbor.fromHexString(hex));

            expect(decoded).toEqual([
                {
                    [TokenOperationType.Transfer]: {
                        memo: CborMemo.fromProto({
                            value: Uint8Array.from([
                                0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d,
                                0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b,
                                0x1c, 0x1d, 0x1e, 0x1f, 0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29,
                                0x2a, 0x2b, 0x2c, 0x2d, 0x2e, 0x2f, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37,
                                0x38, 0x39, 0x3a, 0x3b, 0x3c, 0x3d, 0x3e, 0x3f, 0x40, 0x41, 0x42, 0x43, 0x44, 0x45,
                                0x46, 0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50, 0x51, 0x52, 0x53,
                                0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x5b, 0x5c, 0x5d, 0x5e, 0x5f, 0x60, 0x61,
                                0x62, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x6b, 0x6c, 0x6d, 0x6e, 0x6f,
                                0x70, 0x71, 0x72, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x7b, 0x7c, 0x7d,
                                0x7e, 0x7f, 0x80, 0x81, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x8b,
                                0x8c, 0x8d, 0x8e, 0x8f, 0x90, 0x91, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99,
                                0x9a, 0x9b, 0x9c, 0x9d, 0x9e, 0x9f, 0xa0, 0xa1, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7,
                                0xa8, 0xa9, 0xaa, 0xab, 0xac, 0xad, 0xae, 0xaf, 0xb0, 0xb1, 0xb2, 0xb3, 0xb4, 0xb5,
                                0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xbb, 0xbc, 0xbd, 0xbe, 0xbf, 0xc0, 0xc1, 0xc2, 0xc3,
                                0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xcb, 0xcc, 0xcd, 0xce, 0xcf, 0xd0, 0xd1,
                                0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xdb, 0xdc, 0xdd, 0xde, 0xdf,
                                0xe0, 0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xeb, 0xec, 0xed,
                                0xee, 0xef, 0xf0, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xfb,
                                0xfc, 0xfd, 0xfe, 0xff,
                            ]),
                        }),
                        recipient: tokenHolder,
                        amount: TokenAmount.create(BigInt(100), 2),
                    },
                },
            ]);
        });
        test('transfer operation ([reject] oversize memo) decodes correctly', () => {
            // Note: this is rejected by the Haskell Token Module implementation due to the
            // memo length exceeding 256 characters.
            const hex =
                '81a1687472616e73666572a366616d6f756e74c48221186469726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15646d656d6f590101000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfeff00';
            const decoded = Cbor.decode(Cbor.fromHexString(hex));
            expect(decoded).toEqual([
                {
                    [TokenOperationType.Transfer]: {
                        memo: Uint8Array.from([
                            0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e,
                            0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d,
                            0x1e, 0x1f, 0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x2b, 0x2c,
                            0x2d, 0x2e, 0x2f, 0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x3b,
                            0x3c, 0x3d, 0x3e, 0x3f, 0x40, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a,
                            0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50, 0x51, 0x52, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
                            0x5a, 0x5b, 0x5c, 0x5d, 0x5e, 0x5f, 0x60, 0x61, 0x62, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68,
                            0x69, 0x6a, 0x6b, 0x6c, 0x6d, 0x6e, 0x6f, 0x70, 0x71, 0x72, 0x73, 0x74, 0x75, 0x76, 0x77,
                            0x78, 0x79, 0x7a, 0x7b, 0x7c, 0x7d, 0x7e, 0x7f, 0x80, 0x81, 0x82, 0x83, 0x84, 0x85, 0x86,
                            0x87, 0x88, 0x89, 0x8a, 0x8b, 0x8c, 0x8d, 0x8e, 0x8f, 0x90, 0x91, 0x92, 0x93, 0x94, 0x95,
                            0x96, 0x97, 0x98, 0x99, 0x9a, 0x9b, 0x9c, 0x9d, 0x9e, 0x9f, 0xa0, 0xa1, 0xa2, 0xa3, 0xa4,
                            0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xab, 0xac, 0xad, 0xae, 0xaf, 0xb0, 0xb1, 0xb2, 0xb3,
                            0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xbb, 0xbc, 0xbd, 0xbe, 0xbf, 0xc0, 0xc1, 0xc2,
                            0xc3, 0xc4, 0xc5, 0xc6, 0xc7, 0xc8, 0xc9, 0xca, 0xcb, 0xcc, 0xcd, 0xce, 0xcf, 0xd0, 0xd1,
                            0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xdb, 0xdc, 0xdd, 0xde, 0xdf, 0xe0,
                            0xe1, 0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xeb, 0xec, 0xed, 0xee, 0xef,
                            0xf0, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa, 0xfb, 0xfc, 0xfd, 0xfe,
                            0xff, 0x00,
                        ]),
                        recipient: tokenHolder,
                        amount: TokenAmount.create(BigInt(100), 2),
                    },
                },
            ]);
        });
        test('transfer operation ([reject] oversize CBOR memo) fails decoding', () => {
            const hex =
                '81a1687472616e73666572a3646d656d6fd818590101000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeafb0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfeff0066616d6f756e74c48221186469726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15';
            expect(() => Cbor.decode(Cbor.fromHexString(hex))).toThrow(
                /Memo content exceeds the maximum allowed length/
            );
        });
        test('transfer operation (memo with reordered fields) decodes correctly', () => {
            const hex =
                '81a1687472616e73666572a369726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b1566616d6f756e74c482211864646d656d6f40';
            const decoded = Cbor.decode(Cbor.fromHexString(hex));
            expect(decoded).toEqual([
                {
                    [TokenOperationType.Transfer]: {
                        memo: Uint8Array.from([]),
                        recipient: tokenHolder,
                        amount: TokenAmount.create(BigInt(100), 2),
                    },
                },
            ]);
        });
        test('transfer operation ([reject] extra field) decodes correctly', () => {
            // Note: this is rejected by the Haskell Token Module since the transfer
            // operation contains an extra, unsupported field.
            const hex =
                '81a1687472616e73666572a366616d6f756e74c48221186469726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b156c626c6168617364666173646602';
            const decoded = Cbor.decode(Cbor.fromHexString(hex));
            expect(decoded).toEqual([
                {
                    [TokenOperationType.Transfer]: {
                        recipient: tokenHolder,
                        amount: TokenAmount.create(BigInt(100), 2),
                        blahasdfasdf: 2,
                    },
                },
            ]);
        });
        test('transfer operation ([reject] missing amount) decodes correctly', () => {
            // Note: this is rejected by the Haskell Token Module since the transfer
            // does not include the (required) 'amount' field.
            const hex =
                '81a1687472616e73666572a169726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15';
            const decoded = Cbor.decode(Cbor.fromHexString(hex));
            expect(decoded).toEqual([
                {
                    [TokenOperationType.Transfer]: {
                        recipient: tokenHolder,
                    },
                },
            ]);
        });
        test('transfer operation ([reject] duplicate memo) decodes', () => {
            // Note: this is rejected by the Haskell Token Module since the transfer
            // includes two 'memo' fields.
            const hex =
                '81a1687472616e73666572a4646d656d6f4100646d656d6f410166616d6f756e74c48221186469726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15';
            const decoded = Cbor.decode(Cbor.fromHexString(hex));
            expect(decoded).toEqual([
                {
                    [TokenOperationType.Transfer]: {
                        recipient: tokenHolder,
                        amount: TokenAmount.create(BigInt(100), 2),
                        memo: Uint8Array.from([0x01]),
                    },
                },
            ]);
        });
        test('transfer operation ([reject] duplicate amount) decodes', () => {
            // Note: this is rejected by the Haskell Token Module since the transfer
            // includes two 'amount' fields.
            const hex =
                '81a1687472616e73666572a366616d6f756e74c48221186466616d6f756e74c4822118c869726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15';
            const decoded = Cbor.decode(Cbor.fromHexString(hex));
            expect(decoded).toEqual([
                {
                    [TokenOperationType.Transfer]: {
                        recipient: tokenHolder,
                        amount: TokenAmount.create(BigInt(200), 2),
                    },
                },
            ]);
        });
        test('two transfers (canonical) decodes correctly', () => {
            const hex =
                '82a1687472616e73666572a266616d6f756e74c48221186469726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15a1687472616e73666572a266616d6f756e74c482211901f469726563697069656e74d99d73a201d99d71a101190397035820a26c957377a2461b6d0b9f63e7c9504136181942145e16c926451bbce5502b15';
            const decoded = Cbor.decode(Cbor.fromHexString(hex));
            expect(decoded).toEqual([
                {
                    [TokenOperationType.Transfer]: {
                        recipient: tokenHolder,
                        amount: TokenAmount.create(BigInt(100), 2),
                    },
                },
                {
                    [TokenOperationType.Transfer]: {
                        recipient: tokenHolder,
                        amount: TokenAmount.create(BigInt(500), 2),
                    },
                },
            ]);
        });
    });
});
