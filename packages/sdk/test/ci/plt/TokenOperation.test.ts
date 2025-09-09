import { Cursor } from '../../../src/deserializationHelpers.ts';
import {
    Cbor,
    TokenAddAllowListOperation,
    TokenAddDenyListOperation,
    TokenAmount,
    TokenBurnOperation,
    TokenHolder,
    TokenId,
    TokenMintOperation,
    TokenOperationType,
    TokenPauseOperation,
    TokenRemoveAllowListOperation,
    TokenRemoveDenyListOperation,
    TokenTransferOperation,
    TokenUnpauseOperation,
    UnknownTokenOperation,
    createTokenUpdatePayload,
    parseTokenUpdatePayload,
} from '../../../src/pub/plt.ts';
import {
    AccountAddress,
    AccountTransactionType,
    TokenUpdateHandler,
    TokenUpdatePayload,
    serializeAccountTransactionPayload,
} from '../../../src/pub/types.ts';

describe('PLT TokenOperation', () => {
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

        const ser = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenUpdate });
        const expected = Buffer.concat([Buffer.from('1b03444b4b00000052', 'hex'), expectedOperations]);
        expect(ser.toString('hex')).toEqual(expected.toString('hex'));

        const serPayload = ser.slice(1);
        const des = new TokenUpdateHandler().deserialize(Cursor.fromBuffer(serPayload));
        expect(des).toEqual(payload);

        const parsed = parseTokenUpdatePayload(des);
        expect(parsed.operations).toEqual([transfer]);
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

        const ser = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenUpdate });
        const serPayload = ser.slice(1);
        const des = new TokenUpdateHandler().deserialize(Cursor.fromBuffer(serPayload));
        expect(des).toEqual(payload);

        const parsed = parseTokenUpdatePayload(des);
        expect(parsed.operations).toEqual([mint]);
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

        const ser = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenUpdate });
        const serPayload = ser.slice(1);
        const des = new TokenUpdateHandler().deserialize(Cursor.fromBuffer(serPayload));
        expect(des).toEqual(payload);

        const parsed = parseTokenUpdatePayload(des);
        expect(parsed.operations).toEqual([burn]);
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

        const ser = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenUpdate });
        const serPayload = ser.slice(1);
        const des = new TokenUpdateHandler().deserialize(Cursor.fromBuffer(serPayload));
        expect(des).toEqual(payload);

        const parsed = parseTokenUpdatePayload(des);
        expect(parsed.operations).toEqual([addAllowList]);
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

        const ser = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenUpdate });
        const serPayload = ser.slice(1);
        const des = new TokenUpdateHandler().deserialize(Cursor.fromBuffer(serPayload));
        expect(des).toEqual(payload);

        const parsed = parseTokenUpdatePayload(des);
        expect(parsed.operations).toEqual([removeAllowList]);
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

        const ser = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenUpdate });
        const serPayload = ser.slice(1);
        const des = new TokenUpdateHandler().deserialize(Cursor.fromBuffer(serPayload));
        expect(des).toEqual(payload);

        const parsed = parseTokenUpdatePayload(des);
        expect(parsed.operations).toEqual([addDenyList]);
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

        const ser = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenUpdate });
        const serPayload = ser.slice(1);
        const des = new TokenUpdateHandler().deserialize(Cursor.fromBuffer(serPayload));
        expect(des).toEqual(payload);

        const parsed = parseTokenUpdatePayload(des);
        expect(parsed.operations).toEqual([removeDenyList]);
    });

    it('(de)serializes unpause operations correctly', () => {
        const uppause: TokenUnpauseOperation = {
            [TokenOperationType.Unpause]: {},
        };

        const payload = createTokenUpdatePayload(token, uppause);

        // This is a CBOR encoded byte sequence representing the unpause operation:
        // - 81: An array of 1 item
        // - a1: A map with 1 key-value pair
        // - 67756e7061757365 a0: A string key "unpause" with an empty map as the value
        const expectedOperations = Buffer.from(
            `
            81
              a1
                67756e7061757365 a0
            `.replace(/\s/g, ''),
            'hex'
        );
        expect(payload.operations.toString()).toEqual(expectedOperations.toString('hex'));

        const ser = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenUpdate });
        const serPayload = ser.slice(1);
        const des = new TokenUpdateHandler().deserialize(Cursor.fromBuffer(serPayload));
        expect(des).toEqual(payload);

        const parsed = parseTokenUpdatePayload(des);
        expect(parsed.operations).toEqual([uppause]);
    });

    it('(de)serializes pause operations correctly', () => {
        const pause: TokenPauseOperation = {
            [TokenOperationType.Pause]: {},
        };

        const payload = createTokenUpdatePayload(token, pause);

        // This is a CBOR encoded byte sequence representing the pause operation:
        // - 81: An array of 1 item
        // - a1: A map with 1 key-value pair
        // - 657061757365 a0: A string key "pause" with an empty map as the value
        const expectedOperations = Buffer.from(
            `
            81
              a1
                657061757365 a0
            `.replace(/\s/g, ''),
            'hex'
        );
        expect(payload.operations.toString()).toEqual(expectedOperations.toString('hex'));

        const ser = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenUpdate });
        const serPayload = ser.slice(1);
        const des = new TokenUpdateHandler().deserialize(Cursor.fromBuffer(serPayload));
        expect(des).toEqual(payload);

        const parsed = parseTokenUpdatePayload(des);
        expect(parsed.operations).toEqual([pause]);
    });

    it('(de)serializes unknown operations correctly', () => {
        const unknown: UnknownTokenOperation = {
            unknownOperation: { test: 'something', test2: 123 },
        };

        const payload: TokenUpdatePayload = { tokenId: token, operations: Cbor.encode([unknown]) };

        // This is a CBOR encoded byte sequence representing the pause operation:
        // - 81: An array of 1 item
        // - a1: A map with 1 key-value pair
        // - 70 756e6b6e6f776e4f7065726174696f6e a2: A string key "unknownOperation" with map with 2 keys as the value
        // - 64 74657374 69 736f6d657468696e67: a string key "test" with a string value "something"
        // - 65 7465737432 18 7b: a string key "test2" with an unsigned int value 123
        const expectedOperations = Buffer.from(
            `
            81
              a1
                70 756e6b6e6f776e4f7065726174696f6e a2
                  64 74657374 69 736f6d657468696e67
                  65 7465737432 18 7b
            `.replace(/\s/g, ''),
            'hex'
        );
        expect(payload.operations.toString()).toEqual(expectedOperations.toString('hex'));

        const ser = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenUpdate });
        const serPayload = ser.slice(1);
        const des = new TokenUpdateHandler().deserialize(Cursor.fromBuffer(serPayload));
        expect(des).toEqual(payload);

        const parsed = parseTokenUpdatePayload(des);
        expect(parsed.operations).toEqual([unknown]);
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

        const ser = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenUpdate });
        const serPayload = ser.slice(1);
        const des = new TokenUpdateHandler().deserialize(Cursor.fromBuffer(serPayload));
        expect(des).toEqual(payload);

        const parsed = parseTokenUpdatePayload(des);
        expect(parsed.operations).toEqual(operations);
    });
});
