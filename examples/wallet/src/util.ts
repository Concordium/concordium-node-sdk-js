import { ConcordiumGRPCWebClient, ConcordiumHdWallet, CredentialDeploymentTransaction, CredentialInput, IdentityObjectV1, TransactionExpiry, createCredentialTransaction, serializeCredentialDeploymentPayload, signCredentialTransaction } from "@concordium/web-sdk";
import { IdentityProviderWithMetadata } from "./types";
import { mnemonicToSeedSync } from "@scure/bip39";
import { credNumber, identityIndex } from "./Index";
import { Buffer } from 'buffer/';

/**
 * Utility function for extracting the URL where the identity object can be fetched
 * when ready.
 * @param path the hex part of the URL.
 * @returns the URL where the identity object can be fetched
 */
export function extractIdentityObjectUrl(path: string) {
    return path.split('#code_uri=')[1];
}

/**
 * Retrieves the list of identity providers and metadata about each provider. The metadata
 * contains the URL for where the identity issuance flow starts for that provider.
 * @returns the list of identity providers available.
 */
export async function getIdentityProviders(): Promise<IdentityProviderWithMetadata[]> {
    const response = await fetch('https://wallet-proxy.testnet.concordium.com/v1/ip_info');
    return response.json();
}

const client = new ConcordiumGRPCWebClient('https://grpc.testnet.concordium.com', 20000);

/**
 * Retrieves the global cryptographic parameters from a node.
 * @returns the global cryptographic parameters.
 */
export async function getCryptographicParameters() {
    const cryptographicParameters = await client.getCryptographicParameters();
    return cryptographicParameters;
}

export const DEFAULT_TRANSACTION_EXPIRY = 360000;

/**
 * Creates a credential deployment transaction.
 * @param identityObject the identity object that will be used for creating the credential
 * @param seedPhrase the seed phrase used to derive the keys for the credential
 * @returns a credential deployment transaction
 */
export async function createCredentialDeploymentTransaction(identityObject: IdentityObjectV1, seedPhrase: string) {
    const global = await getCryptographicParameters();

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
    return createCredentialTransaction(credentialInput, expiry);
}

/**
 * Fetches an identity at the provided URL.
 * 
 * An identity is not guaranteed to be available as soon as we have received the URL
 * for where to fetch it. Therefore a wallet must keep polling until the identity is
 * either confirmed or rejected by the identity provider.
 * 
 * For demonstration purposes, and as this wallet example is in memory, this method
 * will reject after some time. A production ready wallet should never abandon the polling,
 * but must only stop when the identity has either been confirmed or rejected.
 * @param identityObjectUrl the location received from the identity provider where we can fetch the identity
 * @returns the parsed identity object (if successful).
 */
export async function fetchIdentity(identityObjectUrl: string): Promise<IdentityObjectV1> {
    const maxRetries = 60;
    const timeoutMs = 5000;
    return new Promise(async (resolve, reject) => {
        let escapeCounter = 0;
        setTimeout(async function waitForIdentity() {
            try {
                const response = await fetch(identityObjectUrl);
                const responseJson = await response.json();
                return resolve(responseJson.token.identityObject.value);
            } catch {
                if (escapeCounter > maxRetries) {
                    return reject();
                } else {
                    escapeCounter += 1;
                    setTimeout(waitForIdentity, timeoutMs);
                }
            }
        }, timeoutMs);
    });
}

export function getAccountSigningKey(seedPhrase: string, ipIdentity: number, identityIndex: number, credNumber: number) {
    const wallet = ConcordiumHdWallet.fromSeedPhrase(seedPhrase, 'Testnet');
    return wallet.getAccountSigningKey(ipIdentity, identityIndex, credNumber).toString('hex');
}

export async function sendCredentialDeploymentTransaction(credentialDeployment: CredentialDeploymentTransaction, signature: string) {
    const payload = serializeCredentialDeploymentPayload([signature], credentialDeployment);
    return await client.sendCredentialDeploymentTransaction(payload, credentialDeployment.expiry);
}
