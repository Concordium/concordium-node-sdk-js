import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CryptographicParameters,
    IdentityRecoveryRequestInput,
    IdRecoveryRequest,
} from '@concordium/web-sdk';
import { IdentityProviderWithMetadata } from './types';
import {
    getCryptographicParameters,
    getIdentityProviders,
    sendIdentityRecoveryRequest,
} from './util';
import { mnemonicToSeedSync } from '@scure/bip39';
import { Buffer } from 'buffer/';
import {
    identityIndex,
    identityObjectKey,
    network,
    seedPhraseKey,
    selectedIdentityProviderKey,
} from './constants';

const worker = new Worker(new URL('./recovery-worker.ts', import.meta.url));

export function RecoverIdentity() {
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
    const [recoveryFailed, setRecoveryFailed] = useState<string>();

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

    async function recoverIdentity() {
        if (!dataLoaded || !seedPhrase) {
            return;
        }

        setCreateButtonDisabled(true);

        localStorage.setItem(
            selectedIdentityProviderKey,
            selectedIdentityProvider.ipInfo.ipIdentity.toString()
        );

        const listener = (worker.onmessage = async (
            e: MessageEvent<IdRecoveryRequest>
        ) => {
            try {
                const url = await sendIdentityRecoveryRequest(
                    e.data,
                    selectedIdentityProvider.metadata.recoveryStart
                );
                worker.removeEventListener('message', listener);
                const response = await fetch(url);

                if (response.ok) {
                    const identity = await response.json();
                    localStorage.setItem(
                        identityObjectKey,
                        JSON.stringify(identity.value)
                    );
                }

                navigate('/identity');
            } catch (e) {
                setRecoveryFailed((e as Error).message);
            }
        });

        const identityRequestInput: IdentityRecoveryRequestInput = {
            net: network,
            seedAsHex: Buffer.from(mnemonicToSeedSync(seedPhrase)).toString(
                'hex'
            ),
            identityIndex: identityIndex,
            ipInfo: selectedIdentityProvider.ipInfo,
            globalContext: cryptographicParameters,
            timestamp: Math.floor(Date.now() / 1000),
        };
        worker.postMessage(identityRequestInput);
    }

    if (recoveryFailed) {
        return (
            <div>
                <h3>Recovery failed</h3>
                <p>Error: {recoveryFailed}</p>
                <button onClick={() => navigate('/create')}>
                    Go to identity creation
                </button>
            </div>
        );
    }

    return (
        <div>
            <h3>Identity Recovery</h3>
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
                onClick={recoverIdentity}
            >
                Recover identity
            </button>
            {createButtonDisabled && (
                <div>
                    Generating identity recovery request. This can take a while.
                </div>
            )}
        </div>
    );
}