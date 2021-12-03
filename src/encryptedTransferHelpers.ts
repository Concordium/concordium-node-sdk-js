import { EncryptedTransferPayload } from './types';
import { AccountAddress } from './types/accountAddress';
import { GtuAmount } from './types/gtuAmount';
import ConcordiumNodeClient from './client';
import * as wasm from '../pkg/node_sdk_helpers';

export async function createEncryptedTransferPayload(
    sender: AccountAddress,
    receiver: AccountAddress,
    amount: GtuAmount,
    senderDecryptionKey: string,
    client: ConcordiumNodeClient
): Promise<EncryptedTransferPayload> {
    const blockhash = (await client.getConsensusStatus()).lastFinalizedBlock;
    const senderAccountInfo = await client.getAccountInfo(sender, blockhash);
    const receiverAccountInfo = await client.getAccountInfo(
        receiver,
        blockhash
    );

    const global = await client.getCryptographicParameters(blockhash);

    if (!senderAccountInfo || !receiverAccountInfo) {
        throw new Error('Non Existant accounts');
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
