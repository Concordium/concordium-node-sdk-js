import * as ContractAddress from '../types/ContractAddress.js';
import * as Timestamp from '../types/Timestamp.js';
import * as EntrypointName from '../types/EntrypointName.js';
import * as Parameter from '../types/Parameter.js';
import * as AccountAddress from '../types/AccountAddress.js';
import { AccountTransactionSignature } from '../types.js';
import {
    serializeAccountAddress,
    serializeContractAddress,
    serializeReceiveHookName,
} from '../cis2/util.js';
import { encodeWord16, encodeWord64 } from '../serializationHelpers.js';
import { serializeDate } from '../cis4/util.js';
import { serializeAccountTransactionSignature } from '../serialization.ts';

const PERMIT_PAYLOAD_MAX_LENGTH = 65535;
const SUPPORTS_PERMIT_QUERY_MAX_LENGTH = 65535;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CIS3 {
    export type PermitMessage = {
        contractAddress: ContractAddress.Type;
        nonce: bigint;
        timestamp: Timestamp.Type;
        entryPoint: EntrypointName.Type;
        payload: Parameter.Type;
    };

    export type PermitParam = {
        signature: AccountTransactionSignature;
        signer: AccountAddress.Type;
        message: PermitMessage;
    };

    export type SupportsPermitQueryParams = EntrypointName.Type[];
}

export function serializeCIS3PermitMessage(
    message: CIS3.PermitMessage
): Buffer {
    const contract = serializeContractAddress(message.contractAddress);
    const nonce = encodeWord64(message.nonce, true);
    const timestamp = serializeDate(message.timestamp);
    const entryPoint = serializeReceiveHookName(message.entryPoint);
    const payload = serializeCIS3PermitPayload(message.payload);

    return Buffer.concat([contract, nonce, timestamp, entryPoint, payload]);
}

export function serializeCIS3PermitPayload(payload: Parameter.Type): Buffer {
    const payloadBuffer = Parameter.toBuffer(payload);
    if (payloadBuffer.length > PERMIT_PAYLOAD_MAX_LENGTH) {
        throw new Error('Permit payload is too large');
    }
    const numBytes = encodeWord16(payloadBuffer.length, true);

    return Buffer.concat([numBytes, payloadBuffer]);
}

export function serializeCIS3PermitParam(param: CIS3.PermitParam): Buffer {
    const signature = serializeAccountTransactionSignature(param.signature);
    const signer = serializeAccountAddress(param.signer);
    const message = serializeCIS3PermitMessage(param.message);

    return Buffer.concat([signature, signer, message]);
}

export function serializeCIS3SupportsPermitQueryParams(
    params: CIS3.SupportsPermitQueryParams
): Buffer {
    if (params.length > SUPPORTS_PERMIT_QUERY_MAX_LENGTH) {
        throw new Error('Too many entrypoints');
    }
    const numQueries = encodeWord16(params.length, true);
    const encoded: (Buffer | Uint8Array)[] = [numQueries];
    for (const entrypoint of params) {
        encoded.push(serializeReceiveHookName(entrypoint));
    }

    return Buffer.concat(encoded);
}
