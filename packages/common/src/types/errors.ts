import { RpcError } from '@protobuf-ts/runtime-rpc';

export { RpcError };

export function isRpcError(error: unknown): error is RpcError {
    const err = error as RpcError;
    return (
        err.code !== undefined &&
        err.meta !== undefined &&
        err.name !== undefined &&
        err.toString !== undefined
    );
}
