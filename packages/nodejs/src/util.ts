import * as fs from 'fs';
import { Buffer } from 'buffer/';
import { BoolResponse, JsonResponse } from '../grpc/concordium_p2p_rpc_pb';
import createConcordiumClientV2 from '../src/clientV2';
import ConcordiumNodeClientV2 from '@concordium/common-sdk/lib/GRPCClient';
import { credentials, Metadata } from '@grpc/grpc-js/';

/**
 * Creates a client to communicate with a local concordium-node
 * used for automatic tests.
 */
export function getNodeClientV2(
    address = 'node.testnet.concordium.com',
    port = 20000
): ConcordiumNodeClientV2 {
    const metadata = new Metadata();
    return createConcordiumClientV2(
        address,
        port,
        credentials.createInsecure(),
        metadata,
        { timeout: 15000 }
    );
}

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
 * @param filePath the location of the module
 * @returns the module as a buffer
 */
export function getModuleBuffer(filePath: string): Buffer {
    return Buffer.from(fs.readFileSync(filePath));
}
