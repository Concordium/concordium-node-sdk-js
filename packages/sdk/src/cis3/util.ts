import { Buffer } from 'buffer/index.js';

import { serializeAccountAddress, serializeContractAddress, serializeReceiveHookName } from '../cis2/util.js';
import { serializeDate } from '../cis4/util.js';
import { deserializeUint8 } from '../deserialization.js';
import { Cursor, makeDeserializeListResponse } from '../deserializationHelpers.js';
import { isKnown } from '../grpc/index.js';
import {
    encodeWord8,
    encodeWord8FromString,
    encodeWord16,
    encodeWord64,
    serializeMap,
} from '../serializationHelpers.js';
import {
    AccountTransactionSignature,
    Base58String,
    BlockItemSummary,
    ContractTraceEvent,
    CredentialSignature,
    HexString,
    InvokeContractSuccessResult,
    TransactionKindString,
    TransactionSummaryType,
} from '../types.js';
import * as AccountAddress from '../types/AccountAddress.js';
import * as ContractAddress from '../types/ContractAddress.js';
import * as ContractEvent from '../types/ContractEvent.js';
import * as EntrypointName from '../types/EntrypointName.js';
import * as Parameter from '../types/Parameter.js';
import * as Timestamp from '../types/Timestamp.js';

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

    /**
     * The type of a CIS-3 event.
     * @see {@linkcode Event}
     */
    export enum EventType {
        Nonce,
        Custom,
    }

    /**
     * A CIS-3 nonce event. This event is logged every time the `permit` function is invoked.
     */
    export type NonceEvent = {
        /** The type of the event */
        type: EventType.Nonce;
        /** The nonce used for the `permit` invocation */
        nonce: bigint;
        /** The address of the sponsoree */
        sponsoree: AccountAddress.Type;
    };

    /**
     * A custom event outside CIS-3.
     */
    export type CustomEvent = {
        /** The type of the event */
        type: EventType.Custom;
        /** The raw data of the custom event */
        data: Uint8Array;
    };

    /**
     * A CIS-3 event.
     */
    export type Event = NonceEvent | CustomEvent;
}

/**
 * Serialize a {@link CIS3.PermitMessage} to a buffer according to the CIS3 standard.
 *
 * @param {CIS3.PermitMessage} message - The message to serialize.
 *
 * @returns {Buffer} The serialized message.
 */
export function serializeCIS3PermitMessage(message: CIS3.PermitMessage): Buffer {
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
    const signature = serializeCIS3AccountTransactionSignature(param.signature);
    const signer = serializeAccountAddress(param.signer);
    const message = serializeCIS3PermitMessage(param.message);

    return Buffer.concat([signature, signer, message]);
}

/**
 * Serializes a map of account transaction signatures according to the CIS-3 standard.
 * If no signatures are provided, then an error is thrown.
 */
