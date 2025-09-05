import {
    Cbor,
    TokenAddDenyListOperation,
    TokenAmount,
    TokenHolder,
    TokenMetadataUrl,
    TokenMintOperation,
    TokenOperationType,
} from '../../../src/pub/plt.js';
import { AccountAddress } from '../../../src/pub/types.js';

describe('PLT Cbor', () => {
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

    describe('TokenOperation[]', () => {
        test('should (de)serialize multiple governance operations correctly', () => {
            const account = TokenHolder.fromAccountAddress(AccountAddress.fromBuffer(new Uint8Array(32).fill(0x15)));
            // - d99d73: A tagged (40307) item with a map (a2) containing:
            // - a2: A map with 2 key-value pairs
            //   - 01: Key 1.
            //   - d99d71: A tagged (40305) item containing:
            //   - a1: A map with 1 key-value pair
            //     - 01: Key 1.
            //     - 190397: Uint16(919).
            //   - 03: Key 3.
            //   - 5820: A byte string of length 32, representing a 32-byte identifier.
            //   - 151515151515151515151515151515151515151515151515151515151515151: The account address
            const accountCbor = `
              d99d73 a2
                01 d99d71 a1
                  01 190397
                03 5820 ${Buffer.from(account.address.decodedAddress).toString('hex')}
            `.replace(/\s/g, '');
            const mint: TokenMintOperation = {
                [TokenOperationType.Mint]: {
                    amount: TokenAmount.create(500n, 2),
                },
            };

            const addDenyList: TokenAddDenyListOperation = {
                [TokenOperationType.AddDenyList]: {
                    target: account,
                },
            };

            const operations = [mint, addDenyList];
            const encoded = Cbor.encode(operations);

            // This is a CBOR encoded byte sequence representing two operations:
            // - 82: An array of 2 items
            // - First item (mint operation):
            //   - a1: A map with 1 key-value pair
            //     - 646d696e74: Key "mint" (in UTF-8)
            //     - a1: A map with 1 key-value pair
            //       - 66616d6f756e74: Key "amount" (in UTF-8)
            //       - c4: A decfrac containing:
            //         - 82: An array of 2 items
            //           - 21: Integer(-2)
            //           - 1901f4: Uint16(500)
            // - Second item (addDenyList operation):
            //   - a1: A map with 1 key-value pair
            //     - 6b61646444656e794c697374: Key "addDenyList" (in UTF-8)
            //     - a1: A map with 1 key-value pair
            //       - 667461726765744: Key "target" (in UTF-8)
            //       - The account address cbor
            const expectedOperations = Buffer.from(
                `
                82
                  a1
                    646d696e74 a1
                      66616d6f756e74 c4
                        82
                          21
                          1901f4
                  a1
                    6b61646444656e794c697374 a1
                      66746172676574 ${accountCbor}
                `.replace(/\s/g, ''),
                'hex'
            );
            expect(encoded.toString()).toEqual(expectedOperations.toString('hex'));

            const decoded = Cbor.decode(encoded, 'TokenOperation[]');
            expect(decoded).toEqual(operations);
        });
    });
});
