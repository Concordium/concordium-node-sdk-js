import {
    AccountTransaction,
    AccountTransactionSignature,
    NextAccountNonce,
    TransactionStatus,
} from '../types';
import { AccountAddress } from '../types/accountAddress';
import ConcordiumNodeProvider from './provider';
import fetch from 'cross-fetch';

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
        const res = await this.client('add', { foo: 1, bar: 2 });
        if (res.result) {
            return {
                nonce: BigInt(res.result),
                allFinal: true,
            };
        }
        return undefined;
    }

    getTransactionStatus(
        transactionHash: string
    ): Promise<TransactionStatus | undefined> {
        throw new Error('Not implemented yet');
    }

    sendAccountTransaction(
        accountTransaction: AccountTransaction,
        signatures: AccountTransactionSignature
    ): Promise<boolean> {
        throw new Error('Not implemented yet');
    }
}
