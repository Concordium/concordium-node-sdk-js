import { Buffer } from 'buffer/index.js';
import {
    AccountTransactionSignature,
    HexString,
    IpAddressString,
    SchemaVersion,
} from './types.js';

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
export function isValidHash(hash: HexString): boolean {
    return hash.length === 64 && isHex(hash);
}

export function isValidIp(ip: IpAddressString): boolean {
    // From stackoverflow: https://stackoverflow.com/questions/23483855/javascript-regex-to-validate-ipv4-and-ipv6-address-no-hostnames
    const expression =
        /((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))/;
    return expression.test(ip);
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

export interface SchemaFromWasm {
    schema: ArrayBuffer;
    schemaVersion: SchemaVersion | undefined;
    sectionName: string;
}

function findCustomSections(m: WebAssembly.Module, moduleVersion: number) {
    function getCustomSections(
        sectionName: string,
        schemaVersion: SchemaVersion | undefined
    ) {
        const s = WebAssembly.Module.customSections(m, sectionName);
        return s.length === 0
            ? undefined
            : { sectionName, schemaVersion, contents: s };
    }

    // First look for section containing schema with embedded version, then "-v1" or "-v2" depending on the module version.
    switch (moduleVersion) {
        case 0:
            return (
                getCustomSections('concordium-schema', undefined) || // always v0
                getCustomSections('concordium-schema-v1', SchemaVersion.V0) // v0 (not a typo)
            );
        case 1:
            return (
                getCustomSections('concordium-schema', undefined) || // v1, v2, or v3
                getCustomSections('concordium-schema-v2', SchemaVersion.V1) // v1 (not a typo)
            );
    }
    return getCustomSections('concordium-schema', undefined); // expecting to find this section in future module versions
}

/**
 * Attempts to extract a smart contract schema from a given wasm module, optionally based on the module version.
 * @param moduleSourceWasm the wasm module as a buffer.
 * @param moduleVersion module version. If provided, we will attempt to find the schema in sections specific to that version. Otherwise, we'll only look in "concordium-schema".
 * @returns the smart contract schema with version and name of custom section where it was found or undefined if no schema was found
 */
export function wasmToSchema(
    moduleSourceWasm: BufferSource,
    moduleVersion: number
): SchemaFromWasm | undefined {
    const sections = findCustomSections(
        new WebAssembly.Module(moduleSourceWasm),
        moduleVersion
    );
    if (!sections) {
        return undefined;
    }
    const { sectionName, schemaVersion, contents } = sections;
    if (contents.length !== 1) {
        throw new Error(
            `invalid module: expected to find at most one custom section named "${sectionName}", but found ${contents.length}`
        );
    }
    return { schema: contents[0], schemaVersion, sectionName };
}

/**
 * Convert a Date to seconds since epoch.
 */
export function secondsSinceEpoch(date: Date): bigint {
    return BigInt(Math.floor(date.getTime() / 1000));
}

// Retrieves a value that might be undefined. Throws if value is undefined
export function unwrap<A>(x: A | undefined): A {
    if (x === undefined) {
        console.trace();
        throw Error('Undefined value found.');
    } else {
        return x;
    }
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

/**
 * Maps an infinite stream of type A to an infinite stream of type B
 * @param mapper: function used to map each element from type A to B.
 */
export function mapStream<A, B>(
    stream: AsyncIterable<A>,
    mapper: (x: A) => B
): AsyncIterable<B> {
    return {
        [Symbol.asyncIterator]() {
            return {
                async next() {
                    for await (const val of stream) {
                        return {
                            done: false,
                            value: mapper(val),
                        };
                    }
                    return {
                        done: true,
                        value: undefined,
                    };
                },
            };
        },
    };
}

/**
 * Filters entries from a record
 * @param rec the record, whose entries should be filtered.
 * @param predicate predicate to test entries, only if this returns true does the entry remain
 */
export function filterRecord<A extends string | number | symbol, B>(
    rec: Record<A, B>,
    predicate: (k: A, v: B) => boolean
): Record<A, B> {
    return Object.fromEntries(
        Object.entries(rec).filter(([k, v]) => predicate(k as A, v as B))
    ) as Record<A, B>;
}

// Converts an async iterable to a list. Beware! This will not terminate if given an infinite stream.
export async function streamToList<A>(
    iterable: AsyncIterable<A>
): Promise<A[]> {
    const list: A[] = [];
    for await (const iter of iterable) {
        list.push(iter);
    }
    return list;
}

/**
 * Creates a function that takes either a `T` or `T[]` from a function that takes `T[]`.
 *
 * @param {(input: T[]) => R} fun - A function that takes `T[]`
 *
 * @example
 * const serializer = makeDynamicFunction(serialize);
 * const exampleStruct = {
    tokenId: '';
    tokenAmount: 100n;
    from: {
address: "3nsRkrtQVMRtD2Wvm88gEDi6UtqdUVvRN3oGZ1RqNJ3eto8owi"
};
    to: 3nsRkrtQVMRtD2Wvm88gEDi6UtqdUVvRN3oGZ1RqNJ3eto8owi;
    data: '48656c6c6f20776f726c6421';
};
 * const bytesSingle = serializer(exampleStruct);
 * const bytesMulti = serializer([exampleStruct, exampleStruct]);
 */
export const makeDynamicFunction =
    <T, R>(fun: (a: T[]) => R) =>
    (input: T | T[]): R =>
        fun(Array.isArray(input) ? input : [input]);

export function isDefined<T>(v?: T): v is T {
    return v !== undefined;
}

export function toBuffer(s: string, encoding?: string): Buffer {
    return Buffer.from(s, encoding);
}
