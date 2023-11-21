import { AttributeList, CredentialDeploymentTransaction, CredentialInput, IdentityObjectV1, getAccountAddress, signCredentialTransaction } from '@concordium/web-sdk';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import { credNumber, identityIndex } from './Index';
import { extractIdentityObjectUrl, fetchIdentity, getAccountSigningKey, sendCredentialDeploymentTransaction, getCryptographicParameters, getIdentityProviders, DEFAULT_TRANSACTION_EXPIRY, getDefaultTransactionExpiry } from './util';
import { mnemonicToSeedSync } from '@scure/bip39';
import { Buffer } from 'buffer/';
import { AccountWorkerInput } from './types';

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
    const [identity, setIdentity] = useState<IdentityObjectV1>();
    const [cookies] = useCookies(['seed-phrase-cookie', 'selected-identity-provider']);
    const navigate = useNavigate();

    useEffect(() => {
        const identityObjectUrl = extractIdentityObjectUrl(location.hash);

        // To be able to create an account the identity is required. In a production
        // wallet the identity should be persisted, and not only kept in memory as in this
        // example.
        fetchIdentity(identityObjectUrl).then(setIdentity);
    }, [location.hash]);

    async function createAndSendAccount() {
        const seedPhrase = cookies['seed-phrase-cookie'] as string;
        if (!identity || !seedPhrase) {
            return;
        }

        const selectedIpIdentity: number = cookies['selected-identity-provider'];
        const selectedIdentityProvider = (await getIdentityProviders()).find((idp) => idp.ipInfo.ipIdentity === selectedIpIdentity);
        if (!selectedIdentityProvider) {
            return;
        }

        const listener = worker.onmessage = async (e: MessageEvent<CredentialDeploymentTransaction>) => {
            worker.removeEventListener('message', listener);
            const credentialDeploymentTransaction = e.data;
            const signingKey = getAccountSigningKey(seedPhrase, credentialDeploymentTransaction.unsignedCdi.ipIdentity, identityIndex, credNumber);
            const signature = await signCredentialTransaction(credentialDeploymentTransaction, signingKey);
            await sendCredentialDeploymentTransaction(credentialDeploymentTransaction, signature);
            const accountAddress = getAccountAddress(credentialDeploymentTransaction.unsignedCdi.credId);
            navigate(`/account/${accountAddress.address}`);
        }

        const global = await getCryptographicParameters();
        const credentialInput: CredentialInput = {
            net: 'Testnet',
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
