import { Cursor } from '../../../../src/deserializationHelpers.js';
import { parseModuleEvent } from '../../../../src/plt/v1/types.js';
import { Cbor, TokenAmount, TokenId, V1 } from '../../../../src/pub/plt.js';
// Removed duplicate import
import {
    AccountAddress,
    AccountTransactionType,
    TokenGovernanceHandler,
    TokenHolderHandler,
    serializeAccountTransactionPayload,
} from '../../../../src/pub/types.js';

describe('PLT V1 parseModuleEvent', () => {
    const testEventParsing = (type: string, targetValue: number) => {
        it(`parses ${type} events correctly`, () => {
            const validEvent = {
                type,
                details: Cbor.encode({ target: AccountAddress.fromBuffer(new Uint8Array(32).fill(targetValue)) }),
            };

            const parsedEvent = parseModuleEvent(validEvent);
            expect(parsedEvent.type).toEqual(type);
            expect(parsedEvent.details.target.tag).toEqual('account');
            expect(parsedEvent.details.target.address.decodedAddress).toEqual(new Uint8Array(32).fill(targetValue));
        });
    };

    testEventParsing('add-allow-list', 0x15);
    testEventParsing('add-deny-list', 0x16);
    testEventParsing('remove-allow-list', 0x17);
    testEventParsing('remove-deny-list', 0x18);

    it('throws an error for invalid event type', () => {
        const invalidEvent = { type: 'invalidType', details: Cbor.encode({}) };
        expect(() => parseModuleEvent(invalidEvent)).toThrowError(/invalidType/);
    });

    it('throws an error for invalid event details', () => {
        const invalidDetailsEvent = { type: 'add-allow-list', details: Cbor.encode(null) };
        expect(() => parseModuleEvent(invalidDetailsEvent)).toThrowError(/null/);
    });

    it("throws an error if 'target' is missing or invalid", () => {
        const missingTargetEvent = { type: 'add-allow-list', details: Cbor.encode({}) };
        expect(() => parseModuleEvent(missingTargetEvent)).toThrowError(/{}/);
    });
});

