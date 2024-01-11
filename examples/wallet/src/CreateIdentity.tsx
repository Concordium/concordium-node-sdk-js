import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ConcordiumHdWallet,
    CryptographicParameters,
    IdObjectRequestV1,
    IdentityRequestWithKeysInput,
    Versioned,
} from '@concordium/web-sdk';
import { IdentityProviderWithMetadata } from './types';
import {
    determineAnonymityRevokerThreshold,
    getCryptographicParameters,
    getIdentityProviders,
    getRedirectUri,
    sendIdentityRequest,
} from './util';
import {
    identityIndex,
    network,
    seedPhraseKey,
    selectedIdentityProviderKey,
} from './constants';

const worker = new Worker(new URL('./identity-worker.ts', import.meta.url));

export function CreateIdentity() {
    const [createButtonDisabled, setCreateButtonDisabled] =
        useState<boolean>(false);
    const [identityProviders, setIdentityProviders] =
        useState<IdentityProviderWithMetadata[]>();
    const [selectedIdentityProvider, setSelectedIdentityProvider] =
        useState<IdentityProviderWithMetadata>();
    const [cryptographicParameters, setCryptographicParameters] =
        useState<CryptographicParameters>();
    const navigate = useNavigate();
    const dataLoaded =
        identityProviders !== undefined &&
        cryptographicParameters !== undefined &&
        selectedIdentityProvider !== undefined;
    const seedPhrase = useMemo(() => localStorage.getItem(seedPhraseKey), []);

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
        if (!dataLoaded || !seedPhrase) {
            return;
        }

        setCreateButtonDisabled(true);

        localStorage.setItem(
            selectedIdentityProviderKey,
            selectedIdentityProvider.ipInfo.ipIdentity.toString()
        );

        const listener = (worker.onmessage = async (
            e: MessageEvent<Versioned<IdObjectRequestV1>>
        ) => {
            const url = await sendIdentityRequest(
                e.data,
                selectedIdentityProvider.metadata.issuanceStart
            );
            if (!url?.includes(getRedirectUri())) {
                window.open(url);
            } else {
                window.alert('An error occurred during the identity creation.');
            }
            worker.removeEventListener('message', listener);
        });

        // Derive the required secret key material.
        const wallet = ConcordiumHdWallet.fromSeedPhrase(seedPhrase, network);
        const identityProviderIndex =
            selectedIdentityProvider.ipInfo.ipIdentity;
        const idCredSec = wallet
            .getIdCredSec(identityProviderIndex, identityIndex)
            .toString('hex');
        const prfKey = wallet
            .getPrfKey(identityProviderIndex, identityIndex)
            .toString('hex');
        const blindingRandomness = wallet
            .getSignatureBlindingRandomness(
                identityProviderIndex,
                identityIndex
            )
            .toString('hex');

        const identityRequestInput: IdentityRequestWithKeysInput = {
            arsInfos: selectedIdentityProvider.arsInfos,
            arThreshold: determineAnonymityRevokerThreshold(
                Object.keys(selectedIdentityProvider.arsInfos).length
            ),
            ipInfo: selectedIdentityProvider.ipInfo,
            globalContext: cryptographicParameters,
            idCredSec,
            prfKey,
            blindingRandomness,
        };
        worker.postMessage(identityRequestInput);
    }

    return (
        <div>
            <label>
                Select an identity provider
                <select
                    onChange={(e) =>
                        setSelectedIdentityProvider(
                            identityProviders[Number.parseInt(e.target.value)]
                        )
                    }
                >
                    {identityProviders.map((idp, index) => {
                        return (
                            <option value={index}>
                                {idp.ipInfo.ipDescription.name}
                            </option>
                        );
                    })}
                </select>
            </label>
            <button
                disabled={createButtonDisabled && dataLoaded}
                onClick={createIdentity}
            >
                Create identity
            </button>
            {createButtonDisabled && (
                <div>Generating identity request. This can take a while.</div>
            )}
        </div>
    );
}
