import { Buffer } from 'buffer/';
import {
    AccountTransaction,
    AccountTransactionSignature,
    NextAccountNonce,
    TransactionStatus,
} from './types';
import { AccountAddress } from './types/accountAddress';
import Provider, { JsonRpcResponse } from './providers/provider';
import { serializeAccountTransactionForSubmission } from './serialization';

function handleResponse<R>(
    res: JsonRpcResponse,
    transform: (res: any) => R = (result) => result
): R | undefined {
    if (res.error) {
        throw new Error(res.error.code + ': ' + res.error.message);
    } else if (res.result) {
        return transform(res.result);
    }
    return undefined;
}

export class JsonRpcClient {
    provider: Provider;

    constructor(provider: Provider) {
        this.provider = provider;
    }

    async getNextAccountNonce(
        accountAddress: AccountAddress
    ): Promise<NextAccountNonce | undefined> {
        const res = await this.provider.request('getNextAccountNonce', {
            address: accountAddress.address,
        });
        return handleResponse(res, (result) => ({
            nonce: BigInt(result.nonce),
            allFinal: result.allFinal,
        }));
    }

    async getTransactionStatus(
        transactionHash: string
    ): Promise<TransactionStatus | undefined> {
        const res = await this.provider.request('getTransactionStatus', {
            transactionHash: transactionHash,
        });
        return handleResponse(res);
    }

    async sendAccountTransaction(
        accountTransaction: AccountTransaction,
        signatures: AccountTransactionSignature
    ): Promise<boolean> {
        const serializedAccountTransaction: Buffer = Buffer.from(
            serializeAccountTransactionForSubmission(
                accountTransaction,
                signatures
            )
        );
        const res = await this.provider.request('sendAccountTransaction', {
            transaction: serializedAccountTransaction.toString('base64'),
        });
        return handleResponse(res) || false;
    }
}
