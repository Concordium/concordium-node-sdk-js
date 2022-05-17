import { Buffer } from 'buffer/';
import {
    AccountTransaction,
    AccountTransactionSignature,
    NextAccountNonce,
    TransactionStatus,
} from '../types';
import { AccountAddress } from '../types/accountAddress';
import Provider from './provider';
import fetch from 'cross-fetch';

export class HttpProvider implements Provider {
    request: (method: string, params: object) => Promise<any>;
    nextId = 0;

    constructor(ip: string, port: number) {
        this.request = async function (method: string, params: object) {
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

            const res = await fetch(ip + ':' + port, options);
            if (res.status >= 400) {
                throw new Error('Bad response from server');
            }

            return res.json();
        };
    }
}
