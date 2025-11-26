import * as wasm from '@concordium/rust-bindings/wallet';

import { deserializeUint8 } from '../deserialization.js';
import { Cursor } from '../deserializationHelpers.js';
import { AccountTransactionV0 } from '../transactions/index.js';
import { BlockItem, BlockItemKind } from '../types.js';

function deserializeCredentialDeployment(serializedDeployment: Cursor) {
    const raw = wasm.deserializeCredentialDeployment(serializedDeployment.read().toString('hex'));
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

/**
 * @deprecated use {@linkcode deserializeBlockItem} instead.
 *
 * Deserializes a transaction, from the binary format used to send it to the node, back into an js object.
 *
 * @param serializedTransaction A buffer containing the binary transaction. It is expected to start with the version and blockItemKind.
 * @returns An object specifiying the blockItemKind that the transaction has. The object also contains the actual transaction under the transaction field.
 **/
export function deserializeTransaction(serializedTransaction: ArrayBuffer): BlockItem {
    const cursor = Cursor.fromBuffer(serializedTransaction);

    const version = deserializeUint8(cursor);
    if (version !== 0) {
        throw new Error(
            'Supplied version ' + version + ' is not valid. Only transactions with version 0 format are supported'
        );
    }
    const blockItemKind = deserializeUint8(cursor);
    switch (blockItemKind) {
        case BlockItemKind.AccountTransactionKind:
            return {
                kind: BlockItemKind.AccountTransactionKind,
                transaction: AccountTransactionV0.deserialize(cursor),
            };
        case BlockItemKind.CredentialDeploymentKind:
            return {
                kind: BlockItemKind.CredentialDeploymentKind,
                transaction: deserializeCredentialDeployment(cursor),
            };
        case BlockItemKind.UpdateInstructionKind:
            throw new Error('deserialization of UpdateInstructions is not supported');
        default:
            throw new Error('Invalid blockItemKind');
    }
}

/**
 * Deserializes a block item its encoding.
 * @param buffer the buffer to deserialize.
 * @returns the block item corresonding to the encoding.
 */
export function deserializeBlockItem(value: ArrayBuffer | Cursor): BlockItem {
    const isRawBuffer = !(value instanceof Cursor);
    const cursor = isRawBuffer ? Cursor.fromBuffer(value) : value;

    const blockItemKind = deserializeUint8(cursor);
    
    let blockItem: BlockItem;
    switch (blockItemKind) {
        case BlockItemKind.AccountTransactionKind:
            blockItem = {
                kind: BlockItemKind.AccountTransactionKind,
                transaction: AccountTransactionV0.deserialize(cursor),
            };
            break;
        case BlockItemKind.CredentialDeploymentKind:
            blockItem = {
                kind: BlockItemKind.CredentialDeploymentKind,
                transaction: deserializeCredentialDeployment(cursor),
            };
            break;
        case BlockItemKind.UpdateInstructionKind:
            throw new Error('deserialization of UpdateInstructions is not supported');
        default:
            throw new Error('Invalid blockItemKind');
    }

    if (isRawBuffer && cursor.remainingBytes.length !== 0)
        throw new Error('Deserializing the transaction did not exhaust the buffer');
    return blockItem;
}
