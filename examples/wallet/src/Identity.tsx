import { ConcordiumGRPCWebClient, ConcordiumHdWallet, CredentialDeploymentTransaction, CredentialInput, CredentialRegistrationId, IdentityObjectV1, TransactionExpiry, TransactionHash, createCredentialTransaction, serializeCredentialDeploymentPayload, signCredentialTransaction } from '@concordium/web-sdk';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import JSONPretty from 'react-json-pretty';
import { mnemonicToSeedSync } from '@scure/bip39';
import { getIdentityProvider, identityIndex, seedPhrase } from './Root';
import { Buffer } from 'buffer/';

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

async function createAccountRequest(identityObject: IdentityObjectV1) {
    const client = new ConcordiumGRPCWebClient('https://grpc.testnet.concordium.com', 20000);
    const global = await client.getCryptographicParameters();

    const selectedIdentityProvider = await getIdentityProvider();

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

async function sendAndSignAccountRequest(credentialDeployment: CredentialDeploymentTransaction) {
    const client = new ConcordiumGRPCWebClient('https://grpc.testnet.concordium.com', 20000);

    const signingKey = ConcordiumHdWallet.fromHex(Buffer.from(mnemonicToSeedSync(seedPhrase)).toString('hex'), 'Testnet').getAccountSigningKey(credentialDeployment.unsignedCdi.ipIdentity, identityIndex, credNumber).toString('hex');

    const signature = await signCredentialTransaction(credentialDeployment, signingKey);
    const payload = serializeCredentialDeploymentPayload([signature], credentialDeployment);

    const successful = await client.sendCredentialDeploymentTransaction(payload, credentialDeployment.expiry);
    return successful;
}

export function Identity() {
    const location = useLocation();
    const [identity, setIdentity] = useState<IdentityObjectV1>();
    const [accountAddress, setAccountAddress] = useState<string>();

    useEffect(() => {
        const identityObjectUrl = extractIdentityObjectUrl(location.hash);
        fetch(identityObjectUrl).then((response) => {

            // TODO Handle that the identity might be pending for a while.

            // To be able to later create accounts from the identity, the identity must be
            // persisted. As this is only a demonstration example we only keep it in memory.
            response.json().then((response) => {
                setIdentity(response);

                createAccountRequest(response.token.identityObject.value).then((req) => {
                    const client = new ConcordiumGRPCWebClient('https://grpc.testnet.concordium.com', 20000);
                    client.getAccountInfo(CredentialRegistrationId.fromHexString(req.unsignedCdi.credId)).then((info) => {
                        const existingAddress = info.accountAddress.address;
                        setAccountAddress(existingAddress);
                    }).catch(() => {
                        // Account does not already exist, so we can create it.
                        sendAndSignAccountRequest(req).then((hash) => {
                            console.log('sent request: ' + TransactionHash.toHexString(hash));
                        });
                    });
                });
            });
        });
    }, []);

    return (<div>This will fetch an identity. {identity && <JSONPretty data={JSON.stringify(identity)} />} {accountAddress && <div>{accountAddress}</div>} </div>);
}
