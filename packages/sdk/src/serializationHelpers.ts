import { Buffer } from 'buffer/index.js';

import {
    BakerKeysWithProofs,
    ConfigureBakerPayload,
    ConfigureDelegationPayload,
    DelegationTarget,
    DelegationTargetType,
    UrlString,
    VerifyKey,
} from './types.js';
import { DataBlob } from './types/DataBlob.js';
import { isDefined } from './util.js';

export function serializeMap<K extends string | number | symbol, T>(
    map: Record<K, T>,
    encodeSize: (size: number) => Uint8Array,
    encodeKey: (k: string) => Uint8Array,
    encodeValue: (t: T) => Uint8Array
): Buffer {
    const keys = Object.keys(map);
    const buffers = [encodeSize(keys.length)];
    keys.forEach((key) => {
        buffers.push(encodeKey(key));
        buffers.push(encodeValue(map[key as K]));
    });
    return Buffer.concat(buffers);
}

export function serializeList<T>(
    list: T[],
    putSize: (size: number) => Uint8Array,
    putMember: (t: T) => Uint8Array
): Buffer {
    const buffers = [putSize(list.length)];
    list.forEach((member: T) => {
        buffers.push(putMember(member));
    });
    return Buffer.concat(buffers);
}

/**
 * Encodes a boolean to a Buffer using big endian.
 * @param value a boolean value
 * @returns boolean serialization of the input
 */
export function encodeBool(value: boolean): Buffer {
    const result = value === true ? 1 : 0;
    const arr = new ArrayBuffer(1);
    const view = new DataView(arr);
    view.setInt8(0, result);
    return Buffer.from(new Int8Array(arr));
}

/**
 * Encodes a 64 bit unsigned integer to a Buffer using big endian.
 * @param value a 64 bit integer
 * @param useLittleEndian a boolean value, if not given, the value is serialized in big endian.
 * @returns big endian serialization of the input
 */
export function encodeWord64(value: bigint, useLittleEndian = false): Buffer {
    if (value > 18446744073709551615n || value < 0n) {
        throw new Error('The input has to be a 64 bit unsigned integer but it was: ' + value);
    }
    const arr = new ArrayBuffer(8);
    const view = new DataView(arr);
    view.setBigUint64(0, value, useLittleEndian);
    return Buffer.from(new Uint8Array(arr));
}

/**
 * Encodes a 32 bit signed integer to a Buffer using big endian.
 * @param value a 32 bit integer
 * @param useLittleEndian a boolean value, if not given, the value is serialized in big endian.
 * @returns big endian serialization of the input
 */
export function encodeInt32(value: number, useLittleEndian = false): Buffer {
    if (value < -2147483648 || value > 2147483647 || !Number.isInteger(value)) {
        throw new Error('The input has to be a 32 bit signed integer but it was: ' + value);
    }
    const arr = new ArrayBuffer(4);
    const view = new DataView(arr);
    view.setInt32(0, value, useLittleEndian);
    return Buffer.from(new Int8Array(arr));
}

/**
 * Encodes a 32 bit unsigned integer to a Buffer.
 * @param value a 32 bit integer
 * @param useLittleEndian a boolean value, if not given, the value is serialized in big endian.
 * @returns big endian serialization of the input
 */
export function encodeWord32(value: number, useLittleEndian = false): Buffer {
    if (value > 4294967295 || value < 0 || !Number.isInteger(value)) {
        throw new Error('The input has to be a 32 bit unsigned integer but it was: ' + value);
    }
    const arr = new ArrayBuffer(4);
    const view = new DataView(arr);
    view.setUint32(0, value, useLittleEndian);
    return Buffer.from(new Uint8Array(arr));
}

/**
 * Encodes a 16 bit signed integer to a Buffer.
 * @param value a 16 bit integer
 * @param useLittleEndian a boolean value, if not given, the value is serialized in big endian.
 * @returns big endian serialization of the input
 */
export function encodeInt16(value: number, useLittleEndian = false): Buffer {
    if (value < -32768 || value > 32767 || !Number.isInteger(value)) {
        throw new Error('The input has to be a 16 bit signed integer but it was: ' + value);
    }
    const arr = new ArrayBuffer(2);
    const view = new DataView(arr);
    view.setInt16(0, value, useLittleEndian);
    return Buffer.from(new Int8Array(arr));
}

/**
 * Encodes a 16 bit unsigned integer to a Buffer using big endian.
 * @param value a 16 bit integer
 * @param useLittleEndian a boolean value, if not given, the value is serialized in big endian.
 * @returns big endian serialization of the input
 */
export function encodeWord16(value: number, useLittleEndian = false): Buffer {
    if (value > 65535 || value < 0 || !Number.isInteger(value)) {
        throw new Error('The input has to be a 16 bit unsigned integer but it was: ' + value);
    }
    const arr = new ArrayBuffer(2);
    const view = new DataView(arr);
    view.setUint16(0, value, useLittleEndian);
    return Buffer.from(new Uint8Array(arr));
}

