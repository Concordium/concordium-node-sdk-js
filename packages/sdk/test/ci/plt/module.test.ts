import { Cursor } from '../../../src/deserializationHelpers.js';
import { TokenHolder } from '../../../src/plt/index.ts';
import {
    TokenAddAllowListOperation,
    TokenAddDenyListOperation,
    TokenBurnOperation,
    TokenMintOperation,
    TokenOperationType,
    TokenRemoveAllowListOperation,
    TokenRemoveDenyListOperation,
    TokenTransferOperation,
    createTokenUpdatePayload,
    parseModuleEvent,
} from '../../../src/plt/module.js';
import { Cbor, TokenAmount, TokenId } from '../../../src/pub/plt.js';
import {
    AccountAddress,
    AccountTransactionType,
    TokenUpdateHandler,
    serializeAccountTransactionPayload,
} from '../../../src/pub/types.js';

describe('PLT V1 parseModuleEvent', () => {
    const testEventParsing = (type: string, targetValue: number) => {
        it(`parses ${type} events correctly`, () => {
            const target = TokenHolder.fromAccountAddress(
                AccountAddress.fromBuffer(new Uint8Array(32).fill(targetValue))
            );
            const validEvent = {
                type,
                details: Cbor.encode({ target }),
            };

            const parsedEvent = parseModuleEvent(validEvent);
            expect(parsedEvent.type).toEqual(type);
            expect(parsedEvent.details.target.type).toEqual('account');
            expect(parsedEvent.details.target.address.decodedAddress).toEqual(new Uint8Array(32).fill(targetValue));
        });
    };

    testEventParsing('addAllowList', 0x15);
    testEventParsing('addDenyList', 0x16);
    testEventParsing('removeAllowList', 0x17);
    testEventParsing('removeDenyList', 0x18);

    it('throws an error for invalid event type', () => {
        const invalidEvent = { type: 'invalidType', details: Cbor.encode({}) };
        expect(() => parseModuleEvent(invalidEvent)).toThrowError(/invalidType/);
    });

    it('throws an error for invalid event details', () => {
        const invalidDetailsEvent = { type: 'addAllowList', details: Cbor.encode(null) };
        expect(() => parseModuleEvent(invalidDetailsEvent)).toThrowError(/null/);
    });

    it("throws an error if 'target' is missing or invalid", () => {
        const missingTargetEvent = { type: 'addAllowList', details: Cbor.encode({}) };
        expect(() => parseModuleEvent(missingTargetEvent)).toThrowError(/{}/);
    });
});

