import { EncryptedTransferPayload } from './types';
import { AccountAddress } from './types/accountAddress';
import { GtuAmount } from './types/gtuAmount';
import * as wasm from '@concordium/rust-bindings';

interface NodeClient {
    getCryptographicParameters(
        blockHash: string
    ): Promise<Versioned<CryptographicParameters> | undefined>;
    getAccountInfo(
        accountAddress: Address | CredentialRegistrationId,
        blockHash: string
    ): Promise<AccountInfo | undefined>;
    getConsensusStatus(): Promise<ConsensusStatus>;
}

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
        throw new Error('Non Existent accounts');
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
