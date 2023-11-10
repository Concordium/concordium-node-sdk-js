/* eslint-disable no-console */
import { ConcordiumGRPCWebClient, ConcordiumHdWallet, IdObjectRequestV1, IdentityProvider, IdentityRequestInput, Versioned, createIdentityRequest } from '@concordium/web-sdk';
import { mnemonicToSeedSync } from '@scure/bip39';
import React, { useState } from 'react';
import { Buffer } from 'buffer/';
import { useAtomValue, useSetAtom } from 'jotai';
import { networkAtom, seedPhraseAtom } from './Index';
import { useNavigate } from 'react-router-dom';
import { useCookies } from 'react-cookie';

export interface IdentityProviderMetaData {
    issuanceStart: string;
    recoveryStart: string;
    icon: string;
    support: string;
}

const redirectUri = 'http://localhost:4173/identity';

// The index of the identity to create. This index is part of the key derivation path used
// for generating the keys for the identity and any account created from it.
export const identityIndex = 0;

type IdentityProviderWithMetadata = IdentityProvider & { metadata: IdentityProviderMetaData };

/**
 * Retrieves the list of available identity providers from the Concordium wallet-proxy service.
 * @returns the list of identitiy providers
 */
async function getIdentityProviders(): Promise<IdentityProviderWithMetadata[]> {
    const response = await fetch('https://wallet-proxy.testnet.concordium.com/v1/ip_info');
    return response.json();
}

export async function getIdentityProvider() {
    return (await getIdentityProviders())[0];
}

export default function Root() {
    const [seedPhraseWords, setSeedPhraseWords] = useState<string>();
    const navigate = useNavigate();
    const network = useAtomValue(networkAtom);
    const setSeedPhrase = useSetAtom(seedPhraseAtom);
    const [cookies, setCookie, removeCookie] = useCookies(['seed-phrase-cookie'])

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!seedPhraseWords) {
            alert('Please input a seed phrase');
            return; 
        }

        try {
            setSeedPhrase(seedPhraseWords);
            setCookie('seed-phrase-cookie', seedPhraseWords);
            navigate('/create');
        } catch {
            alert('An invalid seed phrase was provided');
            return;
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Enter your seed phrase
                <input type="text" value={seedPhraseWords} onChange={(event) => setSeedPhraseWords(event.target.value)} />
            </label>
            <input type="submit" value="Submit" />
        </form>
    );
}
