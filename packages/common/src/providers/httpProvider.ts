import Provider, { JsonRpcRequest } from './provider';
import fetch from 'cross-fetch';
import JSONBig from 'json-bigint';
import { v4 as uuidv4 } from 'uuid';

export class HttpProvider implements Provider {
    request: JsonRpcRequest;
    cookie: string;

    /**
     * @param internalFetch Fetch function that performs the request. Defaults to using the cross-fetch package.
     */
    constructor(
        url: string,
        internalFetch: typeof fetch = fetch,
        onSetCookie?: (cookie: string) => void,
        initialCookie?: string,
        autoUpdateCookie = true
    ) {
        this.cookie = initialCookie || '';
        this.request = async function (method, params?) {
            const request = {
                method: method,
                params: params,
                id: uuidv4(),
                jsonrpc: '2.0',
            };

            const options = {
                method: 'POST',
                // Use JSONBig in order ensure bigints are automatically parsed (as numbers)
                body: JSONBig.stringify(request),
                headers: {
                    'Content-Type': 'application/json',
                    cookie: this.cookie,
                },
            };

            const res = await internalFetch(url, options);
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

            const setCookieValue = res.headers.get('set-cookie');
            if (onSetCookie && setCookieValue) {
                onSetCookie(setCookieValue);
                if (autoUpdateCookie) {
                    this.updateCookie(setCookieValue);
                }
            }

            return res.text();
        };
    }

    updateCookie(newCookie: string) {
        this.cookie = newCookie;
    }
}
