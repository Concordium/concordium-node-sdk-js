/* eslint-disable @typescript-eslint/no-explicit-any */
import { AccountTransactionSignature, ReleaseSchedule } from './types';

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
    let result = jsonStruct;
    for (const key of keys) {
        result = result.replace(
            new RegExp(`"${key}":\\s*([0-9]+)`, 'g'),
            `"${key}":"$1"`
        );
    }
    return result;
}

/**
 * Replaces a string in a JSON string with the same string as a
 * number, i.e. removing quotes (") prior to and after the string. This
 * is needed as the default JSON stringify cannot serialize BigInts as numbers.
 * So one can turn them into strings, stringify the structure, and then use this function
 * to make those fields into JSON numbers.
 * @param jsonStruct the JSON structure as a string
 * @param keys the keys where the strings has to be unquoted
 * @returns the same JSON string where the strings at the supplied keys are unquoted
 */
export function stringToInt(jsonStruct: string, keys: string[]): string {
    let result = jsonStruct;
    for (const key of keys) {
        result = result.replace(
            new RegExp(`"${key}":\\s*"([0-9]+)"`, 'g'),
            `"${key}":$1`
        );
    }
    return result;
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

// Maps a `Record<A,C>` to a `Record<B,D>`.
// Works the same way as a list mapping, allowing both a value and key mapping.
// If `keyMapper()` is not provided, it will map `Record<A,C>` to `Record<A,D>`
/* eslint-disable @typescript-eslint/no-explicit-any */
export function mapRecord<
    A extends string | number | symbol,
    B,
    C extends string | number | symbol,
    D
>(
    rec: Record<A, B>,
    valMapper: (x: B) => D,
    keyMapper: (x: A) => C = (a: any) => a
): Record<C, D> {
    const ret: any = {};
    for (const i in rec) {
        ret[keyMapper(i)] = valMapper(rec[i]);
    }
    return ret;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// Retrieves a value that might be undefined. Throws if value is undefined
export function unwrap<A>(x: A | undefined): A {
    if (x === undefined) {
        console.trace();
        throw Error('Undefined value found.');
    } else {
        return x;
    }
}
