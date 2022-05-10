import {
    AccountTransaction,
    AccountTransactionSignature,
    NextAccountNonce,
    TransactionStatus,
} from '../types';
import { AccountAddress } from '../types/accountAddress';
import { serializeAccountTransactionForSubmission } from '../serialization';

interface JsonRpcResponse {
    error?: {
        code: number;
        message: string;
        data: any;
    };
    result: any;
    jsonrpc: '2.0';
    id: number | null;
}

export interface Provider {
    request: (method: string, params: object) => Promise<JsonRpcResponse>;
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
        if (res.error) {
            throw new Error(res.error.code + ': ' + res.error.message);
        } else if (res.result) {
            const nonce = JSON.parse(res.result);
            return {
                nonce: BigInt(nonce.nonce),
                allFinal: nonce.allFinal,
            };
        }
        return undefined;
    }

    async getTransactionStatus(
        transactionHash: string
    ): Promise<TransactionStatus | undefined> {
        const res = await this.provider.request('getTransactionStatus', {
            transactionHash: transactionHash,
        });

        if (res.error) {
            throw new Error(res.error.code + ': ' + res.error.message);
        } else if (res.result) {
            return JSON.parse(res.result);
        }
        return undefined;
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

        if (res.error) {
            throw new Error(res.error.code + ': ' + res.error.message);
        } else if (res.result) {
            return JSON.parse(res.result);
        }
        return false;
    }
}
