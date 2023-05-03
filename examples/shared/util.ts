import { Base58String, ContractAddress } from '@concordium/common-sdk';

export const parseAddress = (input: string): Base58String | ContractAddress => {
    if (!input.includes(',')) {
        return input;
    }

    const [i, si] = input.split(',');
    return { index: BigInt(i), subindex: BigInt(si) };
};
