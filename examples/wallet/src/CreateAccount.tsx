import {
    CredentialDeploymentTransaction,
    CredentialInputNoSeed,
    IdentityObjectV1,
    getAccountAddress,
    signCredentialTransaction,
} from '@concordium/web-sdk';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { credNumber, identityIndex, network, seedPhraseKey, selectedIdentityProviderKey } from './constants';
import { AccountWorkerInput } from './types';
import {
    createCredentialDeploymentKeysAndRandomness,
    getAccountSigningKey,
    getCryptographicParameters,
    getDefaultTransactionExpiry,
    getIdentityProviders,
    sendCredentialDeploymentTransaction,
} from './util';

const worker = new Worker(new URL('./account-worker.ts', import.meta.url));

export function CreateAccount({ identity }: { identity: IdentityObjectV1 }) {
    const navigate = useNavigate();
    const [createButtonDisabled, setCreateButtonDisabled] = useState<boolean>(false);
    const seedPhrase = useMemo(() => localStorage.getItem(seedPhraseKey), []);
    const selectedIdentityProviderIdentity = useMemo(() => localStorage.getItem(selectedIdentityProviderKey), []);

    async function createAndSendAccount() {
        setCreateButtonDisabled(true);

        if (!seedPhrase || selectedIdentityProviderIdentity === null) {
            setCreateButtonDisabled(false);
            return;
        }

        const selectedIdentityProvider = (await getIdentityProviders()).find(
            (idp) => idp.ipInfo.ipIdentity === Number.parseInt(selectedIdentityProviderIdentity)
        );
        if (!selectedIdentityProvider) {
            setCreateButtonDisabled(false);
            return;
        }

        const listener = (worker.onmessage = async (e: MessageEvent<CredentialDeploymentTransaction>) => {
            worker.removeEventListener('message', listener);
            const credentialDeploymentTransaction = e.data;
            const signingKey = getAccountSigningKey(seedPhrase, credentialDeploymentTransaction.unsignedCdi.ipIdentity);
            const signature = await signCredentialTransaction(credentialDeploymentTransaction, signingKey);
            await sendCredentialDeploymentTransaction(credentialDeploymentTransaction, signature);
            const accountAddress = getAccountAddress(credentialDeploymentTransaction.unsignedCdi.credId);
            navigate(`/account/${accountAddress.address}`);
        });

        const global = await getCryptographicParameters();

        const { idCredSec, prfKey, attributeRandomness, blindingRandomness, credentialPublicKeys } =
            createCredentialDeploymentKeysAndRandomness(
                seedPhrase,
                network,
                selectedIdentityProvider.ipInfo.ipIdentity,
                identityIndex,
                credNumber
            );

        const credentialInput: CredentialInputNoSeed = {
            revealedAttributes: [],
            idObject: identity,
            globalContext: global,
            credNumber,
            ipInfo: selectedIdentityProvider.ipInfo,
            arsInfos: selectedIdentityProvider.arsInfos,
            attributeRandomness,
            credentialPublicKeys,
            idCredSec,
            prfKey,
            sigRetrievelRandomness: blindingRandomness,
        };

        const expiry = getDefaultTransactionExpiry();
        const workerInput: AccountWorkerInput = {
            credentialInput,
            expiry,
        };

        worker.postMessage(workerInput);
    }

    return (
        <button disabled={createButtonDisabled} onClick={createAndSendAccount}>
            Create account
        </button>
    );
}