describe('PLT v1 transactions', () => {
    const token = TokenId.fromString('DKK');
    const testAccountAddress = AccountAddress.fromBuffer(new Uint8Array(32).fill(0x15));
    // - d99d73: A tagged (40307) item with a map (a2) containing:
    // - a2: A map with 2 key-value pairs
    //   - 01: Key 1.
    //   - d99d71: A tagged (40305) item containing:
    //   - a1: A map with 1 key-value pair
    //     - 01: Key 1.
    //     - 190397: Uint16(919).
    // Removed duplicate import
    //   - 03: Key 3.
    //   - 5820: A byte string of length 32, representing a 32-byte identifier.
    //   - 151515151515151515151515151515151515151515151515151515151515151: The account address
    const testAccountAddressCbor = `
      d99d73 a2
        01 d99d71 a1
          01 190397
        03 5820 ${Buffer.from(testAccountAddress.decodedAddress).toString('hex')}
    `.replace(/\s/g, '');

    it('(de)serializes transfers correctly', () => {
        const transfer: V1.TokenTransferOperation = {
            [V1.TokenOperationType.Transfer]: {
                amount: TokenAmount.create(123n, 4),
                recipient: testAccountAddress,
            },
        };

        const payload = V1.createTokenHolderPayload(token, transfer);

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

        const ser = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenHolder });
        const expected = Buffer.concat([Buffer.from('1b03444b4b00000052', 'hex'), expectedOperations]);
        expect(ser.toString('hex')).toEqual(expected.toString('hex'));

        const serPayload = ser.slice(1);
        const des = new TokenHolderHandler().deserialize(Cursor.fromBuffer(serPayload));
        expect(des).toEqual(payload);
    });

    it('(de)serializes mint operations correctly', () => {
        const mint: V1.TokenMintOperation = {
            [V1.TokenOperationType.Mint]: {
                amount: TokenAmount.create(500n, 2),
            },
        };

        const payload = V1.createTokenGovernancePayload(token, mint);

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

        const ser = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenGovernance });
        const serPayload = ser.slice(1);
        const des = new TokenGovernanceHandler().deserialize(Cursor.fromBuffer(serPayload));
        expect(des).toEqual(payload);
    });

    it('(de)serializes burn operations correctly', () => {
        const burn: V1.TokenBurnOperation = {
            [V1.TokenOperationType.Burn]: {
                amount: TokenAmount.create(200n, 3),
            },
        };

        const payload = V1.createTokenGovernancePayload(token, burn);

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

        const ser = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenGovernance });
        const serPayload = ser.slice(1);
        const des = new TokenGovernanceHandler().deserialize(Cursor.fromBuffer(serPayload));
        expect(des).toEqual(payload);
    });

    it('(de)serializes add-allow-list operations correctly', () => {
        const addAllowList: V1.TokenAddAllowListOperation = {
            [V1.TokenOperationType.AddAllowList]: {
                target: testAccountAddress,
            },
        };

        const payload = V1.createTokenGovernancePayload(token, addAllowList);

        // This is a CBOR encoded byte sequence representing the add-allow-list operation:
        // - 81: An array of 1 item
        // - a1: A map with 1 key-value pair
        //   - 6e6164642d616c6c6f772d6c697374: Key "add-allow-list" (in UTF-8)
        //   - a1: A map with 1 key-value pair
        //     - 667461726765744: Key "target" (in UTF-8)
        //       - The account address cbor
        const expectedOperations = Buffer.from(
            `
            81
              a1
                6e6164642d616c6c6f772d6c697374 a1
                  66746172676574 ${testAccountAddressCbor}
            `.replace(/\s/g, ''),
            'hex'
        );

        expect(payload.operations.toString()).toEqual(expectedOperations.toString('hex'));

        const decoded = Cbor.decode(payload.operations);
        expect(decoded).toEqual([addAllowList]);

        const ser = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenGovernance });
        const serPayload = ser.slice(1);
        const des = new TokenGovernanceHandler().deserialize(Cursor.fromBuffer(serPayload));
        expect(des).toEqual(payload);
    });

    it('(de)serializes remove-allow-list operations correctly', () => {
        const removeAllowList: V1.TokenRemoveAllowListOperation = {
            [V1.TokenOperationType.RemoveAllowList]: {
                target: testAccountAddress,
            },
        };

        const payload = V1.createTokenGovernancePayload(token, removeAllowList);

        // This is a CBOR encoded byte sequence representing the remove-allow-list operation:
        // - 81: An array of 1 item
        // - a1: A map with 1 key-value pair
        //   - 7172656d6f76652d616c6c6f772d6c697374: Key "remove-allow-list" (in UTF-8)
        //   - a1: A map with 1 key-value pair
        //     - 667461726765744: Key "target" (in UTF-8)
        //       - The account address cbor
        const expectedOperations = Buffer.from(
            `
            81
              a1
                7172656d6f76652d616c6c6f772d6c697374 a1
                  66746172676574 ${testAccountAddressCbor}
            `.replace(/\s/g, ''),
            'hex'
        );

        expect(payload.operations.toString()).toEqual(expectedOperations.toString('hex'));

        const decoded = Cbor.decode(payload.operations);
        expect(decoded).toEqual([removeAllowList]);

        const ser = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenGovernance });
        const serPayload = ser.slice(1);
        const des = new TokenGovernanceHandler().deserialize(Cursor.fromBuffer(serPayload));
        expect(des).toEqual(payload);
    });

    it('(de)serializes add-deny-list operations correctly', () => {
        const addDenyList: V1.TokenAddDenyListOperation = {
            [V1.TokenOperationType.AddDenyList]: {
                target: testAccountAddress,
            },
        };

        const payload = V1.createTokenGovernancePayload(token, addDenyList);

        // This is a CBOR encoded byte sequence representing the add-deny-list operation:
        // - 81: An array of 1 item
        // - a1: A map with 1 key-value pair
        //   - 6d6164642d64656e792d6c697374: Key "add-deny-list" (in UTF-8)
        //   - a1: A map with 1 key-value pair
        //     - 667461726765744: Key "target" (in UTF-8)
        //       - The account address cbor
        const expectedOperations = Buffer.from(
            `
            81
              a1
                6d6164642d64656e792d6c697374 a1
                  66746172676574 ${testAccountAddressCbor}
            `.replace(/\s/g, ''),
            'hex'
        );

        expect(payload.operations.toString()).toEqual(expectedOperations.toString('hex'));

        const decoded = Cbor.decode(payload.operations);
        expect(decoded).toEqual([addDenyList]);

        const ser = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenGovernance });
        const serPayload = ser.slice(1);
        const des = new TokenGovernanceHandler().deserialize(Cursor.fromBuffer(serPayload));
        expect(des).toEqual(payload);
    });

    it('(de)serializes remove-deny-list operations correctly', () => {
        const removeDenyList: V1.TokenRemoveDenyListOperation = {
            [V1.TokenOperationType.RemoveDenyList]: {
                target: testAccountAddress,
            },
        };

        const payload = V1.createTokenGovernancePayload(token, removeDenyList);

        // This is a CBOR encoded byte sequence representing the remove-deny-list operation:
        // - 81: An array of 1 item
        // - a1: A map with 1 key-value pair
        //   - 7072656d6f76652d64656e792d6c697374: Key "remove-deny-list" (in UTF-8)
        //   - a1: A map with 1 key-value pair
        //     - 667461726765744: Key "target" (in UTF-8)
        //       - The account address cbor
        const expectedOperations = Buffer.from(
            `
            81
              a1
                7072656d6f76652d64656e792d6c697374 a1
                  66746172676574 ${testAccountAddressCbor}
            `.replace(/\s/g, ''),
            'hex'
        );

        expect(payload.operations.toString()).toEqual(expectedOperations.toString('hex'));

        const decoded = Cbor.decode(payload.operations);
        expect(decoded).toEqual([removeDenyList]);

        const ser = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenGovernance });
        const serPayload = ser.slice(1);
        const des = new TokenGovernanceHandler().deserialize(Cursor.fromBuffer(serPayload));
        expect(des).toEqual(payload);
    });

    it('(de)serializes multiple governance operations correctly', () => {
        const mint: V1.TokenMintOperation = {
            [V1.TokenOperationType.Mint]: {
                amount: TokenAmount.create(500n, 2),
            },
        };

        const addDenyList: V1.TokenAddDenyListOperation = {
            [V1.TokenOperationType.AddDenyList]: {
                target: testAccountAddress,
            },
        };

        const operations = [mint, addDenyList];

        const payload = V1.createTokenGovernancePayload(token, operations);

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
        // - Second item (add-deny-list operation):
        //   - a1: A map with 1 key-value pair
        //     - 6d6164642d64656e792d6c697374: Key "add-deny-list" (in UTF-8)
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
                6d6164642d64656e792d6c697374 a1
                  66746172676574 ${testAccountAddressCbor}
            `.replace(/\s/g, ''),
            'hex'
        );

        expect(payload.operations.toString()).toEqual(expectedOperations.toString('hex'));

        const decoded = Cbor.decode(payload.operations);
        expect(decoded).toEqual(operations);

        const ser = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenGovernance });
        const serPayload = ser.slice(1);
        const des = new TokenGovernanceHandler().deserialize(Cursor.fromBuffer(serPayload));
        expect(des).toEqual(payload);
    });
});
