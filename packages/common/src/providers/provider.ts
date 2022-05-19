/* eslint-disable @typescript-eslint/no-explicit-any */

export interface JsonRpcResponse {
    error?: {
        code: number;
        message: string;
        data: any;
    };
    result: any;
    jsonrpc: '2.0';
    id: number | null;
}
export default interface Provider {
    request: (
        method: string,
        params: Record<string, unknown>
    ) => Promise<JsonRpcResponse>;
}
