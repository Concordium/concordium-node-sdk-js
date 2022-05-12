/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReleaseSchedule } from '.';
import { AccountTransactionSignature } from './types';

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
