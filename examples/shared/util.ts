import type { Base58String, ContractAddress } from '@concordium/node-sdk';

export const parseAddress = (input: string): Base58String | ContractAddress => {
    if (!input.includes(',')) {
        return input;
    }

    const [i, si] = input.split(',');
    return { index: BigInt(i), subindex: BigInt(si) };
};

// Regular expression for matching the scheme prefix of a URL.
const schemeRegex = /^(\w+):\/\//;

/**
 * Parse endpoint information from a string, such as 'http://my-concordium-node:20000'
 * @param endpoint String with information of an endpoint.
 * @returns Triple with ['<address>', <port>, '<scheme>'].
 */
export const parseEndpoint = (
    endpoint: string
): [string, number, string | undefined] => {
    const result = schemeRegex.exec(endpoint);
    const matched = result?.[0];
    const scheme = result?.[1];

    const noSchemeEndpoint = endpoint.substring(matched?.length ?? 0);

    // Split endpoint on last colon
    const lastColonIndex = noSchemeEndpoint.lastIndexOf(':');
    const address = noSchemeEndpoint.substring(0, lastColonIndex);
    const port = Number(noSchemeEndpoint.substring(lastColonIndex + 1));

    return [address, port, scheme];
};
