import * as wasm from '@concordium/rust-bindings/wallet';

import { deserializeUint8 } from '../deserialization.js';
import { Cursor } from '../deserializationHelpers.js';
import { Upward } from '../grpc/upward.js';
import { AccountTransactionV0, AccountTransactionV1 } from '../transactions/index.js';
import { BlockItem, BlockItemKind } from '../types.js';

export function deserializeCredentialDeployment(serializedDeployment: Cursor) {
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
 * Deserializes a transaction from the block item encoding used to send it to a node.
 *
 * @param buffer A buffer containing transaction encoding. It is expected to start the _block item kind_.
 * @returns a block item.
 **/
export function deserializeBlockItem(buffer: ArrayBuffer): Upward<BlockItem> {
    const cursor = Cursor.fromBuffer(buffer);

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
        case BlockItemKind.AccountTransactionV1Kind:
            blockItem = {
                kind: BlockItemKind.AccountTransactionV1Kind,
                transaction: AccountTransactionV1.deserialize(cursor),
            };
            break;
        default:
            return null;
    }

    if (cursor.remainingBytes.length !== 0) throw new Error('Deserializing the transaction did not exhaust the buffer');
    return blockItem;
}
