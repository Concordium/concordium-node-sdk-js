import { AttributeList, ConcordiumGRPCWebClient, ConcordiumHdWallet, CredentialDeploymentTransaction, CredentialInput, IdentityObjectV1, TransactionExpiry, createCredentialTransaction, getAccountAddress, serializeCredentialDeploymentPayload, signCredentialTransaction } from '@concordium/web-sdk';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { mnemonicToSeedSync } from '@scure/bip39';
import { Buffer } from 'buffer/';
import { useCookies } from 'react-cookie';
import { identityIndex } from './Index';
import { IdentityProviderWithMetadata } from './types';
import { getIdentityProviders } from './CreateIdentity';

export const DEFAULT_TRANSACTION_EXPIRY = 360000;
export const credNumber = 0;

/**
 * Utility function for extracting the URL where the identity object can be fetched
 * when ready.
 * @param path the hex part of the URL.
 * @returns the URL where the identity object can be fetched
 */
function extractIdentityObjectUrl(path: string) {
    return path.split('#code_uri=')[1];
}

async function createAccountRequest(identityObject: IdentityObjectV1, seedPhrase: string) {
    const client = new ConcordiumGRPCWebClient('https://grpc.testnet.concordium.com', 20000);
    const global = await client.getCryptographicParameters();

    // TODO Fix this. We only select identity provider once.
    const selectedIdentityProvider = (await getIdentityProviders())[0];

    const credentialInput: CredentialInput = {
        net: 'Testnet',
        revealedAttributes: [],
        seedAsHex: Buffer.from(mnemonicToSeedSync(seedPhrase)).toString('hex'),
        idObject: identityObject,
        identityIndex,
        globalContext: global,
        credNumber,
        ipInfo: selectedIdentityProvider.ipInfo,
        arsInfos: selectedIdentityProvider.arsInfos
    };

    const expiry = TransactionExpiry.fromDate(new Date(Date.now() + DEFAULT_TRANSACTION_EXPIRY));
    const request = createCredentialTransaction(credentialInput, expiry);
    return request;
}

async function sendAndSignAccountRequest(credentialDeployment: CredentialDeploymentTransaction, signingKey: string) {
    const client = new ConcordiumGRPCWebClient('https://grpc.testnet.concordium.com', 20000);
    const signature = await signCredentialTransaction(credentialDeployment, signingKey);
    const payload = serializeCredentialDeploymentPayload([signature], credentialDeployment);
    const successful = await client.sendCredentialDeploymentTransaction(payload, credentialDeployment.expiry);
    return successful;
}

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
    const [cookies, setCookie, removeCookie] = useCookies(['seed-phrase-cookie']);

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
        if (!identity) {
            return;
        }

        const seedPhrase = cookies['seed-phrase-cookie'];
        console.log(seedPhrase);
        
        const accountRequest = await createAccountRequest(identity, seedPhrase);
        const wallet = ConcordiumHdWallet.fromSeedPhrase(seedPhrase, 'Testnet');

        const signingKey = wallet.getAccountSigningKey(accountRequest.unsignedCdi.ipIdentity, identityIndex, credNumber).toString('hex');
        await sendAndSignAccountRequest(accountRequest, signingKey);
        const accountAddress = getAccountAddress(accountRequest.unsignedCdi.credId);
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