/**
 * Encodes a 8 bit signed integer to a Buffer using big endian.
 * @param value a 8 bit integer
 * @returns big endian serialization of the input
 */
export function encodeInt8(value: number): Buffer {
    if (value > 127 || value < -128 || !Number.isInteger(value)) {
        throw new Error('The input has to be a 8 bit signed integer but it was: ' + value);
    }

    return Buffer.from(Buffer.of(value));
}

/**
 * Encodes a 8 bit unsigned integer to a Buffer using big endian.
 * @param value a 8 bit integer
 * @returns big endian serialization of the input
 */
export function encodeWord8(value: number): Buffer {
    if (value > 255 || value < 0 || !Number.isInteger(value)) {
        throw new Error('The input has to be a 8 bit unsigned integer but it was: ' + value);
    }
    return Buffer.from(Buffer.of(value));
}

export function encodeWord8FromString(value: string): Buffer {
    return encodeWord8(Number(value));
}

export function encodeWord16FromString(value: string, useLittleEndian = false): Buffer {
    return encodeWord16(Number(value), useLittleEndian);
}

/**
 * Encodes a Datablob.
 * @param blob Datablob containing data bytes.
 * @returns Buffer containing the length of the data and the data bytes.
 */
export function encodeDataBlob(blob: DataBlob): Buffer {
    const length = encodeWord16(blob.data.length);
    return Buffer.concat([length, blob.data]);
}

/**
 * Packing a buffer along with its length in 32 bits
 * @param buffer
 * @param useLittleEndian a boolean value, if not given, the value is serialized in big endian.
 * @returns Buffer containing the 32 bit length of buffer and buffer.
 */
export function packBufferWithWord32Length(buffer: Uint8Array, useLittleEndian = false): Buffer {
    const length = encodeWord32(buffer.length, useLittleEndian);
    return Buffer.concat([length, buffer]);
}

/**
 * Packing a buffer along the with offset of 16 bit length
 * @param buffer containing the buffer
 * @returns Buffer containing the length of the buffer of 16 bit and buffer.
 */
export function packBufferWithWord16Length(buffer: Uint8Array, useLittleEndian = false): Buffer {
    const length = encodeWord16(buffer.length, useLittleEndian);
    return Buffer.concat([length, buffer]);
}

/**
 * Packing a buffer along the with offset of 8 bit length
 * @param buffer containing the buffer
 * @returns Buffer containing the length of the buffer of 8 bit and buffer.
 */
export function packBufferWithWord8Length(buffer: Uint8Array): Buffer {
    const length = encodeWord8(buffer.length);
    return Buffer.concat([length, buffer]);
}

/**
 * Convert a hex string to a Buffer
 * @param str hex-encoded string
 * @returns Buffer
 */
export function encodeHexString(s: string): Buffer {
    return Buffer.from(s, 'hex');
}

enum SchemeId {
    Ed25519 = 0,
}

/**
 * Serializes a public key. The serialization includes the
 * scheme used for the key/
 * @param key the key to serialize
 * @returns the serialization of the key
 */
export function serializeVerifyKey(key: VerifyKey): Buffer {
    const scheme = key.schemeId as keyof typeof SchemeId;
    let schemeId;
    if (SchemeId[scheme] !== undefined) {
        schemeId = SchemeId[scheme];
    } else {
        throw new Error(`Unknown key type: ${scheme}`);
    }
    const keyBuffer = Buffer.from(key.verifyKey, 'hex');
    const serializedScheme = encodeWord8(schemeId);
    return Buffer.concat([serializedScheme, keyBuffer]);
}

/**
 * Serializes a year and month string.
 * @param yearMonth year and month formatted as "YYYYMM"
 * @returns the serialization of the year and month string
 */
export function serializeYearMonth(yearMonth: string): Buffer {
    const year = parseInt(yearMonth.substring(0, 4), 10);
    const month = parseInt(yearMonth.substring(4, 6), 10);
    const serializedYear = encodeWord16(year);
    const serializedMonth = encodeWord8(month);
    return Buffer.concat([serializedYear, serializedMonth]);
}

/**
 * Makes a bitmap for transactions with optional payload fields, where each bit indicates whether a value is included or not.
 *
 * @param payload the payload to generate the bitmap for
 * @param fieldOrder the order the payload fields are serialized in. The order is represented in the bitmap from right to left, i.e index 0 of the order translates to first bit.
 *
 * @example
 * getPayloadBitmap<{test?: string; test2?: string}>({test2: 'yes'}, ['test', 'test2']) // returns 2 (00000010 as bits of UInt8)
 * getPayloadBitmap<{test?: string; test2?: string; test3?: number}>({test: 'yes', test3: 100}, ['test', 'test2', 'test3']) // returns 5 (00000101 as bits of UInt8)
 */
