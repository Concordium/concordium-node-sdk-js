import Provider, { JsonRpcRequest } from './provider';
import fetch from 'cross-fetch';
import { v4 as uuidv4 } from 'uuid';

export class HttpProvider implements Provider {
    request: JsonRpcRequest;

    constructor(url: string) {
        this.request = async function (method, params?) {
            const request = {
                method: method,
                params: params,
                id: uuidv4(),
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
                const json = await res.json();
                if (json.error) {
                    throw new Error(
                        `${json.error.code}: ${json.error.message} (id: ${json.id})`
                    );
                } else {
                    throw new Error(
                        `${res.status}: ${res.statusText} (id: ${json.id})`
                    );
                }
            }

            return res.text();
        };
    }
}