describe('PLT v1 transactions', () => {
    const token = TokenId.fromString('DKK');
    const testAccountAddress = TokenHolder.fromAccountAddress(AccountAddress.fromBuffer(new Uint8Array(32).fill(0x15)));
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
    const testAccountAddressCbor = `
      d99d73 a2
        01 d99d71 a1
          01 190397
        03 5820 ${Buffer.from(testAccountAddress.address.decodedAddress).toString('hex')}
    `.replace(/\s/g, '');

    it('(de)serializes transfers correctly', () => {
        const transfer: TokenTransferOperation = {
            [TokenOperationType.Transfer]: {
                amount: TokenAmount.create(123n, 4),
                recipient: testAccountAddress,
            },
        };

        const payload = createTokenUpdatePayload(token, transfer);

        // This is a CBOR encoded byte sequence.
        // It represents a nested structure with the following breakdown:
        // - 81: An array of 1 item.
        // - a1: A map with 1 key-value pair.
        //   - 687472616e73666572: Key "transfer" (in UTF-8).
        //   - a2: A map with 2 key-value pairs:
        //     - 66616d6f756e74 Key "amount" ( in UTF-8).
        //     - c4: A decfrac containing:
        //       - 23: Integer(-4).
        //       - 187b: Uint8(123).
        //     - 69726563697069656e74: Key "recipient" (in UTF-8).
        //     - the account address
        const expectedOperations = Buffer.from(
            `
            81
              a1
                687472616e73666572 a2
                  66616d6f756e74 c4
                    82
                      23
                        187b
                  69726563697069656e74 ${testAccountAddressCbor}
            `.replace(/\s/g, ''),
            'hex'
        );

        expect(payload.operations.toString()).toEqual(expectedOperations.toString('hex'));

        const decoded = Cbor.decode(payload.operations);
        expect(decoded).toEqual([transfer]);

        const ser = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenUpdate });
        const expected = Buffer.concat([Buffer.from('1b03444b4b00000052', 'hex'), expectedOperations]);
        expect(ser.toString('hex')).toEqual(expected.toString('hex'));

        const serPayload = ser.slice(1);
        const des = new TokenUpdateHandler().deserialize(Cursor.fromBuffer(serPayload));
        expect(des).toEqual(payload);
    });

    it('(de)serializes mint operations correctly', () => {
        const mint: TokenMintOperation = {
            [TokenOperationType.Mint]: {
                amount: TokenAmount.create(500n, 2),
            },
        };

        const payload = createTokenUpdatePayload(token, mint);

        // This is a CBOR encoded byte sequence representing the mint operation:
        // - 81: An array of 1 item
        // - a1: A map with 1 key-value pair
        //   - 646d696e74: Key "mint" (in UTF-8)
        //   - a1: A map with 1 key-value pair
        //     - 66616d6f756e74: Key "amount" (in UTF-8)
        //     - c4: A decfrac containing:
        //       - 82: An array of 2 items
        //         - 21: Integer(-2)
        //         - 1901f4: Uint16(500)
        const expectedOperations = Buffer.from(
            `
            81
              a1
                646d696e74 a1
                  66616d6f756e74 c4
                    82
                      21
                      1901f4
            `.replace(/\s/g, ''),
            'hex'
        );

        expect(payload.operations.toString()).toEqual(expectedOperations.toString('hex'));

        const decoded = Cbor.decode(payload.operations);
        expect(decoded).toEqual([mint]);

        const ser = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenUpdate });
        const serPayload = ser.slice(1);
        const des = new TokenUpdateHandler().deserialize(Cursor.fromBuffer(serPayload));
        expect(des).toEqual(payload);
    });

    it('(de)serializes burn operations correctly', () => {
        const burn: TokenBurnOperation = {
            [TokenOperationType.Burn]: {
                amount: TokenAmount.create(200n, 3),
            },
        };

        const payload = createTokenUpdatePayload(token, burn);

        // This is a CBOR encoded byte sequence representing the burn operation:
        // - 81: An array of 1 item
        // - a1: A map with 1 key-value pair
        //   - 646275726e: Key "burn" (in UTF-8)
        //   - a1: A map with 1 key-value pair
        //     - 66616d6f756e74: Key "amount" (in UTF-8)
        //     - c4: A decfrac containing:
        //       - 82: An array of 2 items
        //         - 22: Integer(-3)
        //         - 18c8: Uint8(200)
        const expectedOperations = Buffer.from(
            `
            81
              a1
                646275726e a1
                  66616d6f756e74 c4
                    82
                      22
                      18c8
            `.replace(/\s/g, ''),
            'hex'
        );

        expect(payload.operations.toString()).toEqual(expectedOperations.toString('hex'));

        const decoded = Cbor.decode(payload.operations);
        expect(decoded).toEqual([burn]);

        const ser = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenUpdate });
        const serPayload = ser.slice(1);
        const des = new TokenUpdateHandler().deserialize(Cursor.fromBuffer(serPayload));
        expect(des).toEqual(payload);
    });

    it('(de)serializes addAllowList operations correctly', () => {
        const addAllowList: TokenAddAllowListOperation = {
            [TokenOperationType.AddAllowList]: {
                target: testAccountAddress,
            },
        };

        const payload = createTokenUpdatePayload(token, addAllowList);

        // This is a CBOR encoded byte sequence representing the addAllowList operation:
        // - 81: An array of 1 item
        // - a1: A map with 1 key-value pair
        //   - 6c616464416c6c6f774c697374: Key "addAllowList" (in UTF-8)
        //   - a1: A map with 1 key-value pair
        //     - 667461726765744: Key "target" (in UTF-8)
        //       - The account address cbor
        const expectedOperations = Buffer.from(
            `
            81
              a1
                6c616464416c6c6f774c697374 a1
                  66746172676574 ${testAccountAddressCbor}
            `.replace(/\s/g, ''),
            'hex'
        );

        expect(payload.operations.toString()).toEqual(expectedOperations.toString('hex'));

        const decoded = Cbor.decode(payload.operations);
        expect(decoded).toEqual([addAllowList]);

        const ser = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenUpdate });
        const serPayload = ser.slice(1);
        const des = new TokenUpdateHandler().deserialize(Cursor.fromBuffer(serPayload));
        expect(des).toEqual(payload);
    });

    it('(de)serializes removeAllowList operations correctly', () => {
        const removeAllowList: TokenRemoveAllowListOperation = {
            [TokenOperationType.RemoveAllowList]: {
                target: testAccountAddress,
            },
        };

        const payload = createTokenUpdatePayload(token, removeAllowList);

        // This is a CBOR encoded byte sequence representing the removeAllowList operation:
        // - 81: An array of 1 item
        // - a1: A map with 1 key-value pair
        //   - 6f72656d6f7665416c6c6f774c697374: Key "removeAllowList" (in UTF-8)
        //   - a1: A map with 1 key-value pair
        //     - 667461726765744: Key "target" (in UTF-8)
        //       - The account address cbor
        const expectedOperations = Buffer.from(
            `
            81
              a1
                6f72656d6f7665416c6c6f774c697374 a1
                  66746172676574 ${testAccountAddressCbor}
            `.replace(/\s/g, ''),
            'hex'
        );

        expect(payload.operations.toString()).toEqual(expectedOperations.toString('hex'));

        const decoded = Cbor.decode(payload.operations);
        expect(decoded).toEqual([removeAllowList]);

        const ser = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenUpdate });
        const serPayload = ser.slice(1);
        const des = new TokenUpdateHandler().deserialize(Cursor.fromBuffer(serPayload));
        expect(des).toEqual(payload);
    });

    it('(de)serializes addDenyList operations correctly', () => {
        const addDenyList: TokenAddDenyListOperation = {
            [TokenOperationType.AddDenyList]: {
                target: testAccountAddress,
            },
        };

        const payload = createTokenUpdatePayload(token, addDenyList);

        // This is a CBOR encoded byte sequence representing the addDenyList operation:
        // - 81: An array of 1 item
        // - a1: A map with 1 key-value pair
        //   - 6b61646444656e794c697374 : Key "addDenyList" (in UTF-8)
        //   - a1: A map with 1 key-value pair
        //     - 667461726765744: Key "target" (in UTF-8)
        //       - The account address cbor
        const expectedOperations = Buffer.from(
            `
            81
              a1
                6b61646444656e794c697374 a1
                  66746172676574 ${testAccountAddressCbor}
            `.replace(/\s/g, ''),
            'hex'
        );

        expect(payload.operations.toString()).toEqual(expectedOperations.toString('hex'));

        const decoded = Cbor.decode(payload.operations);
        expect(decoded).toEqual([addDenyList]);

        const ser = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenUpdate });
        const serPayload = ser.slice(1);
        const des = new TokenUpdateHandler().deserialize(Cursor.fromBuffer(serPayload));
        expect(des).toEqual(payload);
    });

    it('(de)serializes removeDenyList operations correctly', () => {
        const removeDenyList: TokenRemoveDenyListOperation = {
            [TokenOperationType.RemoveDenyList]: {
                target: testAccountAddress,
            },
        };

        const payload = createTokenUpdatePayload(token, removeDenyList);

        // This is a CBOR encoded byte sequence representing the removeDenyList operation:
        // - 81: An array of 1 item
        // - a1: A map with 1 key-value pair
        //   - 6e72656d6f766544656e794c697374: Key "removeDenyList" (in UTF-8)
        //   - a1: A map with 1 key-value pair
        //     - 667461726765744: Key "target" (in UTF-8)
        //       - The account address cbor
        const expectedOperations = Buffer.from(
            `
            81
              a1
                6e72656d6f766544656e794c697374 a1
                  66746172676574 ${testAccountAddressCbor}
            `.replace(/\s/g, ''),
            'hex'
        );

        expect(payload.operations.toString()).toEqual(expectedOperations.toString('hex'));

        const decoded = Cbor.decode(payload.operations);
        expect(decoded).toEqual([removeDenyList]);

        const ser = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenUpdate });
        const serPayload = ser.slice(1);
        const des = new TokenUpdateHandler().deserialize(Cursor.fromBuffer(serPayload));
        expect(des).toEqual(payload);
    });

    it('(de)serializes multiple governance operations correctly', () => {
        const mint: TokenMintOperation = {
            [TokenOperationType.Mint]: {
                amount: TokenAmount.create(500n, 2),
            },
        };

        const addDenyList: TokenAddDenyListOperation = {
            [TokenOperationType.AddDenyList]: {
                target: testAccountAddress,
            },
        };

        const operations = [mint, addDenyList];

        const payload = createTokenUpdatePayload(token, operations);

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
                  66746172676574 ${testAccountAddressCbor}
            `.replace(/\s/g, ''),
            'hex'
        );

        expect(payload.operations.toString()).toEqual(expectedOperations.toString('hex'));

        const decoded = Cbor.decode(payload.operations);
        expect(decoded).toEqual(operations);

        const ser = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenUpdate });
        const serPayload = ser.slice(1);
        const des = new TokenUpdateHandler().deserialize(Cursor.fromBuffer(serPayload));
        expect(des).toEqual(payload);
    });
});