function getPayloadBitmap<T>(payload: T, fieldOrder: Array<keyof T>) {
    return fieldOrder
        .map((k) => payload[k])
        .reduceRight(
            // eslint-disable-next-line no-bitwise
            (acc, cur) => (acc << 1) | Number(cur !== undefined),
            0
        );
}

/**
 * Makes a type with keys from Object and values being functions that take values with types of respective original values, returning a Buffer or undefined.
 */
type SerializationSpec<T> = Required<{
    [P in keyof T]: (v: T[P]) => Uint8Array | undefined;
}>;

/**
 * Given a specification describing how to serialize the fields of a payload of type T, this function produces a function
 * that serializes payloads of type T, returning a buffer of the serialized fields by order of occurance in serialization spec.
 */
const serializeFromSpec =
    <T>(spec: SerializationSpec<T>) =>
    (payload: T) => {
        const buffers = Object.keys(spec)
            .map((k) => {
                const v = payload[k as keyof T];
                const f = spec[k as keyof typeof spec] as (x: typeof v) => Uint8Array | undefined;
                return f(v);
            })
            .filter(isDefined);

        return Buffer.concat(buffers);
    };

/**
 * Takes a callback function taking 1 argument, returning a new function taking same argument, applying callback only if supplied argument is defined.
 */
export const orUndefined =
    <A, R>(fun: (v: A) => R) =>
    (v: A | undefined): R | undefined =>
        v !== undefined ? fun(v) : undefined;

function serializeDelegationTarget(target: DelegationTarget) {
    if (target.delegateType === DelegationTargetType.PassiveDelegation) {
        return encodeInt8(0);
    } else {
        return Buffer.concat([encodeInt8(1), encodeWord64(target.bakerId)]);
    }
}

export const configureDelegationSerializationSpec: SerializationSpec<ConfigureDelegationPayload> = {
    stake: orUndefined((x) => encodeWord64(x.microCcdAmount)),
    restakeEarnings: orUndefined(encodeBool),
    delegationTarget: orUndefined(serializeDelegationTarget),
};

export const getSerializedConfigureDelegationBitmap = (payload: ConfigureDelegationPayload): Buffer =>
    encodeWord16(
        getPayloadBitmap(
            payload,
            Object.keys(configureDelegationSerializationSpec) as Array<keyof ConfigureDelegationPayload>
        )
    );

export function serializeConfigureDelegationPayload(payload: ConfigureDelegationPayload): Buffer {
    const bitmap = getSerializedConfigureDelegationBitmap(payload);
    const serializedPayload = serializeFromSpec(configureDelegationSerializationSpec)(payload);

    return Buffer.concat([bitmap, serializedPayload]);
}

const serializeVerifyKeys = serializeFromSpec<BakerKeysWithProofs>({
    electionVerifyKey: encodeHexString,
    proofElection: encodeHexString,
    signatureVerifyKey: encodeHexString,
    proofSig: encodeHexString,
    aggregationVerifyKey: encodeHexString,
    proofAggregation: encodeHexString,
});

const serializeUrl = (url: UrlString) => {
    const data = Buffer.from(new TextEncoder().encode(url));
    const length = encodeWord16(data.length);
    return Buffer.concat([length, data]);
};

const configureBakerSerializationSpec: SerializationSpec<ConfigureBakerPayload> = {
    stake: orUndefined((v) => encodeWord64(v.microCcdAmount)),
    restakeEarnings: orUndefined(encodeBool),
    openForDelegation: orUndefined(encodeWord8),
    keys: orUndefined(serializeVerifyKeys),
    metadataUrl: orUndefined(serializeUrl),
    transactionFeeCommission: orUndefined(encodeWord32),
    bakingRewardCommission: orUndefined(encodeWord32),
    finalizationRewardCommission: orUndefined(encodeWord32),
    suspended: orUndefined(encodeBool),
};

const getSerializedConfigureBakerBitmap = (payload: ConfigureBakerPayload): Buffer =>
    encodeWord16(
        getPayloadBitmap(payload, Object.keys(configureBakerSerializationSpec) as Array<keyof ConfigureBakerPayload>)
    );

export function serializeConfigureBakerPayload(payload: ConfigureBakerPayload): Buffer {
    const bitmap = getSerializedConfigureBakerBitmap(payload);
    const serializedPayload = serializeFromSpec(configureBakerSerializationSpec)(payload);

    return Buffer.concat([bitmap, serializedPayload]);
}

/**
 * Takes a function which serializes a value, and returns a function that serializes an optional value
 * Prefixed with a byte indicating if a value follows or not.
 */
export const makeSerializeOptional =
    <T>(fun: (value: T) => Uint8Array): ((value: T | undefined) => Uint8Array) =>
    (value) => {
        if (value === undefined) {
            return encodeBool(false);
        }

        return Buffer.concat([encodeBool(true), fun(value)]);
    };

export const makeSerializeList =
    <T>(serialize: (input: T) => Uint8Array) =>
    (input: T[]): Buffer => {
        const n = encodeWord16(input.length, true);
        return Buffer.concat([n, ...input.map(serialize)]);
    };
