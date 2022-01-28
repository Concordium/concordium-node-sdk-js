import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    DeployModulePayload,
} from '../../src/types';
import * as ed from 'noble-ed25519';
import { getAccountTransactionSignDigest } from '../../src/serialization';
import { getNodeClient } from '../testHelpers';
import { AccountAddress } from '../../src/types/accountAddress';
import { TransactionExpiry } from '../../src/types/transactionExpiry';
import * as fs from 'fs';
import { Buffer } from 'buffer/';
const client = getNodeClient();
const senderAccountAddress =
    '4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M';
const wrongPrivateKey =
    '681de9a98d274b56eace2f86eb134bfc414f5c366022f281335be0b2d45a8988';
/**
 *
 * @param filePath for the wasm file moudule
 * @returns Buffer of the wasm file
 */
function getByteArray(filePath: string): Buffer {
    const data = fs.readFileSync(filePath);
    return Buffer.from(data);
}
// provide path for smart contract wasm file
const wasmFilePath = 'test/ind_bank.wasm';
// test case for deploy contract
test('deploy contract with the wrong private key', async () => {
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
        content: wasmFileBuffer,
        version: 0,
    };

    const deployModuleTransaction: AccountTransaction = {
        header: header,
        payload: deployModule,
        type: AccountTransactionType.DeployModule,
    };

    const hashToSign = getAccountTransactionSignDigest(deployModuleTransaction);
    const signature = Buffer.from(
        await ed.sign(hashToSign, wrongPrivateKey)
    ).toString('hex');
    const signatures: AccountTransactionSignature = {
        0: {
            0: signature,
        },
    };

    const result = await client.sendAccountTransaction(
        deployModuleTransaction,
        signatures
    );

    expect(result).toBeTruthy();
}, 300000);
