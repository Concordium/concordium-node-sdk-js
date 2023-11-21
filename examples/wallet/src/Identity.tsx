import { AttributeList, CredentialDeploymentTransaction, CredentialInput, IdentityObjectV1, getAccountAddress, signCredentialTransaction } from '@concordium/web-sdk';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { extractIdentityObjectUrl, fetchIdentity, getAccountSigningKey, sendCredentialDeploymentTransaction, getCryptographicParameters, getIdentityProviders, getDefaultTransactionExpiry } from './util';
import { mnemonicToSeedSync } from '@scure/bip39';
import { Buffer } from 'buffer/';
import { AccountWorkerInput } from './types';
import { credNumber, identityIndex, network, seedPhraseKey, selectedIdentityProviderKey } from './constants';

const worker = new Worker(new URL("./account-worker.ts", import.meta.url));

function DisplayIdentity({ attributes }: { attributes: AttributeList }) {
    return (
        <ul>
            <li>Name: {attributes.chosenAttributes.firstName} {attributes.chosenAttributes.lastName}</li>
            <li>Nationality: {attributes.chosenAttributes.nationality}</li>
        </ul>
    );
}

export function Identity() {
    const location = useLocation();
    const navigate = useNavigate();
    const [identity, setIdentity] = useState<IdentityObjectV1>();
    const seedPhrase = useMemo(() => localStorage.getItem(seedPhraseKey), []);
    const selectedIdentityProviderIdentity = useMemo(() => localStorage.getItem(selectedIdentityProviderKey), []);

    useEffect(() => {
        const identityObjectUrl = extractIdentityObjectUrl(location.hash);

        // To be able to create an account the identity is required. In a production
        // wallet the identity should be persisted, and not only kept in memory as in this
        // example.
        fetchIdentity(identityObjectUrl).then(setIdentity);
    }, [location.hash]);

    async function createAndSendAccount() {
        if (!identity || !seedPhrase || selectedIdentityProviderIdentity === null) {
            return;
        }

        const selectedIdentityProvider = (await getIdentityProviders()).find((idp) => idp.ipInfo.ipIdentity === Number.parseInt(selectedIdentityProviderIdentity));
        if (!selectedIdentityProvider) {
            return;
        }

        const listener = worker.onmessage = async (e: MessageEvent<CredentialDeploymentTransaction>) => {
            worker.removeEventListener('message', listener);
            const credentialDeploymentTransaction = e.data;
            const signingKey = getAccountSigningKey(seedPhrase, credentialDeploymentTransaction.unsignedCdi.ipIdentity);
            const signature = await signCredentialTransaction(credentialDeploymentTransaction, signingKey);
            await sendCredentialDeploymentTransaction(credentialDeploymentTransaction, signature);
            const accountAddress = getAccountAddress(credentialDeploymentTransaction.unsignedCdi.credId);
            navigate(`/account/${accountAddress.address}`);
        }

        const global = await getCryptographicParameters();
        const credentialInput: CredentialInput = {
            net: network,
            revealedAttributes: [],
            seedAsHex: Buffer.from(mnemonicToSeedSync(seedPhrase)).toString('hex'),
            idObject: identity,
            identityIndex,
            globalContext: global,
            credNumber,
            ipInfo: selectedIdentityProvider.ipInfo,
            arsInfos: selectedIdentityProvider.arsInfos
        };
        const expiry = getDefaultTransactionExpiry();
        const workerInput: AccountWorkerInput = {
            credentialInput,
            expiry
        };

        worker.postMessage(workerInput);
    }

    return (
        <>
            <h3>Your Concordium identity</h3>
            {identity &&
                <>
                    <DisplayIdentity attributes={identity.attributeList} />
                    <button onClick={createAndSendAccount}>Create account</button>
                </>
            }
        </>
    );
}
