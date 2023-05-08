import { RpcError } from '@protobuf-ts/runtime-rpc';

export { RpcError };

export function isRpcError(error: unknown): error is RpcError {
    return error instanceof RpcError;
}
