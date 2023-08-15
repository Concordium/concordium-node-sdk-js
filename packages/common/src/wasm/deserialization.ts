import { deserializeCredentialDeployment as deserializeCredentialDeploymentWasm } from '@concordium/rust-bindings/wallet';
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
    TypedCredentialDeployment,
} from '../types';

function deserializeCredentialDeployment(serializedDeployment: Cursor) {
    const raw = deserializeCredentialDeploymentWasm(
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
