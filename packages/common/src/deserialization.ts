import * as wasm from '@concordium/rust-bindings';
import { Buffer } from 'buffer/';
import { getAccountTransactionHandler } from './accountTransactions';
import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    BlockItemKind,
    TypedCredentialDeployment,
} from './types';
import { AccountAddress } from './types/accountAddress';
import { TransactionExpiry } from './types/transactionExpiry';
import { sliceBuffer } from './util';

/**
 * Given a contract's raw state, its name and its schema, return the state as a JSON object.
 * The return type is any, and the actual type should be determined by using the schema.
 */
export function deserializeContractState(
    contractName: string,
    schema: Buffer,
    state: Buffer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
    const serializedState = wasm.deserializeState(
        contractName,
        state.toString('hex'),
        schema.toString('hex')
    );
    try {
        return JSON.parse(serializedState);
    } catch (e) {
        throw new Error(
            'unable to deserialize state, due to: ' + serializedState
        ); // In this case serializedState is the error message from the rust module
    }
}

interface WithByteLength<T> {
    length: number;
    value: T;
}
function deserializeMap<K extends string | number | symbol, T>(
    serialized: Buffer,
    decodeSize: (size: Buffer) => WithByteLength<number>,
    decodeKey: (k: Buffer) => WithByteLength<K>,
    decodeValue: (t: Buffer) => WithByteLength<T>
): WithByteLength<Record<K, T>> {
    const size = decodeSize(serialized);
    let pointer = 0;
    pointer += size.length;
    const result = {} as Record<K, T>;
    for (let i = 0; i < size.value; i += 1) {
        const key = decodeKey(sliceBuffer(serialized, pointer));
        pointer += key.length;
        const value = decodeValue(sliceBuffer(serialized, pointer));
        pointer += value.length;
        result[key.value] = value.value;
    }
    return { value: result, length: pointer };
}

function deserializeAccountTransactionSignature(
    signatures: Buffer
): WithByteLength<AccountTransactionSignature> {
    const decodeWord8 = (buffer: Buffer) => ({
        value: buffer.readUInt8(0),
        length: 1,
    });

    const decodeSignature = (serialized: Buffer) => {
        const length = serialized.readUInt16BE(0);
        return {
            value: sliceBuffer(serialized, 2, 2 + length).toString('hex'),
            length: 2 + length,
        };
    };
    const decodeCredentialSignatures = (serialized: Buffer) =>
        deserializeMap(serialized, decodeWord8, decodeWord8, decodeSignature);
    return deserializeMap(
        signatures,
        decodeWord8,
        decodeWord8,
        decodeCredentialSignatures
    );
}

/** We do not return the byte length, because it is always 60 (32 + 8 + 8 + 4 + 8) for the header */
function deserializeTransactionHeader(
    serializedHeader: Buffer
): AccountTransactionHeader {
    const sender = AccountAddress.fromBytes(
        sliceBuffer(serializedHeader, 0, 32)
    );
    const nonce = serializedHeader.readBigUInt64BE(32) as bigint;
    // TODO: extract payloadSize and energyAmount?
    // const energyAmount = serializedPayload.readBigUInt64BE(40);
    // const payloadSize = serializedPayload.readBigUInt64BE(48);
    const expiry = TransactionExpiry.fromEpochSeconds(
        serializedHeader.readBigUInt64BE(52) as bigint
    );
    return {
        sender,
        nonce,
        expiry,
    };
}

function deserializeAccountTransaction(serializedTransaction: Buffer): {
    accountTransaction: AccountTransaction;
    signatures: AccountTransactionSignature;
} {
    let pointer = 0;
    const { value: signatures, length: signaturesLength } =
        deserializeAccountTransactionSignature(
            sliceBuffer(serializedTransaction, pointer)
        );
    pointer += signaturesLength;

    const header = deserializeTransactionHeader(
        sliceBuffer(serializedTransaction, pointer)
    );
    pointer += 60;

    const transactionType = serializedTransaction.readUInt8(pointer);
    pointer += 1;
    if (!(transactionType in AccountTransactionType)) {
        throw new Error('TransactionType is not a valid value ');
    }
    const accountTransactionHandler = getAccountTransactionHandler(
        transactionType as AccountTransactionType
    );
    const payload = accountTransactionHandler.deserialize(
        sliceBuffer(serializedTransaction, pointer)
    );

    return {
        accountTransaction: {
            type: transactionType as AccountTransactionType,
            payload,
            header,
        },
        signatures,
    };
}

function deserializeCredentialDeployment(serializedDeployment: Buffer) {
    const raw = wasm.deserializeCredentialDeployment(
        serializedDeployment.toString('hex')
    );
    try {
        const parsed = JSON.parse(raw);
        return {
            credential: parsed.credential,
            expiry: parsed.messageExpiry,
        };
    } catch {
        throw new Error(raw);
    }
}

export type BlockItem =
    | {
          kind: BlockItemKind.AccountTransactionKind;
          transaction: {
              accountTransaction: AccountTransaction;
              signatures: AccountTransactionSignature;
          };
      }
    | {
          kind: BlockItemKind.CredentialDeploymentKind;
          transaction: {
              credential: TypedCredentialDeployment;
              expiry: number;
          };
      };

/**
 * Deserializes a transaction, from the binary format used to send it to the node, back into an js object.
 * @param serializedTransaction A buffer containing the binary transaction. It is expected to start with the version and blockItemKind.
 * @returns An object specifiying the blockItemKind that the transaction has. The object also contains the actual transaction under the transaction field.
 **/
export function deserializeTransaction(
    serializedTransaction: Buffer
): BlockItem {
    let pointer = 0;
    const version = serializedTransaction.readUInt8(pointer);
    pointer += 1;
    if (version !== 0) {
        throw new Error(
            'Only transactions with version 0 format are supported'
        );
    }
    const blockItemKind = serializedTransaction.readUInt8(pointer);
    pointer += 1;
    switch (blockItemKind) {
        case BlockItemKind.AccountTransactionKind:
            return {
                kind: BlockItemKind.AccountTransactionKind,
                transaction: deserializeAccountTransaction(
                    sliceBuffer(serializedTransaction, pointer)
                ),
            };
        case BlockItemKind.CredentialDeploymentKind:
            return {
                kind: BlockItemKind.CredentialDeploymentKind,
                transaction: deserializeCredentialDeployment(
                    sliceBuffer(serializedTransaction, pointer)
                ),
            };
        case BlockItemKind.UpdateInstructionKind:
            throw new Error(
                'deserialization of UpdateInstructions is not supported'
            );
        default:
            throw new Error('Invalid blockItemKind');
    }
}
