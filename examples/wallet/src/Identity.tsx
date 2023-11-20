import { AttributeList, ConcordiumHdWallet, IdentityObjectV1, getAccountAddress, signCredentialTransaction } from '@concordium/web-sdk';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import { credNumber, identityIndex } from './Index';
import { extractIdentityObjectUrl, createCredentialDeploymentTransaction, fetchIdentity, getAccountSigningKey, sendCredentialDeploymentTransaction } from './util';

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
    const [cookies] = useCookies(['seed-phrase-cookie']);
    const navigate = useNavigate();
    
    useEffect(() => {
        const identityObjectUrl = extractIdentityObjectUrl(location.hash);

        // To be able to create accounts from the identity, the identity must be 
        // persisted. As this is only a demonstration example we only keep it in memory.
        fetchIdentity(identityObjectUrl).then(setIdentity);
    }, [location.hash]);

    async function createAndSendAccount() {
        const seedPhrase = cookies['seed-phrase-cookie'] as string;
        if (!identity || !seedPhrase) {
            return;
        }

        const credentialDeploymentTransaction = await createCredentialDeploymentTransaction(identity, seedPhrase);
        const signingKey = getAccountSigningKey(seedPhrase, credentialDeploymentTransaction.unsignedCdi.ipIdentity, identityIndex, credNumber);
        const signature = await signCredentialTransaction(credentialDeploymentTransaction, signingKey);
        await sendCredentialDeploymentTransaction(credentialDeploymentTransaction, signature);
        
        const accountAddress = getAccountAddress(credentialDeploymentTransaction.unsignedCdi.credId);
        navigate(`/account/${accountAddress.address}`);
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
