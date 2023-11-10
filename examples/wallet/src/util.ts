import { ConcordiumGRPCWebClient, CredentialDeploymentTransaction, CredentialInput, IdentityObjectV1, TransactionExpiry, createCredentialTransaction, serializeCredentialDeploymentPayload, signCredentialTransaction } from "@concordium/web-sdk";
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

export async function signAndSendCredentialDeploymentTransaction(credentialDeployment: CredentialDeploymentTransaction, signingKey: string) {
    const signature = await signCredentialTransaction(credentialDeployment, signingKey);
    const payload = serializeCredentialDeploymentPayload([signature], credentialDeployment);
    return await client.sendCredentialDeploymentTransaction(payload, credentialDeployment.expiry);
}
