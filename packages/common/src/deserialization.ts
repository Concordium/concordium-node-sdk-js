import * as wasm from '@concordium/rust-bindings';
import { Buffer } from 'buffer/';
import { getAccountTransactionHandler } from './accountTransactions';
import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    BlockItemKind,
    isAccountTransactionType,
    TypedCredentialDeployment,
} from './types';
import { AccountAddress } from './types/accountAddress';
import { TransactionExpiry } from './types/transactionExpiry';
import { PassThrough, Readable } from 'stream';
import { deserialUint8 } from './deserializeSchema';

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

function deserializeMap<K extends string | number | symbol, T>(
    serialized: Readable,
    decodeSize: (size: Readable) => number,
    decodeKey: (k: Readable) => K,
    decodeValue: (t: Readable) => T
): Record<K, T> {
    const size = decodeSize(serialized);
    const result = {} as Record<K, T>;
    for (let i = 0; i < size; i += 1) {
        const key = decodeKey(serialized);
        const value = decodeValue(serialized);
        result[key] = value;
    }
    return result;
}

function deserializeAccountTransactionSignature(
    signatures: Readable
): AccountTransactionSignature {
    const decodeSignature = (serialized: Readable) => {
        const length = serialized.read(2).readUInt16BE(0);
        return serialized.read(length).toString('hex');
    };
    const decodeCredentialSignatures = (serialized: Readable) =>
        deserializeMap(
            serialized,
            deserialUint8,
            deserialUint8,
            decodeSignature
        );
    return deserializeMap(
        signatures,
        deserialUint8,
        deserialUint8,
        decodeCredentialSignatures
    );
}

function deserializeTransactionHeader(
    serializedHeader: Readable
): AccountTransactionHeader {
    const sender = AccountAddress.fromBytes(
        Buffer.from(serializedHeader.read(32))
    );
    const nonce = serializedHeader.read(8).readBigUInt64BE(0);
    // TODO: extract payloadSize and energyAmount?
    // energyAmount
    serializedHeader.read(8).readBigUInt64BE(0);
    // payloadSize
    serializedHeader.read(4).readUInt32BE(0);
    const expiry = TransactionExpiry.fromEpochSeconds(
        serializedHeader.read(8).readBigUInt64BE(0),
        true
    );
    return {
        sender,
        nonce,
        expiry,
    };
}

function deserializeAccountTransaction(serializedTransaction: Readable): {
    accountTransaction: AccountTransaction;
    signatures: AccountTransactionSignature;
} {
    const signatures = deserializeAccountTransactionSignature(
        serializedTransaction
    );

    const header = deserializeTransactionHeader(serializedTransaction);

    const transactionType = deserialUint8(serializedTransaction);
    if (!isAccountTransactionType(transactionType)) {
        throw new Error(
            'TransactionType is not a valid value: ' + transactionType
        );
    }
    const accountTransactionHandler =
        getAccountTransactionHandler(transactionType);
    const payload = accountTransactionHandler.deserialize(
        serializedTransaction
    );

    return {
        accountTransaction: {
            type: transactionType,
            payload,
            header,
        },
        signatures,
    };
}

function deserializeCredentialDeployment(serializedDeployment: Readable) {
    const raw = wasm.deserializeCredentialDeployment(
        serializedDeployment.read().toString('hex')
    );
    try {
        const parsed = JSON.parse(raw);
        return {
            credential: parsed.credential,
            expiry: parsed.messageExpiry,
        };
    } catch {
        // If the return value is not a proper JSON, it should be an error message.
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
    const bufferStream = new PassThrough();
    bufferStream.end(serializedTransaction);

    const version = deserialUint8(bufferStream);
    if (version !== 0) {
        throw new Error(
            'Supplied version ' +
                version +
                ' is not valid. Only transactions with version 0 format are supported'
        );
    }
    const blockItemKind = deserialUint8(bufferStream);
    switch (blockItemKind) {
        case BlockItemKind.AccountTransactionKind:
            return {
                kind: BlockItemKind.AccountTransactionKind,
                transaction: deserializeAccountTransaction(bufferStream),
            };
        case BlockItemKind.CredentialDeploymentKind:
            return {
                kind: BlockItemKind.CredentialDeploymentKind,
                transaction: deserializeCredentialDeployment(bufferStream),
            };
        case BlockItemKind.UpdateInstructionKind:
            throw new Error(
                'deserialization of UpdateInstructions is not supported'
            );
        default:
            throw new Error('Invalid blockItemKind');
    }
}

/**
 * Deserializes a return value from a sequence of bytes into a json object.
 * @param returnValueBytes A buffer containing the return value as raw bytes.
 * @param moduleSchema The raw module schema as a buffer.
 * @param contractName The name of the contract where the receive function is located.
 * @param functionName The name of the receive function whose return value you want to deserialize.
 * @param schemaVersion The schema version as a number. This parameter is optional,
 * if you provide a serialized versioned schema this argument won't be needed.
 */
export function deserializeReturnValue(
    returnValueBytes: Buffer,
    moduleSchema: Buffer,
    contractName: string,
    functionName: string,
    schemaVersion?: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
    const deserializedReturnValue = wasm.deserializeReturnValue(
        returnValueBytes.toString('hex'),
        moduleSchema.toString('hex'),
        contractName,
        functionName,
        schemaVersion
    );
    try {
        return JSON.parse(deserializedReturnValue);
    } catch (e) {
        throw new Error(
            'unable to deserialize the return value, due to: ' +
                deserializedReturnValue
        ); // In this case serializedState is the error message from the rust module
    }
}
