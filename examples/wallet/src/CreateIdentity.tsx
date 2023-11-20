import React, { useEffect, useState } from 'react';
import { network, seedPhraseCookie } from './Index';
import { useNavigate } from 'react-router-dom';
import { CryptographicParameters } from '@concordium/web-sdk';
import { IdentityProviderWithMetadata } from './types';
import { useCookies } from 'react-cookie';
import { createIdentityObjectRequest, getCryptographicParameters, getIdentityProviders, redirectUri, sendRequest } from './util';

export function CreateIdentity() {
    const [identityProviders, setIdentityProviders] = useState<IdentityProviderWithMetadata[]>();
    const [selectedIdentityProvider, setSelectedIdentityProvider] = useState<IdentityProviderWithMetadata>();
    const [cryptographicParameters, setCryptographicParameters] = useState<CryptographicParameters>();
    const [cookies] = useCookies([seedPhraseCookie]);
    const seedPhrase = cookies[seedPhraseCookie];
    const navigate = useNavigate();
    const dataLoaded = identityProviders !== undefined && cryptographicParameters !== undefined && selectedIdentityProvider !== undefined;

    useEffect(() => {
        getIdentityProviders().then((idps) => {
            setIdentityProviders(idps);
            setSelectedIdentityProvider(idps[0]);
        });
        getCryptographicParameters().then(setCryptographicParameters);
    }, []);

    if (!seedPhrase) {
        // Someone navigated directly to this page without first setting up the wallet.
        // Move them to the initial setup page.
        navigate('/');
    }

    if (!dataLoaded) {
        // Loading identity providers and cryptographic parameters.
        return null;
    }

    async function createIdentity() {
        if (!dataLoaded) {
            return;
        }

        const identityObjectRequest = createIdentityObjectRequest(selectedIdentityProvider, cryptographicParameters, network, seedPhrase);
        const url = await sendRequest(identityObjectRequest, selectedIdentityProvider.metadata.issuanceStart);

        // TODO Explain why this check is required.
        if (!url?.includes(redirectUri)) {
            window.open(url);
        }
    }

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
            <button disabled={selectedIdentityProvider === undefined} onClick={createIdentity}>Create identity</button>
        </div>
    );
}
