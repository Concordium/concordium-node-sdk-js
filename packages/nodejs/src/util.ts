import * as fs from 'fs';
import * as v1 from '@concordium/common-sdk';
import * as v2 from '../grpc/v2/concordium/types';
import { Buffer } from 'buffer/';
import { BoolResponse, JsonResponse } from '../grpc/concordium_p2p_rpc_pb';
import {
    CredentialRegistrationId as CredRegId,
    HexString,
} from '@concordium/common-sdk';

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

export function getBlockHashInput(blockHash?: HexString): v2.BlockHashInput {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let blockHashInput: any = {};

    if (blockHash) {
        assertValidHash(blockHash);
        blockHashInput = {
            oneofKind: 'given',
            given: { value: Buffer.from(blockHash, 'hex') },
        };
    } else {
        blockHashInput = {
            oneofKind: 'lastFinal',
            lastFinal: v2.Empty,
        };
    }

    return { blockHashInput: blockHashInput };
}

/**
 * Gets an GRPCv2 AccountIdentifierInput from a GRPCv1 AccountIdentifierInput.
 * @param accountIdentifier a GRPCv1 AccountIdentifierInput.
 * @returns a GRPCv2 AccountIdentifierInput.
 */
export function getAccountIdentifierInput(
    accountIdentifier: v1.AccountIdentifierInput
): v2.AccountIdentifierInput {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const returnIdentifier: any = {};

    if ((<v1.AccountAddress>accountIdentifier).decodedAddress !== undefined) {
        const address = (<v1.AccountAddress>accountIdentifier).decodedAddress;
        returnIdentifier.oneofKind = 'address';
        returnIdentifier.address = { value: address };
    } else if ((<CredRegId>accountIdentifier).credId !== undefined) {
        const credId = (<CredRegId>accountIdentifier).credId;
        returnIdentifier.oneofKind = 'credId';
        returnIdentifier.credId = { value: Buffer.from(credId, 'hex') };
    } else {
        returnIdentifier.oneofKind = 'accountIndex';
        returnIdentifier.accountIndex = { value: accountIdentifier };
    }

    return { accountIdentifierInput: returnIdentifier };
}

export function assertValidHash(hash: HexString): void {
    if (hash.length !== 64) {
        throw new Error(
            'The input was not a valid hash, must be 32 bytes: ' + hash
        );
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

// Retrieves a value that might be undefined. Throws if value is undefined
export function unwrap<A>(x: A | undefined): A {
    if (x === undefined) {
        console.trace();
        throw Error('Undefined value found.');
    } else {
        return x;
    }
}

export function assertValidModuleRef(moduleRef: Uint8Array): void {
    if (moduleRef.length !== 32) {
        throw new Error(
            'The input was not a valid module reference, must be 32 bytes: ' +
                Buffer.from(moduleRef).toString('hex')
        );
    }
}

/**
 * Gets an GRPCv2 AccountTransactionSignature from a GRPCv1 AccountTransactionSignature.
 * @param accountIdentifier a GRPCv1 AccountTransactionSignature.
 * @returns a GRPCv2 AccountTransactionSignature.
 */
export function translateSignature(
    signature: v1.AccountTransactionSignature
): v2.AccountTransactionSignature {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accountTransactionSignature: any = { signatures: {} };

    for (const i in signature) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const accountSignatureMap: any = { signatures: {} };

        for (const j in signature[i]) {
            accountSignatureMap.signatures[i] = {
                value: Buffer.from(signature[i][j], 'hex'),
            };
        }
        accountTransactionSignature.signatures[i] = accountSignatureMap;
    }

    return accountTransactionSignature;
}
