import * as wasm from '@concordium/rust-bindings';
import {
    EncryptedTransferPayload,
    Versioned,
    CryptographicParameters,
    AccountInfo,
    ConsensusStatus,
} from './types';
import { AccountAddress } from './types/accountAddress';
import { GtuAmount } from './types/gtuAmount';
import { CredentialRegistrationId } from './types/CredentialRegistrationId';

interface NodeClient {
    getCryptographicParameters(
        blockHash: string
    ): Promise<Versioned<CryptographicParameters> | undefined>;
    getAccountInfo(
        accountAddress: AccountAddress | CredentialRegistrationId,
        blockHash: string
    ): Promise<AccountInfo | undefined>;
    getConsensusStatus(): Promise<ConsensusStatus>;
}

/**
 * Function that builds the payload of an encrypted transfer.
 * @param sender address of the account that will send the transfer
 * @param receiver address of the account that will receive the transfer
 * @param amount the amount of ccd's that will be transfered
 * @param senderDecryptionKey the decryption key for the sender
 * @param client a node client to fetch accountInfo and parameters necessary to build the payload
 */
export async function createEncryptedTransferPayload(
    sender: AccountAddress,
    receiver: AccountAddress,
    amount: GtuAmount,
    senderDecryptionKey: string,
    client: NodeClient
): Promise<EncryptedTransferPayload> {
    const blockhash = (await client.getConsensusStatus()).lastFinalizedBlock;
    const senderAccountInfo = await client.getAccountInfo(sender, blockhash);
    const receiverAccountInfo = await client.getAccountInfo(
        receiver,
        blockhash
    );

    const global = await client.getCryptographicParameters(blockhash);

    if (!senderAccountInfo || !receiverAccountInfo) {
        throw new Error('Unable to get account info for both accounts');
    }

    if (!global) {
        throw new Error('Missing global');
    }

    const accountEncryptedAmount = senderAccountInfo.accountEncryptedAmount;

    const input = {
        amount: amount.microGtuAmount.toString(),
        receiverPublicKey: receiverAccountInfo.accountEncryptionKey,
        global: global.value,
        incomingAmounts: accountEncryptedAmount.incomingAmounts,
        encryptedSelfAmount: accountEncryptedAmount.selfAmount,
        aggIndex: (
            accountEncryptedAmount.startIndex +
            BigInt(accountEncryptedAmount.incomingAmounts.length)
        ).toString(),
        senderDecryptionKey,
    };

    const encryptedDataRaw = wasm.createEncryptedTransferData(
        JSON.stringify(input)
    );
    const encryptedData = JSON.parse(encryptedDataRaw);
    return {
        ...encryptedData,
        toAddress: receiver,
        index: BigInt(encryptedData.index),
    };
}
