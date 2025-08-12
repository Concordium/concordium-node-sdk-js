import {
    AccountAddress,
    AccountSigner,
    ContractAddress,
    buildAccountSigner,
    parseSimpleWallet,
    parseWallet,
} from '@concordium/web-sdk';
import { readFileSync } from 'node:fs';

export const parseAddress = (input: string): AccountAddress.Type | ContractAddress.Type => {
    if (!input.includes(',')) {
        return AccountAddress.fromBase58(input);
    }

    const [i, si] = input.split(',');
    const index = parseInt(i);
    const subindex = parseInt(si);
    if (isNaN(index) || isNaN(subindex)) {
        throw new Error('Invalid address');
    }
    return ContractAddress.create(index, subindex);
};

// Regular expression for matching the scheme prefix of a URL.
const schemeRegex = /^(\w+):\/\//;

/**
 * Parse endpoint information from a string, such as 'http://my-concordium-node:20000'
 * @param endpoint String with information of an endpoint.
 * @returns Triple with ['<address>', <port>, '<scheme>'].
 */
export const parseEndpoint = (endpoint: string): [string, number, string | undefined] => {
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

export const parseKeysFile = (path: string): [AccountAddress.Type, AccountSigner] => {
    const walletFile = readFileSync(path, 'utf8');
    let signer: AccountSigner;
    let sender: AccountAddress.Type;
    // Read wallet-file
    try {
        const wallet = parseWallet(walletFile);
        signer = buildAccountSigner(wallet);
        sender = AccountAddress.fromBase58(wallet.value.address);
    } catch (e) {
        // If the wallet file is not a wallet export, try to parse it as a simple wallet, i.e. genesis format
        const wallet = parseSimpleWallet(walletFile);
        sender = AccountAddress.fromBase58(wallet.address);
        signer = buildAccountSigner(wallet);
    }

    return [sender, signer];
};
