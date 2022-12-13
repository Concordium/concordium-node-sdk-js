import { err, ok, Result } from 'neverthrow';
import { AccountTransactionPayload, CcdAmount, toBuffer } from '@concordium/web-sdk';
import { Info } from './Contract';

export function resultFromTruthy<T, E = string>(value: T | undefined, msg: E): Result<T, E> {
    if (value) {
        return ok(value);
    }
    return err(msg);
}

export function resultFromTruthyResult<T, E = string>(value: Result<T, E> | undefined, msg: E): Result<T, E> {
    return resultFromTruthy(value, msg).andThen((r) => r);
}

export function contractUpdatePayload(amount: CcdAmount, contract: Info, method: string, maxContractExecutionEnergy: bigint) {
    return {
        amount,
        address: {
            index: contract.index,
            subindex: BigInt(0),
        },
        receiveName: `${contract.name}.${method}`,
        maxContractExecutionEnergy,
        message: toBuffer(''),
    };
}

export function accountTransactionPayloadToJson(data: AccountTransactionPayload) {
    return JSON.stringify(data, (key, value) => {
        if (value instanceof CcdAmount) {
            return value.microCcdAmount.toString();
        }
        if (value?.type === 'Buffer') {
            // Buffer has already been transformed by its 'toJSON' method.
            return toBuffer(value.data).toString('hex');
        }
        if (typeof value === 'bigint') {
            return Number(value);
        }
        return value;
    });
}
