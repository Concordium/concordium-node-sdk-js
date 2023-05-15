import { isRpcError, RpcError } from '../src';

test('RPCError', () => {
    const rpcError: unknown = new RpcError('This is an RpcError');
    const regError = new Error('This is a regular Error');

    expect(isRpcError(rpcError)).toEqual(true);
    expect(isRpcError(regError)).toEqual(false);

    if (isRpcError(rpcError)) {
        expect(rpcError.code).toBeTruthy();
    }
});
