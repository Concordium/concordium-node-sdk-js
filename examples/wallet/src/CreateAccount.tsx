import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mnemonicToSeedSync } from '@scure/bip39';
import { Buffer } from 'buffer/';
import { AccountWorkerInput } from './types';
import {
    credNumber,
    identityIndex,
    network,
    seedPhraseKey,
    selectedIdentityProviderKey,
} from './constants';
import {
    getAccountSigningKey,
    sendCredentialDeploymentTransaction,
    getCryptographicParameters,
    getIdentityProviders,
    getDefaultTransactionExpiry,
} from './util';
import {
    CredentialDeploymentTransaction,
    CredentialInput,
    IdentityObjectV1,
    getAccountAddress,
    signCredentialTransaction,
} from '@concordium/web-sdk';

const worker = new Worker(new URL('./account-worker.ts', import.meta.url));

export function CreateAccount({ identity }: { identity: IdentityObjectV1 }) {
    const navigate = useNavigate();
    const [createButtonDisabled, setCreateButtonDisabled] =
        useState<boolean>(false);
    const seedPhrase = useMemo(() => localStorage.getItem(seedPhraseKey), []);
    const selectedIdentityProviderIdentity = useMemo(
        () => localStorage.getItem(selectedIdentityProviderKey),
        []
    );

    async function createAndSendAccount() {
        setCreateButtonDisabled(true);

        if (!seedPhrase || selectedIdentityProviderIdentity === null) {
            setCreateButtonDisabled(false);
            return;
        }

        const selectedIdentityProvider = (await getIdentityProviders()).find(
            (idp) =>
                idp.ipInfo.ipIdentity ===
                Number.parseInt(selectedIdentityProviderIdentity)
        );
        if (!selectedIdentityProvider) {
            setCreateButtonDisabled(false);
            return;
        }

        const listener = (worker.onmessage = async (
            e: MessageEvent<CredentialDeploymentTransaction>
        ) => {
            worker.removeEventListener('message', listener);
            const credentialDeploymentTransaction = e.data;
            const signingKey = getAccountSigningKey(
                seedPhrase,
                credentialDeploymentTransaction.unsignedCdi.ipIdentity
            );
            const signature = await signCredentialTransaction(
                credentialDeploymentTransaction,
                signingKey
            );
            await sendCredentialDeploymentTransaction(
                credentialDeploymentTransaction,
                signature
            );
            const accountAddress = getAccountAddress(
                credentialDeploymentTransaction.unsignedCdi.credId
            );
            navigate(`/account/${accountAddress.address}`);
        });

        const global = await getCryptographicParameters();
        const credentialInput: CredentialInput = {
            net: network,
            revealedAttributes: [],
            seedAsHex: Buffer.from(mnemonicToSeedSync(seedPhrase)).toString(
                'hex'
            ),
            idObject: identity,
            identityIndex,
            globalContext: global,
            credNumber,
            ipInfo: selectedIdentityProvider.ipInfo,
            arsInfos: selectedIdentityProvider.arsInfos,
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
