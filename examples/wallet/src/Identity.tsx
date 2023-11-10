import { AttributeList, ConcordiumHdWallet, IdentityObjectV1, getAccountAddress } from '@concordium/web-sdk';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import { credNumber, identityIndex } from './Index';
import { extractIdentityObjectUrl, createCredentialDeploymentTransaction, signAndSendCredentialDeploymentTransaction } from './util';

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
    const navigate = useNavigate();
    const [cookies] = useCookies(['seed-phrase-cookie']);

    useEffect(() => {
        const identityObjectUrl = extractIdentityObjectUrl(location.hash);
        fetch(identityObjectUrl).then((response) => {

            // TODO Handle that the identity might be pending for a while.

            // To be able to later create accounts from the identity, the identity must be
            // persisted. As this is only a demonstration example we only keep it in memory.
            response.json().then((response) => {
                console.log(response);
                // Provide better typing of the response(?)
                setIdentity(response.token.identityObject.value);
            });
        });
    }, []);

    async function onClick() {
        const seedPhrase = cookies['seed-phrase-cookie'] as string;
        if (!identity || !seedPhrase) {
            return;
        }

        const credentialDeploymentTransaction = await createCredentialDeploymentTransaction(identity, seedPhrase);
        const wallet = ConcordiumHdWallet.fromSeedPhrase(seedPhrase, 'Testnet');
        const signingKey = wallet.getAccountSigningKey(credentialDeploymentTransaction.unsignedCdi.ipIdentity, identityIndex, credNumber).toString('hex');
        await signAndSendCredentialDeploymentTransaction(credentialDeploymentTransaction, signingKey);
        const accountAddress = getAccountAddress(credentialDeploymentTransaction.unsignedCdi.credId);
        navigate(`/account/${accountAddress.address}`);
    }

    return (
        <>
            <h3>Your Concordium identity</h3> 
            {identity && 
                <>
                    <DisplayIdentity attributes={identity.attributeList} />
                    <button onClick={onClick}>Create account</button>
                </>
            }
        </>
    );
}
