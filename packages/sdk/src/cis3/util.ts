import * as ContractAddress from '../types/ContractAddress.js';
import * as Timestamp from '../types/Timestamp.js';
import * as EntrypointName from '../types/EntrypointName.js';
import * as Parameter from '../types/Parameter.js';
import * as AccountAddress from '../types/AccountAddress.js';
import {
    AccountTransactionSignature,
    Base58String,
    HexString,
} from '../types.js';
import {
    serializeAccountAddress,
    serializeContractAddress,
    serializeReceiveHookName,
} from '../cis2/util.js';
import { encodeWord16, encodeWord64 } from '../serializationHelpers.js';
import { serializeDate } from '../cis4/util.js';
import { serializeAccountTransactionSignature } from '../serialization.js';
import { makeDeserializeListResponse } from '../deserializationHelpers.js';

const PERMIT_PAYLOAD_MAX_LENGTH = 65535;
const SUPPORTS_PERMIT_QUERY_MAX_LENGTH = 65535;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CIS3 {
    /**
     * A `permit` message containing invokation information for an entrypoint, part of the CIS3 specification.
     */
    export type PermitMessage = {
        /** The address of the intended contract. */
        contractAddress: ContractAddress.Type;
        /** A nonce to prevent replay attacks. */
        nonce: bigint;
        /** The timestamp of the message. */
        timestamp: Timestamp.Type;
        /** The entrypoint to be invoked. */
        entrypoint: EntrypointName.Type;
        /** The parameters to be passed to the entrypoint. */
        payload: Parameter.Type;
    };

    /**
     * The parameters to the `permit` function according to the CIS3 specification.
     */
    export type PermitParam = {
        /** The signature of the sponsoree. */
        signature: AccountTransactionSignature;
        /** The address of the sponsoree. */
        signer: AccountAddress.Type;
        /** The signed message to be invoked by the contract. */
        message: PermitMessage;
    };

    /**
     * Structure of JSON-formatted CIS3 `permit` message used for transactions.
     */
    export type PermitMessageJson = {
        contract_address: { index: number; subindex: number };
        nonce: number;
        timestamp: Timestamp.SchemaValue;
        entry_point: string;
        payload: number[];
    };

    /**
     * Structure of JSON-formatted parameter used for CIS3 `permit` transactions.
     */
    export type PermitParamJson = {
        signature: [number, [number, { Ed25519: [HexString] }][]][];
        signer: Base58String;
        message: PermitMessageJson;
    };
}

/**
 * Serialize a {@link CIS3.PermitMessage} to a buffer according to the CIS3 standard.
 *
 * @param {CIS3.PermitMessage} message - The message to serialize.
 *
 * @returns {Buffer} The serialized message.
 */
export function serializeCIS3PermitMessage(
    message: CIS3.PermitMessage
): Buffer {
    const contract = serializeContractAddress(message.contractAddress);
    const nonce = encodeWord64(message.nonce, true);
    const timestamp = serializeDate(message.timestamp);
    const entryPoint = serializeReceiveHookName(message.entrypoint);
    const payload = serializeCIS3PermitPayload(message.payload);

    return Buffer.concat([contract, nonce, timestamp, entryPoint, payload]);
}

/**
 * Serialize a `permit` payload to a buffer according to the CIS3 standard.
 *
 * @param {Parameter.Type} payload - The payload to serialize.
 *
 * @returns {Buffer} The serialized payload.
 *
 * @throws If the payload is too large.
 */
export function serializeCIS3PermitPayload(payload: Parameter.Type): Buffer {
    const payloadBuffer = Parameter.toBuffer(payload);
    if (payloadBuffer.length > PERMIT_PAYLOAD_MAX_LENGTH) {
        throw new Error('Permit payload is too large');
    }
    const numBytes = encodeWord16(payloadBuffer.length, true);

    return Buffer.concat([numBytes, payloadBuffer]);
}

/**
 * Serialize a {@link CIS3.PermitParam} to a buffer according to the CIS3 standard.
 *
 * @param {CIS3.PermitParam} param - The parameter to serialize.
 *
 * @returns {Buffer} The serialized parameter.
 */
export function serializeCIS3PermitParam(param: CIS3.PermitParam): Buffer {
    const signature = serializeAccountTransactionSignature(
        param.signature,
        false
    );
    const signer = serializeAccountAddress(param.signer);
    const message = serializeCIS3PermitMessage(param.message);

    return Buffer.concat([signature, signer, message]);
}

/**
 * Serialize the parameters for `supportsPermit` to a buffer according to the CIS3 standard.
 * The paramteres are a list of {@link EntrypointName}.
 *
 * @param {EntrypointName.Type[]} params - The parameters to serialize.
 *
 * @returns {Buffer} The serialized parameters.
 *
 * @throws If the list of entrypoints is too long.
 */
export function serializeCIS3SupportsPermitQueryParams(
    params: EntrypointName.Type[]
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

/**
 * Deserialize a `supportsPermit` response from a buffer according to the CIS3 standard.
 *
 * @param {Buffer} cursor - The buffer to deserialize.
 *
 * @returns {boolean[]} The deserialized list of booleans indicating support for each entrypoint.
 */
export const deserializeCIS3SupportsPermitResponse =
    makeDeserializeListResponse((cursor) => {
        const value = Boolean(cursor.read(1).readUInt8(0));
        return value;
    });

/**
 * Format {@link CIS3.PermitParam} as a JSON compatible object.
 *
 * @param {CIS3.PermitParam} params - The parameters to format.
 *
 * @returns {CIS3.PermitParamJson} The formatted parameters.
 */
export function formatCIS3PermitParam(
    params: CIS3.PermitParam
): CIS3.PermitParamJson {
    return {
        signature: Object.entries(params.signature).map(([key1, innerMap]) => [
            parseInt(key1),
            Object.entries(innerMap).map(([key2, value]) => [
                parseInt(key2),
                { Ed25519: [value] },
            ]),
        ]),
        signer: AccountAddress.toBase58(params.signer),
        message: formatCIS3PermitMessage(params.message),
    };
}

/**
 * Format {@link CIS3.PermitMessage} as a JSON compatible object.
 *
 * @param {CIS3.PermitMessage} message - The message to format.
 *
 * @returns {CIS3.PermitMessageJson} The formatted message.
 */
function formatCIS3PermitMessage(
    message: CIS3.PermitMessage
): CIS3.PermitMessageJson {
    return {
        contract_address: {
            index: Number(message.contractAddress.index),
            subindex: Number(message.contractAddress.subindex),
        },
        nonce: Number(message.nonce),
        timestamp: Timestamp.toSchemaValue(message.timestamp),
        entry_point: EntrypointName.toString(message.entrypoint),
        payload: [...Parameter.toBuffer(message.payload)],
    };
}
