import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    ModuleTransactionType,
    DeployModulePayload,
    AccountTransactionPayload,
} from '../src/types';
import * as ed from 'noble-ed25519';
import { getAccountTransactionSignDigest } from '../src/serialization';
import { getNodeClient } from './testHelpers';
import { AccountAddress } from '../src/types/accountAddress';
import { TransactionExpiry } from '../src/types/transactionExpiry';
import * as fs from 'fs';
import { Buffer } from 'buffer/';
const client = getNodeClient();
const senderAccountAddress =
    '3gLPtBSqSi7i7TEzDPpcpgD8zHiSbWEmn23QZH29A7hj4sMoL5';

/**
 *
 * @param filePath for the wasm file moudule
 * @returns Buffer of the wasm file
 */
function getByteArray(filePath: string): Buffer {
    const data = fs.readFileSync(filePath);
    return Buffer.from(data);
}

const wasmFilePath =
    '/home/omkarsunku/concordium-rust-smart-contracts/examples/piggy-bank/ind-bank/target/concordium/wasm32-unknown-unknown/release/d_bank.wasm';
test('deploy contract', async () => {
    const nextAccountNonce = await client.getNextAccountNonce(
        new AccountAddress(senderAccountAddress)
    );
    if (!nextAccountNonce) {
        throw new Error('Nonce not found!');
    }
    const header: AccountTransactionHeader = {
        expiry: new TransactionExpiry(new Date(Date.now() + 3600000)),
        nonce: nextAccountNonce.nonce,
        sender: new AccountAddress(senderAccountAddress),
    };

    const wasmFileBuffer = getByteArray(wasmFilePath) as Buffer;

    const deployModule: DeployModulePayload = {
        tag: ModuleTransactionType.DeployModule,
        content: wasmFileBuffer,
        length: wasmFileBuffer.length,
        version: 0,
    } as DeployModulePayload;

    const simpleTransferAccountTransaction: AccountTransaction = {
        header: header,
        payload: deployModule as AccountTransactionPayload,
        type: AccountTransactionType.DeployModule,
    };

    const signingKey =
        '631de9a98d274b56ea4e2f86eb134bfc414f4c366022f281335be0b2d45a8928';
    const hashToSign = getAccountTransactionSignDigest(
        simpleTransferAccountTransaction
    );
    const signature = Buffer.from(
        await ed.sign(hashToSign, signingKey)
    ).toString('hex');
    const signatures: AccountTransactionSignature = {
        0: {
            0: signature,
        },
    };

    const result = await client.sendAccountTransaction(
        simpleTransferAccountTransaction,
        signatures
    );

    const txs = await client.GetAccountNonFinalizedTransactions(
        new AccountAddress(senderAccountAddress)
    );
    console.log(txs);
    expect(result).toBeTruthy();
}, 300000);
