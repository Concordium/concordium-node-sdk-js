import {
    AccountAddress,
    AccountSigner,
    ConcordiumGRPCClient,
    Transaction,
    TransactionExpiry,
} from '@concordium/web-sdk';

import { parseKeysFile } from '../../shared/util.js';

export function configure(walletFile: string, client: ConcordiumGRPCClient) {
    wallet = parseKeysFile(walletFile);
    grpcClient = client;
}

// #region documentation-snippet
let wallet: [AccountAddress.Type, AccountSigner]; // sponsor account + keys.
let grpcClient: ConcordiumGRPCClient; // connection to a node on the network.

/**
 * Sponsors the `transaction`, covering the transaction fees for the `sender`.
 *
 * @param sender - the account address of the sender. This is used to construct the transaction
 * header, which means that the transaction can only be submitted by that account using the next
 * sequence number (nonce) of that account at the time of sponsoring.
 * @param transaction - the transaction to sponsor, holding just the payload and the amount of energy
 * allowed for executing the payload on-chain.
 *
 * @returns A sponsored transaction, which must be signed by the sender and submitted to chain.
 */
export async function sponsorTransaction(
    sender: AccountAddress.Type,
    transaction: Transaction.JSON
): Promise<Transaction.JSON> {
    const builder = Transaction.builderFromJSON(transaction);
    const [sponsorAccount, sponsorSigner] = wallet;

    // A sponsor would probably want to do some validation of the transaction at this point, i.e.:
    // - is this a transaction I want to sponsor?
    // - can the sender successfully execute this transaction?

    // The sponsor constructs the final transaction to be signed by both parties.
    const senderNonce = await grpcClient.getNextAccountNonce(sender);
    const sponsorableTransaction = builder
        .addMetadata({ sender, nonce: senderNonce.nonce, expiry: TransactionExpiry.futureMinutes(5) })
        .addSponsor(sponsorAccount)
        .build();

    // Sponsor adds its signatures on the transaction and returns it to be signed by the sender.
    const sponsored = await Transaction.sponsor(sponsorableTransaction, sponsorSigner);
    return Transaction.toJSON(sponsored);
}
// #endregion documentation-snippet
