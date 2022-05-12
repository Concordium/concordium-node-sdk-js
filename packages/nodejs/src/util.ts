import { BoolResponse, JsonResponse } from '../grpc/concordium_p2p_rpc_pb';

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
