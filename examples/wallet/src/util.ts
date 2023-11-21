import { AccountAddress, AccountInfo, AccountTransaction, AccountTransactionHeader, AccountTransactionType, CcdAmount, ConcordiumGRPCWebClient, ConcordiumHdWallet, CredentialDeploymentTransaction, CredentialInput, CryptographicParameters, IdObjectRequestV1, IdentityObjectV1, IdentityRequestInput, Network, SimpleTransferPayload, TransactionExpiry, Versioned, createCredentialTransaction, createIdentityRequest, serializeCredentialDeploymentPayload, signCredentialTransaction } from "@concordium/web-sdk";
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

export const client = new ConcordiumGRPCWebClient('https://grpc.testnet.concordium.com', 20000);

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


/**
 * Finds the optimal anonymity revoker threshold for the given count of
 * anonymity revokers for an identity provider. Here optimal is taken as being
 * #anonymity-revokers - 1.
 * @param anonymityRevokerCount the number of anonymity revokers for an identity provider
 * @returns the optimal anonymity revoker threshold possible
 */
export function determineAnonymityRevokerThreshold(anonymityRevokerCount: number) {
    return Math.min(anonymityRevokerCount - 1, 255);
}



export const redirectUri = 'http://localhost:4173/identity';

function buildURLwithSearchParameters(baseUrl: string, params: Record<string, string>) {
    const searchParams = new URLSearchParams(params);
    return Object.entries(params).length === 0 ? baseUrl : `${baseUrl}?${searchParams.toString()}`;
}

export async function sendRequest(idObjectRequest: Versioned<IdObjectRequestV1>, baseUrl: string) {
    const params = {
        scope: 'identity',
        response_type: 'code',
        redirect_uri: redirectUri,
        state: JSON.stringify({ idObjectRequest }),
    };

    const url = buildURLwithSearchParameters(baseUrl, params);
    const response = await fetch(url);

    // The identity creation protocol dictates that we will receive a redirect.
    if (!response.redirected) {
        // Something went wrong...
    } else {
        return response.url;
    }
}


export async function getAccount(accountAddress: AccountAddress.Type): Promise<AccountInfo> {
    const client = new ConcordiumGRPCWebClient('https://grpc.testnet.concordium.com', 20000);
    const maxRetries = 20;
    const timeoutMs = 1000;
    return new Promise(async (resolve, reject) => {
        let escapeCounter = 0;
        setTimeout(async function waitForAccount() {
            try {
                const accountInfo = await client.getAccountInfo(accountAddress);
                return resolve(accountInfo);
            } catch {
                if (escapeCounter > maxRetries) {
                    return reject();
                } else {
                    escapeCounter += 1;
                    setTimeout(waitForAccount, timeoutMs);
                }
            }
        }, timeoutMs);
    });
}

/**
 * Creates a simple transfer account transaction. This transaction sends an amount of CCD from
 * one account to another.
 * @param amount the amount of CCD to send
 * @param senderAddress the sender account address
 * @param toAddress the account address that the CCD will be sent to
 * @returns the simple transfer account transaction object
 */
export async function createSimpleTransferTransaction(amount: CcdAmount.Type, senderAddress: AccountAddress.Type, toAddress: AccountAddress.Type) {
    const payload: SimpleTransferPayload = {
        amount,
        toAddress
    };
    
    const nonce = (await client.getNextAccountNonce(senderAddress)).nonce;

    const header: AccountTransactionHeader = {
        expiry: TransactionExpiry.fromDate(new Date(Date.now() + DEFAULT_TRANSACTION_EXPIRY)),
        nonce,
        sender: senderAddress
    };

    const transaction: AccountTransaction = {
        type: AccountTransactionType.Transfer,
        payload,
        header
    };

    return transaction;
}
