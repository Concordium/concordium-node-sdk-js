import React, { useEffect, useState } from 'react';
import { seedPhraseCookie } from './Index';
import { useNavigate } from 'react-router-dom';
import { CryptographicParameters, IdObjectRequestV1, IdentityRequestInput, Versioned } from '@concordium/web-sdk';
import { IdentityProviderWithMetadata } from './types';
import { useCookies } from 'react-cookie';
import { determineAnonymityRevokerThreshold, getCryptographicParameters, getIdentityProviders, redirectUri, sendRequest } from './util';
import { mnemonicToSeedSync } from '@scure/bip39';
import { Buffer } from 'buffer/';

const worker = new Worker(new URL("./identity-worker.ts", import.meta.url));

export function CreateIdentity() {
    const [createButtonDisabled, setCreateButtonDisabled] = useState<boolean>(false);
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

        setCreateButtonDisabled(true);

        const listener = worker.onmessage = async (e: MessageEvent<Versioned<IdObjectRequestV1>>) => {
            const url = await sendRequest(e.data, selectedIdentityProvider.metadata.issuanceStart);
            if (!url?.includes(redirectUri)) {
                window.open(url);
            }
            worker.removeEventListener('message', listener);
        }

        const identityRequestInput: IdentityRequestInput = {
            net: 'Testnet',
            seed: Buffer.from(mnemonicToSeedSync(seedPhrase)).toString('hex'),
            identityIndex: selectedIdentityProvider.ipInfo.ipIdentity,
            arsInfos: selectedIdentityProvider.arsInfos,
            arThreshold: determineAnonymityRevokerThreshold(Object.keys(selectedIdentityProvider.arsInfos).length),
            ipInfo: selectedIdentityProvider.ipInfo,
            globalContext: cryptographicParameters
        };
        worker.postMessage(identityRequestInput);
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
            <button disabled={createButtonDisabled && dataLoaded} onClick={createIdentity}>Create identity</button>
            {createButtonDisabled && <div>Generating identity request. This can take a while.</div>}
        </div>
    );
}
