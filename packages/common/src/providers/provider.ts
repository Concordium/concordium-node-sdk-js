/* eslint-disable @typescript-eslint/no-explicit-any */
interface JsonRpcResponseBase {
    jsonrpc: '2.0';
    id: string | null;
}

export interface JsonRpcResponseError extends JsonRpcResponseBase {
    error: {
        code: number;
        message: string;
        data?: any;
    };
    result?: never;
}

export interface JsonRpcResponseSuccess<Result> extends JsonRpcResponseBase {
    error?: never;
    result: Result;
}

export type JsonRpcResponse<Result> =
    | JsonRpcResponseError
    | JsonRpcResponseSuccess<Result>;

type JsonRpcRequest = (
    ...args:
        | ['getNextAccountNonce', { address: string }]
        | ['getTransactionStatus', { transactionHash: string }]
        | ['getConsensusStatus']
        | ['getInstanceInfo', { address: string; blockHash: string }]
        | ['sendAccountTransaction', { transaction: string }]
) => Promise<string>;

export default interface Provider {
    request: JsonRpcRequest;
}
