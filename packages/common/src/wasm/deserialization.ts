import * as wasm from '@concordium/rust-bindings';
import { Buffer } from 'buffer/';
import {
    deserializeAccountTransaction,
    deserializeUint8,
} from '../deserialization';
import { Cursor } from '../deserializationHelpers';
import {
    AccountTransaction,
    AccountTransactionSignature,
    BlockItemKind,
    SmartContractTypeValues,
    TypedCredentialDeployment,
} from '../types';

/**
 * Given a contract's raw state, its name and its schema, return the state as a JSON object.
 * The return type is any, and the actual type should be determined by using the schema.
 */
export function deserializeContractState(
    contractName: string,
    schema: Buffer,
    state: Buffer,
    verboseErrorMessage = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
    const serializedState = wasm.deserializeState(
        contractName,
        state.toString('hex'),
        schema.toString('hex'),
        verboseErrorMessage
    );
    try {
        return JSON.parse(serializedState);
    } catch (e) {
        throw new Error(
            'unable to deserialize state, due to: ' + serializedState
        ); // In this case serializedState is the error message from the rust module
    }
}

function deserializeCredentialDeployment(serializedDeployment: Cursor) {
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
    const cursor = new Cursor(serializedTransaction);

    const version = deserializeUint8(cursor);
    if (version !== 0) {
        throw new Error(
            'Supplied version ' +
                version +
                ' is not valid. Only transactions with version 0 format are supported'
        );
    }
    const blockItemKind = deserializeUint8(cursor);
    switch (blockItemKind) {
        case BlockItemKind.AccountTransactionKind:
            return {
                kind: BlockItemKind.AccountTransactionKind,
                transaction: deserializeAccountTransaction(cursor),
            };
        case BlockItemKind.CredentialDeploymentKind:
            return {
                kind: BlockItemKind.CredentialDeploymentKind,
                transaction: deserializeCredentialDeployment(cursor),
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
 * Deserializes a receive functions's return value from a sequence of bytes into a json object.
 * @param returnValueBytes A buffer containing the return value as raw bytes.
 * @param moduleSchema The raw module schema as a buffer.
 * @param contractName The name of the contract where the receive function is located.
 * @param functionName The name of the receive function which return value you want to deserialize.
 * @param schemaVersion The schema version as a number. This parameter is optional, if you provide a serialized versioned schema this argument won't be needed.
 * @param verboseErrorMessage Whether errors are in a verbose format or not. Defaults to `false`.
 */
export function deserializeReceiveReturnValue(
    returnValueBytes: Buffer,
    moduleSchema: Buffer,
    contractName: string,
    functionName: string,
    schemaVersion?: number,
    verboseErrorMessage = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
    const deserializedReturnValue = wasm.deserializeReceiveReturnValue(
        returnValueBytes.toString('hex'),
        moduleSchema.toString('hex'),
        contractName,
        functionName,
        schemaVersion,
        verboseErrorMessage
    );
    try {
        return JSON.parse(deserializedReturnValue);
    } catch (e) {
        throw new Error(
            'unable to deserialize the return value, due to: ' +
                deserializedReturnValue
        ); // In this case deserializedReturnValue is the error message from the rust module
    }
}

/**
 * Deserializes a receive function's error from a sequence of bytes into a json object.
 * @param errorBytes A buffer containing the error as raw bytes.
 * @param moduleSchema The raw module schema as a buffer.
 * @param contractName The name of the contract where the receive function is located.
 * @param functionName The name of the receive function which error you want to deserialize.
 * @param verboseErrorMessage Whether errors are in a verbose format or not. Defaults to `false`.
 */
export function deserializeReceiveError(
    errorBytes: Buffer,
    moduleSchema: Buffer,
    contractName: string,
    functionName: string,
    verboseErrorMessage = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
    const deserializedError = wasm.deserializeReceiveError(
        errorBytes.toString('hex'),
        moduleSchema.toString('hex'),
        contractName,
        functionName,
        verboseErrorMessage
    );
    try {
        return JSON.parse(deserializedError);
    } catch (e) {
        throw new Error(
            'unable to deserialize the error value, due to: ' +
                deserializedError
        ); // In this case deserializedError is the error message from the rust module
    }
}

/**
 * Deserializes an init function's error from a sequence of bytes into a json object.
 * @param errorBytes A buffer containing the error as raw bytes.
 * @param moduleSchema The raw module schema as a buffer.
 * @param contractName The name of the init function which error you want to deserialize.
 * @param verboseErrorMessage Whether errors are in a verbose format or not. Defaults to `false`.
 */
export function deserializeInitError(
    errorBytes: Buffer,
    moduleSchema: Buffer,
    contractName: string,
    verboseErrorMessage = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
    const deserializedError = wasm.deserializeInitError(
        errorBytes.toString('hex'),
        moduleSchema.toString('hex'),
        contractName,
        verboseErrorMessage
    );
    try {
        return JSON.parse(deserializedError);
    } catch (e) {
        throw new Error(
            'unable to deserialize the error value, due to: ' +
                deserializedError
        ); // In this case deserializedError is the error message from the rust module
    }
}

/**
 * Given a binary value for a smart contract type, and the raw schema for that type, deserialize the value into the JSON representation.
 * @param value the value that should be deserialized.
 * @param rawSchema the schema for the type that the given value should be deserialized as
 * @param verboseErrorMessage Whether errors are in a verbose format or not. Defaults to `false`.
 * @returns the deserialized value
 */
export function deserializeTypeValue(
    value: Buffer,
    rawSchema: Buffer,
    verboseErrorMessage = false
): SmartContractTypeValues {
    const deserializedValue = wasm.deserializeTypeValue(
        value.toString('hex'),
        rawSchema.toString('hex'),
        verboseErrorMessage
    );
    return JSON.parse(deserializedValue);
}
