import * as fs from 'fs';
import { Buffer } from 'buffer/';
import { BoolResponse, JsonResponse } from '../grpc/concordium_p2p_rpc_pb';
import {
    BlockHashInput,
    Empty,
    AccountIdentifierInput,
} from '../grpc/v2/concordium/types';
import {
    AccountAddress,
    CredentialRegistrationId as CredRegId,
} from '@concordium/common-sdk';
import { AccountIdentifierInputLocal } from './types';

export function intListToStringList(jsonStruct: string): string {
    return jsonStruct.replace(/(\-?[0-9]+)/g, '"$1"');
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
 * Loads the module as a buffer, given the given filePath.
 * @param filepath the location of the module
 * @returns the module as a buffer
 */
export function getModuleBuffer(filePath: string): Buffer {
    return Buffer.from(fs.readFileSync(filePath));
}

export function getBlockHashInput(blockHash?: Uint8Array): BlockHashInput {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let blockHashInput: any = {};

    if (blockHash) {
        assertValidHash(blockHash);
        blockHashInput = {
            oneofKind: 'given',
            given: { value: blockHash },
        };
    } else {
        blockHashInput = {
            oneofKind: 'lastFinal',
            lastFinal: Empty,
        };
    }

    return { blockHashInput: blockHashInput };
}

export function getAccountIdentifierInput(
    accountIdentifier: AccountIdentifierInputLocal
): AccountIdentifierInput {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const returnIdentifier: any = {};

    if ((<AccountAddress>accountIdentifier).decodedAddress !== undefined) {
        const address = (<AccountAddress>accountIdentifier).decodedAddress;
        returnIdentifier.oneofKind = 'address';
        returnIdentifier.address = { value: address };
    } else if ((<CredRegId>accountIdentifier).credId !== undefined) {
        const credId = (<CredRegId>accountIdentifier).credId;
        const credIdBytes = Buffer.from(credId, 'hex');
        returnIdentifier.oneofKind = 'credId';
        returnIdentifier.credId = { value: credIdBytes };
    } else {
        returnIdentifier.oneofKind = 'accountIndex';
        returnIdentifier.accountIndex = { value: accountIdentifier };
    }

    return { accountIdentifierInput: returnIdentifier };
}

export function assertValidHash(hash: Uint8Array): void {
    if (hash.length !== 32) {
        throw new Error(
            'The input was not a valid hash, must be 32 bytes: ' +
                Buffer.from(hash).toString('hex')
        );
    }
}

// Maps a `Record<A,C>` to a `Record<B,D>`.
// Works the same way as a list mapping, allowing both a value and key mapping.
// If `keyMapper()` is not provided, it will map `Record<A,C>` to `Record<A,D>`
export function recordMap<
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

// Retrieves a value that might be undefined. Throws if value is undefined
export function unwrap<A>(x: A | undefined): A {
    if (x === undefined) {
        console.trace();
        throw Error('Undefined value found.');
    } else {
        return x;
    }
}
