import React, { useEffect, useState } from 'react';
import { identityIndex, network, seedPhraseCookie } from './Index';
import { useNavigate } from 'react-router-dom';
import { ConcordiumGRPCWebClient, CryptographicParameters, IdObjectRequestV1, IdentityProvider, IdentityRequestInput, Network, Versioned, createIdentityRequest } from '@concordium/web-sdk';
import { mnemonicToSeedSync } from '@scure/bip39';
import { Buffer } from 'buffer/';
import { IdentityProviderWithMetadata } from './types';
import { useCookies } from 'react-cookie';

export async function getIdentityProviders(): Promise<IdentityProviderWithMetadata[]> {
    const response = await fetch('https://wallet-proxy.testnet.concordium.com/v1/ip_info');
    return response.json();
}

function createIdentityObjectRequest(identityProvider: IdentityProviderWithMetadata, global: CryptographicParameters, network: Network, seedPhrase: string) {
    const seedCorrectFormat = Buffer.from(mnemonicToSeedSync(seedPhrase)).toString('hex');

    const identityRequestInput: IdentityRequestInput = {
        net: network,
        seed: seedCorrectFormat,
        identityIndex: identityIndex,
        arsInfos: identityProvider.arsInfos,
        // TODO Explain why this is chosen like this.
        arThreshold: Math.min(Object.keys(identityProvider.arsInfos).length - 1, 255),
        ipInfo: identityProvider.ipInfo,
        globalContext: global
    };
    return createIdentityRequest(identityRequestInput);
}

const redirectUri = 'http://localhost:4173/identity';

export function buildURLwithSearchParameters(baseUrl: string, params: Record<string, string>) {
    const searchParams = new URLSearchParams(params);
    return Object.entries(params).length === 0 ? baseUrl : `${baseUrl}?${searchParams.toString()}`;
}

async function sendRequest(idObjectRequest: Versioned<IdObjectRequestV1>, baseUrl: string) {
    const params = {
        scope: 'identity',
        response_type: 'code',
        redirect_uri: redirectUri,
        state: JSON.stringify({ idObjectRequest }),
    };

    const url = buildURLwithSearchParameters(baseUrl, params);
    const response = await fetch(url);
    
    // The identity creation protocol dictates that we will receive a redirect.
    if (!response.redirected) {
        // Something went wrong...
    } else {
        return response.url;
    }
}

export function CreateIdentity() {
    const [identityProviders, setIdentityProviders] = useState<IdentityProviderWithMetadata[]>();
    const [selectedIdentityProvider, setSelectedIdentityProvider] = useState<IdentityProviderWithMetadata>();
    const [cryptographicParameters, setCryptographicParameters] = useState<CryptographicParameters>();

    const [cookies] = useCookies([seedPhraseCookie]);
    const seedPhrase = cookies[seedPhraseCookie];
    const navigate = useNavigate();

    useEffect(() => {
        getIdentityProviders().then(setIdentityProviders);
        const client = new ConcordiumGRPCWebClient('https://grpc.testnet.concordium.com', 20000);
        client.getCryptographicParameters().then(setCryptographicParameters);
    }, []);

    if (!seedPhrase) {
        // Someone navigated directly to this page without first setting up the wallet.
        // Move them to the initial setup page.
        navigate('/');
    }

    if (!identityProviders || !cryptographicParameters || !seedPhrase) {
        // Loading data from state.
        return null;
    }

    async function onClick() {
        if (!selectedIdentityProvider || !cryptographicParameters || !seedPhrase) {
            return;
        }

        const request = createIdentityObjectRequest(selectedIdentityProvider, cryptographicParameters, network, seedPhrase);
        const url = await sendRequest(request, selectedIdentityProvider.metadata.issuanceStart);

        if (!url?.includes(redirectUri)) {
            window.open(url);
        }
    }

    // TODO Show some other text when the person is creating an identity.
    // TODO Prevent from sending more than one request.

    return (
        <div>
            <label>
                Select an identity provider
                <select onChange={(e) => setSelectedIdentityProvider(identityProviders[Number.parseInt(e.target.value)])}>
                    {identityProviders.map((idp, index) => {
                        return (<option value={index}>{idp.ipInfo.ipDescription.name}</option>);
                    })}
                </select>
            </label>
            <button disabled={selectedIdentityProvider === undefined} onClick={onClick}>Create identity</button>
        </div>
    );
}
