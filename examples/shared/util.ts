import { Base58String, ContractAddress } from '@concordium/node-sdk';

export const parseAddress = (input: string): Base58String | ContractAddress => {
    if (!input.includes(',')) {
        return input;
    }

    const [i, si] = input.split(',');
    return { index: BigInt(i), subindex: BigInt(si) };
};

export const parseEndpoint = (endpoint: string): [string, number] => {
    // Split endpoint on last colon
    const lastColonIndex = endpoint.lastIndexOf(':');
    const address = endpoint.substring(0, lastColonIndex);
    const port = Number(endpoint.substring(lastColonIndex + 1));

    return [address, port];
};
