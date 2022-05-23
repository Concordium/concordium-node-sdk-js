import Provider, { JsonRpcResponse } from './provider';
import fetch from 'cross-fetch';

export class HttpProvider implements Provider {
    request: (
        method: string,
        params?: Record<string, unknown>
    ) => Promise<JsonRpcResponse>;
    nextId = 0;

    constructor(url: string) {
        this.request = async function (
            method: string,
            params?: Record<string, unknown>
        ) {
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

            const res = await fetch(url, options);
            if (res.status >= 400) {
                throw new Error('Bad response from server');
            }

            return res.json();
        };
    }
}
