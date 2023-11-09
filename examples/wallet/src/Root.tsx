/* eslint-disable no-console */
import { ConcordiumGRPCWebClient, ConcordiumHdWallet, IdObjectRequestV1, IdentityProvider, IdentityRequestInput, Versioned, createIdentityRequest } from '@concordium/web-sdk';
import { mnemonicToSeedSync } from '@scure/bip39';
import React, { useEffect, useState } from 'react';
import { Buffer } from 'buffer/';

export interface IdentityProviderMetaData {
    issuanceStart: string;
    recoveryStart: string;
    icon: string;
    support: string;
}

const redirectUri = 'http://localhost:4173/identity';

// const seedPhrase = 'nuclear caution purse prosper primary gap snap chef youth rain virtual frozen silly economy motion group motion situate chimney rescue effort hint rival melt';
export const seedPhrase = 'hint initial anchor laundry effort brain shoe fancy forward trouble elbow pistol moment cement panic pioneer broom affair avoid various voyage slight excuse talent';

// The index of the identity to create. This index is part of the key derivation path used
// for generating the keys for the identity and any account created from it.
export const identityIndex = 2;

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

async function createIdentity() {
    const selectedIdentityProvider = await getIdentityProvider();


    const client = new ConcordiumGRPCWebClient('https://grpc.testnet.concordium.com', 20000);
    const global = await client.getCryptographicParameters();
    const seedCorrectFormat = Buffer.from(mnemonicToSeedSync(seedPhrase)).toString('hex');

    const identityRequestInput: IdentityRequestInput = {
        net: 'Testnet',
        seed: seedCorrectFormat,
        identityIndex,
        arsInfos: selectedIdentityProvider.arsInfos,
        arThreshold: Math.min(Object.keys(selectedIdentityProvider.arsInfos).length - 1, 255), // Explain this choice.
        ipInfo: selectedIdentityProvider.ipInfo,
        globalContext: global
    };

    return { identityRequestInput, provider: selectedIdentityProvider.metadata };
}

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

export default function Root() {
    const [input, setInput] = useState<IdentityRequestInput>();
    const [idpUrl, setIdpUrl] = useState<string>();

    let wallet = ConcordiumHdWallet.fromSeedPhrase(seedPhrase, 'Testnet');

    useEffect(() => {
        createIdentity().then((res) => { 
            setInput(res.identityRequestInput);
    
            const identityRequest = createIdentityRequest(res.identityRequestInput);
            sendRequest(identityRequest, res.provider.issuanceStart).then((idpUrl) => {
                setIdpUrl(idpUrl);
                if (!idpUrl?.includes(redirectUri)) {
                    window.open(idpUrl, "_blank", "noreferrer");
                }
            });

        });
    }, []);

    return (<div>
        {JSON.stringify(input)}
        </div>);
}
