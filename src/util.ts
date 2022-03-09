/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReleaseSchedule } from '.';
import { BoolResponse, JsonResponse } from '../grpc/concordium_p2p_rpc_pb';
import { AccountTransactionSignature } from './types';

/**
 * Replaces a number in a JSON string with the same number as a
 * string, i.e. with quotes (") prior to and after the number. This
 * is needed as the default JSON parser cannot intepret BigInts
 * correctly when they arrive as JSON numbers.
 * @param jsonStruct the JSON structure as a string
 * @param keys the keys where the number has to be quoted
 * @returns the same JSON string where the numbers at the supplied keys are quoted
 */
function intToString(jsonStruct: string, keys: string[]): string {
    const result = jsonStruct;
    for (const key of keys) {
        result.replace(
            new RegExp(`"${key}":\\s*([0-9]+)`, 'g'),
            `"${key}":"$1"`
        );
    }
    return result;
}

export function intListToStringList(jsonStruct: string): string {
    return jsonStruct.replace(/(\-?[0-9]+)/g, '"$1"');
}

/**
 * A transformer that converts all the values provided as keys to
 * string values.
 * @param json the json to transform
 * @param bigIntPropertyKeys the keys in the json that must be converted to strings
 * @returns the transformed json where numbers have been replaced with strings
 */
export function intToStringTransformer(
    bigIntPropertyKeys: string[]
): (json: string) => string {
    return (json: string) => intToString(json, bigIntPropertyKeys);
}

/**
 * Unwraps a serialized bool response to the corresponding boolean/
 */
export function unwrapBoolResponse(serializedResponse: Uint8Array): boolean {
    return BoolResponse.deserializeBinary(serializedResponse).getValue();
}

/**
 * Unwraps a serialized JSON response.
 * @param serializedResponse the JSON response in bytes as received from the gRPC call
 * @param reviver JSON reviver function to change types while parsing
 * @param transformer a function to transform the JSON string prior to parsing the JSON
 * @returns the unwrapped, transformed and parsed JSON object
 */
export function unwrapJsonResponse<T>(
    serializedResponse: Uint8Array,
    reviver?: (this: unknown, key: string, value: unknown) => unknown,
    transformer?: (json: string) => string
): T | undefined {
    const jsonString =
        JsonResponse.deserializeBinary(serializedResponse).getValue();

    if (jsonString === 'null') {
        return undefined;
    }

    if (transformer) {
        const transformedJson = transformer(jsonString);
        return JSON.parse(transformedJson, reviver);
    }

    return JSON.parse(jsonString, reviver);
}

/**
 * Builds a JSON.parse() reviver function used to parse dates and big integers.
 * @param datePropertyKeys the JSON keys that must be parsed as dates
 * @param bigIntPropertyKeys the JSON keys that must be parsed as big integers
 * @returns a reviver function that handles dates and big integers
 */
export function buildJsonResponseReviver<T>(
    datePropertyKeys: (keyof T)[],
    bigIntPropertyKeys: (keyof T)[]
): (key: string, value: any) => any {
    return function reviver(key: string, value: any) {
        if (datePropertyKeys.includes(key as keyof T)) {
            // Note that we reduce the time precision from nano to milliseconds when doing this conversion.
            return new Date(value);
        } else if (bigIntPropertyKeys.includes(key as keyof T)) {
            // Handle the special case where amount is a scheduled amount,
            // which has an array structure.
            if (key === 'amount' && Array.isArray(value)) {
                const result: ReleaseSchedule[] = [];
                for (const entry of value) {
                    const schedule: ReleaseSchedule = {
                        timestamp: new Date(entry[0]),
                        amount: BigInt(entry[1]),
                    };
                    result.push(schedule);
                }
                return result;
            }
            return value === null ? value : BigInt(value);
        }
        return value;
    };
}

/**
 * Checks if the input string is a valid hexadecimal string.
 * @param str the string to check for hexadecimal
 */
export function isHex(str: string): boolean {
    return /^[A-F0-9]+$/i.test(str);
}

/**
 * Checks whether the input string looks to be a valid hash,
 * i.e. it has length 64 and consists of hexadecimal characters.
 * @param hash the string to check
 * @returns false if the string cannot be a valid hash, otherwise true
 */
export function isValidHash(hash: string): boolean {
    return hash.length === 64 && isHex(hash);
}

/**
 * Counts the total number of signatures.
 * @param accountSignatures the signature structure to count
 */
export function countSignatures(
    accountSignatures: AccountTransactionSignature
): bigint {
    let totalSignatureCount = 0n;
    const values = Object.values(accountSignatures);
    for (const credentialSignature of values) {
        const signatureCount = BigInt(Object.keys(credentialSignature).length);
        totalSignatureCount += signatureCount;
    }
    return totalSignatureCount;
}

/**
 * Convert a Date to seconds since epoch.
 */
export function secondsSinceEpoch(date: Date): bigint {
    return BigInt(Math.floor(date.getTime() / 1000));
}
