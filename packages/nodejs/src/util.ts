import * as fs from 'fs';

/**
 * @deprecated This is a helper function for the v1 gRPC client, which has been deprecated
 */
export function intListToStringList(jsonStruct: string): string {
    return jsonStruct.replace(/(\-?[0-9]+)/g, '"$1"');
}

/**
 * Converts a JsonResponse to type T
 * @param reviver JSON reviver function to change types while parsing
 * @param transformer a function to transform the JSON string prior to parsing the JSON
 * @returns The converted JSON object
 * @deprecated This is a helper function for the v1 gRPC client, which has been deprecated
 */
export function convertJsonResponse<T>(
    jsonString: string,
    reviver?: (this: unknown, key: string, value: unknown) => unknown,
    transformer?: (json: string) => string
): T {
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
