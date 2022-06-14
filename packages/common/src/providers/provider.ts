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

export type JsonRpcRequest = (
    ...args:
        | ['getNextAccountNonce', { address: string }]
        | ['getTransactionStatus', { transactionHash: string }]
        | ['getConsensusStatus']
        | [
              'getInstanceInfo',
              { blockHash: string; index: bigint; subindex: bigint }
          ]
        | ['sendAccountTransaction', { transaction: string }]
        | ['getAccountInfo', { address: string; blockHash: string }]
        | ['getCryptographicParameters', { blockHash: string }]
        | ['getModuleSource', { blockHash: string; moduleReference: string }]
) => Promise<string>;

export default interface Provider {
    request: JsonRpcRequest;
}
