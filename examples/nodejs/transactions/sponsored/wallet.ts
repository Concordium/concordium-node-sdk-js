import {
    AccountAddress,
    AccountSigner,
    ConcordiumGRPCClient,
    SequenceNumber,
    Transaction,
    TransactionExpiry,
    TransactionHash,
} from '@concordium/web-sdk';
import assert from 'assert';

import { parseKeysFile } from '../../shared/util.js';

export function configure(walletFile: string, client: ConcordiumGRPCClient) {
    wallet = parseKeysFile(walletFile);
    grpcClient = client;
}

// #region documentation-snippet
let wallet: [AccountAddress.Type, AccountSigner];
let grpcClient: ConcordiumGRPCClient;

/**
 * Get the "connected" account from the wallet
 * @returns The wallet (sender) account address.
 */
export function getAccount(): AccountAddress.Type {
    return wallet[0];
}

/**
 * @param transaction - The sponsored transaction to send
 * @returns
 */
export async function submitSponsoredTransaction(transaction: Transaction.Signable): Promise<TransactionHash.Type> {
    const [walletAccount, walletSigner] = wallet;
    const { sender, nonce, expiry } = transaction.header;

    // Validate that the sponsored transaction is well-formed.
    const senderNonce = await grpcClient.getNextAccountNonce(sender);
    const isSponsored = transaction.version === 1 && transaction.signatures.sponsor !== undefined;

    assert(isSponsored, 'Expected a sponsored transaction');
    assert(AccountAddress.equals(sender, walletAccount), 'Invalid transaction sender');
    assert(SequenceNumber.equals(nonce, senderNonce.nonce), 'Invalid nonce for sender');
    assert(TransactionExpiry.toDate(expiry) < new Date(), 'Transaction has expired');

    // Additionally, sender application would perform normal transaction validation here (except for being able to cover the
    // transaction fee):
    // - can the sender successfully execute the transaction payload?

    // Wallet adds its signature corresponding to the sender account and sbumits the transaction.
    const signed = await Transaction.signAndFinalize(transaction, walletSigner);
    return grpcClient.sendTransaction(signed);
}
// #endregion documentation-snippet