export function serializeCIS3AccountTransactionSignature(signatures: AccountTransactionSignature): Buffer {
    if (Object.keys(signatures).length === 0) {
        throw new Error('No signatures were provided');
    }

    const putSignature = (signature: string) => {
        const signatureBytes = Buffer.from(signature, 'hex');
        // CIS-3 requires a 0 byte prefix for each signature
        return Buffer.concat([Buffer.from([0]), signatureBytes]);
    };
    const putCredentialSignatures = (credSig: CredentialSignature) =>
        serializeMap(credSig, encodeWord8, encodeWord8FromString, putSignature);
    return serializeMap(signatures, encodeWord8, encodeWord8FromString, putCredentialSignatures);
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
export function serializeCIS3SupportsPermitQueryParams(params: EntrypointName.Type[]): Buffer {
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
export const deserializeCIS3SupportsPermitResponse = makeDeserializeListResponse((cursor) => {
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
export function formatCIS3PermitParam(params: CIS3.PermitParam): CIS3.PermitParamJson {
    return {
        signature: Object.entries(params.signature).map(([key1, innerMap]) => [
            parseInt(key1),
            Object.entries(innerMap).map(([key2, value]) => [parseInt(key2), { Ed25519: [value] }]),
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
 *
 * @throws If the of the message is outside of the safe integer range.
 */
function formatCIS3PermitMessage(message: CIS3.PermitMessage): CIS3.PermitMessageJson {
    if (message.nonce < Number.MIN_SAFE_INTEGER || message.nonce > Number.MAX_SAFE_INTEGER) {
        throw new Error('Nonce is too large');
    }

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

/**
 * Deserializes a CIS-3 event according to the CIS-3 standard.
 *
 * @param {ContractEvent.Type} event - The event to deserialize
 *
 * @returns {CIS3.Event} The deserialized event
 */
export function deserializeCIS3Event(event: ContractEvent.Type): CIS3.Event {
    const buffer = event.buffer;
    // An empty buffer is a valid custom event
    if (buffer.length === 0) {
        return {
            type: CIS3.EventType.Custom,
            data: buffer,
        };
    }

    const cursor = Cursor.fromBuffer(buffer);
    const tag = deserializeUint8(cursor);
    if (tag == 250) {
        // Nonce event
        const nonce = cursor.read(8).readBigUInt64LE(0).valueOf();
        const sponsoree = AccountAddress.fromBuffer(cursor.read(32));

        return {
            type: CIS3.EventType.Nonce,
            nonce,
            sponsoree,
        };
    } else {
        // Custom event
        return {
            type: CIS3.EventType.Custom,
            data: buffer,
        };
    }
}

/**
 * Deserializes a successful contract invokation to a list of CIS-3 events according to the CIS-3 standard.
 *
 * @param {InvokeContractSuccessResult} result - The contract invokation result to deserialize
 *
 * @returns {CIS3.NonceEvent[]} The deserialized `nonce` events
 */
export function deserializeCIS3EventsFromInvokationResult(result: InvokeContractSuccessResult): CIS3.NonceEvent[] {
    return deserializeCIS3ContractTraceEvents(result.events.filter(isKnown));
}

/**
 * Deserializes all CIS-3 `nonce` events (skipping custom events) from a {@linkcode BlockItemSummary}.
 *
 * @param {BlockItemSummary} summary - The summary to deserialize
 *
 * @returns {CIS3.NonceEvent[]} The deserialized `nonce` events
 */
export function deserializeCIS3EventsFromSummary(summary: BlockItemSummary): CIS3.NonceEvent[] {
    if (summary.type !== TransactionSummaryType.AccountTransaction) {
        return [];
    }

    switch (summary.transactionType) {
        case TransactionKindString.Update:
            return deserializeCIS3ContractTraceEvents(summary.events.filter(isKnown));
        case TransactionKindString.InitContract:
            const deserializedEvents = [];
            for (const event of summary.contractInitialized.events) {
                const deserializedEvent = deserializeCIS3Event(ContractEvent.fromHexString(event));
                if (deserializedEvent.type === CIS3.EventType.Nonce) {
                    deserializedEvents.push(deserializedEvent);
                }
            }
            return deserializedEvents;
        default:
            return [];
    }
}

/**
 * Deserializes a list of {@linkcode ContractTraceEvent} into a list of CIS-3 events.
 * This function filters out any custom events, and so only returns {@linkcode CIS3.NonceEvent}.
 *
 * @param {ContractTraceEvent[]} events - The list of contract trace events to deserialize
 *
 * @returns {CIS3.NonceEvent[]} The deserialized CIS-3 `nonce` events
 */
function deserializeCIS3ContractTraceEvents(events: ContractTraceEvent[]): CIS3.NonceEvent[] {
    const deserializedEvents = [];
    for (const traceEvent of events) {
        if (!('events' in traceEvent)) {
            continue;
        }
        for (const event of traceEvent.events) {
            const deserializedEvent = deserializeCIS3Event(event);
            if (deserializedEvent.type === CIS3.EventType.Nonce) {
                deserializedEvents.push(deserializedEvent);
            }
        }
    }
    return deserializedEvents;
}
