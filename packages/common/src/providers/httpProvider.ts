import { Buffer } from 'buffer/';
import {
    AccountTransaction,
    AccountTransactionSignature,
    NextAccountNonce,
    TransactionStatus,
} from '../types';
import { AccountAddress } from '../types/accountAddress';
import ConcordiumNodeProvider from './provider';
import fetch from 'cross-fetch';
import { serializeAccountTransactionForSubmission } from '../serialization';

export class HttpProvider implements ConcordiumNodeProvider {
    client: (method: string, params: object) => Promise<any>;
    nextId = 0;

    constructor(ip: string, port: number) {
        this.client = async function (method: string, params: object) {
            const request = {
                method: method,
                params: params,
                id: this.nextId++,
                jsonrpc: '2.0',
            };

            const options = {
                method: 'POST',
                body: JSON.stringify(request),
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            const res = await fetch(ip + ':' + port + '/json-rpc', options);
            if (res.status >= 400) {
                throw new Error('Bad response from server');
            }

            return res.json();
        };
    }

    async getNextAccountNonce(
        accountAddress: AccountAddress
    ): Promise<NextAccountNonce | undefined> {
        const res = await this.client('getNextAccountNonce', {
            address: accountAddress.address,
        });
        if (res.error) {
            throw new Error(res.error.code + ': ' + res.error.message);
        } else if (res.result) {
            const nonce = JSON.parse(res.result);
            return {
                nonce: BigInt(nonce.nonce),
                allFinal: nonce.allFinal,
            };
        }
        return undefined;
    }

    async getTransactionStatus(
        transactionHash: string
    ): Promise<TransactionStatus | undefined> {
        const res = await this.client('getTransactionStatus', {
            transactionHash: transactionHash,
        });
        console.log(res);
        if (res.error) {
            throw new Error(res.error.code + ': ' + res.error.message);
        } else if (res.result) {
            return JSON.parse(res.result);
        }
        return undefined;
    }

    async sendAccountTransaction(
        accountTransaction: AccountTransaction,
        signatures: AccountTransactionSignature
    ): Promise<boolean> {
        const serializedAccountTransaction: Buffer = Buffer.from(
            serializeAccountTransactionForSubmission(
                accountTransaction,
                signatures
            )
        );

        const res = await this.client('sendAccountTransaction', {
            transaction: serializedAccountTransaction.toString('base64'),
        });

        console.log(res);
        if (res.error) {
            throw new Error(res.error.code + ': ' + res.error.message);
        } else if (res.result) {
            return JSON.parse(res.result);
        }
        return false;
    }
}
