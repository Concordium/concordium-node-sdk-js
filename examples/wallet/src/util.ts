import {
    AccountAddress,
    AccountInfo,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionType,
    CcdAmount,
    ConcordiumGRPCWebClient,
    ConcordiumHdWallet,
    CredentialDeploymentTransaction,
    IdObjectRequestV1,
    IdentityObjectV1,
    SimpleTransferPayload,
    TransactionExpiry,
    Versioned,
    serializeCredentialDeploymentPayload,
} from '@concordium/web-sdk';
import { IdentityProviderWithMetadata } from './types';
import { credNumber, identityIndex, network, redirectUri } from './constants';
import {
    IdentityProviderIdentityStatus,
    IdentityTokenContainer,
    sleep,
} from 'wallet-common-helpers';

export const client = new ConcordiumGRPCWebClient(
    'https://grpc.testnet.concordium.com',
    20000
);

/**
 * Creates a default transaction expiration that will ensure that the
 * transaction will be valid in time.
 * @returns a default transaction expiration to be used for transactions submitted soon after
 */
export function getDefaultTransactionExpiry() {
    const DEFAULT_TRANSACTION_EXPIRY = 360000;
    return TransactionExpiry.fromDate(
        new Date(Date.now() + DEFAULT_TRANSACTION_EXPIRY)
    );
}

/**
 * Derives an account signing key.
 *
 * For this example we only work with a single identity and a single account, therefore
 * those indices are hardcoded to 0. In a production wallet any number of identities and
 * accounts could be created.
 */
export function getAccountSigningKey(
    seedPhrase: string,
    identityProviderIdentity: number
) {
    const wallet = ConcordiumHdWallet.fromSeedPhrase(seedPhrase, network);
    return wallet
        .getAccountSigningKey(
            identityProviderIdentity,
            identityIndex,
            credNumber
        )
        .toString('hex');
}

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
export async function getIdentityProviders(): Promise<
    IdentityProviderWithMetadata[]
> {
    const response = await fetch(
        'https://wallet-proxy.testnet.concordium.com/v1/ip_info'
    );
    return response.json();
}

/**
 * Retrieves the global cryptographic parameters from a node.
 * @returns the global cryptographic parameters.
 */
export async function getCryptographicParameters() {
    const cryptographicParameters = await client.getCryptographicParameters();
    return cryptographicParameters;
}

/**
 * Convenience for creating a polling function that polls at a given interval.
 * @param intervalMS how much time between executing the provided function that should be looped
 * @param loopFun the function to execute in each loop
 */
export const loop = async (
    intervalMS: number,
    loopFun: () => Promise<boolean>
) => {
    const run = async () => {
        if (await loopFun()) {
            await sleep(intervalMS).then(run);
        }
    };
    await run();
};

/**
 * Fetches an identity at the provided URL.
 *
 * An identity is not guaranteed to be available as soon as we have received the URL
 * for where to fetch it. Therefore a wallet must keep polling until the identity is
 * either confirmed or rejected by the identity provider.
 * @param identityObjectUrl the location received from the identity provider where we can fetch the identity
 * @returns the parsed identity object (if successful). On reject the error message is given.
 */
export async function fetchIdentity(
    identityObjectUrl: string
): Promise<IdentityObjectV1> {
    const intervalMs = 5000;
    return new Promise(async (resolve, reject) => {
        await loop(intervalMs, async () => {
            try {
                const response = (await (
                    await fetch(identityObjectUrl)
                ).json()) as IdentityTokenContainer;
                if (IdentityProviderIdentityStatus.Done === response.status) {
                    resolve(response.token.identityObject.value);
                    return false;
                } else if (
                    IdentityProviderIdentityStatus.Error === response.status
                ) {
                    reject(response.detail);
                    return false;
                } else {
                    return true;
                }
            } catch {
                return true;
            }
        });
    });
}

/**
 * Serializes a credential deployment transaction and sends it to a node.
 * @param credentialDeployment the credential deployment to send
 * @param signature a signature on the credential deployment
 * @returns a promise with the transaction hash of the submitted credential deployment
 */
export async function sendCredentialDeploymentTransaction(
    credentialDeployment: CredentialDeploymentTransaction,
    signature: string
) {
    const payload = serializeCredentialDeploymentPayload(
        [signature],
        credentialDeployment
    );
    return await client.sendCredentialDeploymentTransaction(
        payload,
        credentialDeployment.expiry
    );
}

/**
 * Finds the optimal anonymity revoker threshold for the given count of
 * anonymity revokers for an identity provider. Here optimal is taken as being
 * #anonymity-revokers - 1.
 * @param anonymityRevokerCount the number of anonymity revokers for an identity provider
 * @returns the optimal anonymity revoker threshold possible
 */
export function determineAnonymityRevokerThreshold(
    anonymityRevokerCount: number
) {
    return Math.min(anonymityRevokerCount - 1, 255);
}

/**
 * Sends an identity object request, which is the start of the identity creation flow, to the
 * provided URL.
 * @param idObjectRequest the identity object request to send
 * @param baseUrl the identity issuance start URL
 * @returns the URL that the identity provider redirects to. This URL should be opened to continue the identity issuance flow.
 */
export async function sendIdentityRequest(
    idObjectRequest: Versioned<IdObjectRequestV1>,
    baseUrl: string
) {
    const params = {
        scope: 'identity',
        response_type: 'code',
        redirect_uri: redirectUri,
        state: JSON.stringify({ idObjectRequest }),
    };

    const searchParams = new URLSearchParams(params);
    const url = `${baseUrl}?${searchParams.toString()}`;
    const response = await fetch(url);

    // The identity creation protocol dictates that we will receive a redirect.
    // If we don't receive a redirect, then something went wrong at the identity
    // provider's side.
    if (!response.redirected) {
        throw new Error('The identity provider did not redirect as expected.');
    } else {
        return response.url;
    }
}

/**
 * Gets information about an account from the node. The method will continue to poll for some time
 * as the account might not be in a block when this is first called.
 * @param accountAddress the address of the account to retrieve the information about
 * @returns the account info
 */
export async function getAccount(
    accountAddress: AccountAddress.Type
): Promise<AccountInfo> {
    const maxRetries = 10;
    const intervalMs = 2500;
    let escapeCounter = 0;
    return new Promise(async (resolve, reject) => {
        await loop(intervalMs, async () => {
            try {
                const accountInfo = await client.getAccountInfo(accountAddress);
                resolve(accountInfo);
                return false;
            } catch {
                if (escapeCounter > maxRetries) {
                    reject();
                    return false;
                } else {
                    escapeCounter += 1;
                    return true;
                }
            }
        });
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
export async function createSimpleTransferTransaction(
    amount: CcdAmount.Type,
    senderAddress: AccountAddress.Type,
    toAddress: AccountAddress.Type
) {
    const payload: SimpleTransferPayload = {
        amount,
        toAddress,
    };
    const nonce = (await client.getNextAccountNonce(senderAddress)).nonce;

    const header: AccountTransactionHeader = {
        expiry: getDefaultTransactionExpiry(),
        nonce,
        sender: senderAddress,
    };

    const transaction: AccountTransaction = {
        type: AccountTransactionType.Transfer,
        payload,
        header,
    };

    return transaction;
}