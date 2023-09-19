import * as wasm from '@concordium/rust-bindings';
import { Buffer } from 'buffer/index.js';
import JSONbig from 'json-bigint';
import { SchemaVersion, SmartContractTypeValues } from './types.js';

/**
 * @param moduleSchema buffer for the schema of a module that contains the contract
 * @param contractName name of the contract that the init contract transaction will initialize
 * @param schemaVersion the version of the schema provided
 * @returns buffer containing the schema for of init contract parameters
 */
export function getInitContractParameterSchema(
    moduleSchema: Buffer,
    contractName: string,
    schemaVersion?: SchemaVersion
): Buffer {
    const parameterSchema = wasm.getInitContractParameterSchema(
        moduleSchema.toString('hex'),
        contractName,
        schemaVersion
    );
    return Buffer.from(parameterSchema, 'hex');
}

/**
 * @param moduleSchema buffer for the schema of a module that contains the contract
 * @param contractName name of the contract that the update contract transaction will update
 * @param receiveFunctionName name of function that the update contract transaction will invoke
 * @param schemaVersion the version of the schema provided
 * @returns buffer containing the schema for of update contract parameters
 */
export function getUpdateContractParameterSchema(
    moduleSchema: Buffer,
    contractName: string,
    receiveFunctionName: string,
    schemaVersion?: SchemaVersion
): Buffer {
    const parameterSchema = wasm.getReceiveContractParameterSchema(
        moduleSchema.toString('hex'),
        contractName,
        receiveFunctionName,
        schemaVersion
    );
    return Buffer.from(parameterSchema, 'hex');
}

/**
 * @param rawSchema the schema for the type
 * @returns JSON template of the schema
 */
export function displayTypeSchemaTemplate(rawSchema: Buffer): string {
    return wasm.displayTypeSchemaTemplate(rawSchema.toString('hex'));
}

/**
 * @param contractName name of the contract that the init contract transaction will initialize
 * @param parameters the parameters to be serialized. Should correspond to the JSON representation.
 * @param rawSchema buffer for the schema of a module that contains the contract
 * @param schemaVersion the version of the schema provided
 * @param verboseErrorMessage Whether errors are in a verbose format or not. Defaults to `false`.
 * @returns serialized buffer of init contract parameters
 */
export function serializeInitContractParameters(
    contractName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    parameters: any,
    rawSchema: Buffer,
    schemaVersion?: SchemaVersion,
    verboseErrorMessage = false
): Buffer {
    const serializedParameters = wasm.serializeInitContractParameters(
        JSONbig.stringify(parameters),
        rawSchema.toString('hex'),
        contractName,
        schemaVersion,
        verboseErrorMessage
    );
    return Buffer.from(serializedParameters, 'hex');
}

/**
 * @param contractName name of the contract that the update contract transaction will update
 * @param receiveFunctionName name of function that the update contract transaction will invoke
 * @param parameters the parameters to be serialized. Should correspond to the JSON representation.
 * @param rawSchema buffer for the schema of a module that contains the contract
 * @param schemaVersion the version of the schema provided
 * @param verboseErrorMessage Whether errors are in a verbose format or not. Defaults to `false`.
 * @returns serialized buffer of update contract parameters
 */
export function serializeUpdateContractParameters(
    contractName: string,
    receiveFunctionName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    parameters: any,
    rawSchema: Buffer,
    schemaVersion?: SchemaVersion,
    verboseErrorMessage = false
): Buffer {
    const serializedParameters = wasm.serializeReceiveContractParameters(
        JSONbig.stringify(parameters),
        rawSchema.toString('hex'),
        contractName,
        receiveFunctionName,
        schemaVersion,
        verboseErrorMessage
    );
    return Buffer.from(serializedParameters, 'hex');
}

/**
 * Given a value for a smart contract type, and the raw schema for that type, serialize the value into binary format.
 * @param value the value that should be serialized. Should correspond to the JSON representation
 * @param rawSchema the schema for the type that the given value should be serialized as
 * @param verboseErrorMessage Whether errors are in a verbose format or not. Defaults to `false`.
 * @returns serialized buffer of the value
 */
export function serializeTypeValue(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    value: any,
    rawSchema: Buffer,
    verboseErrorMessage = false
): Buffer {
    const serializedValue = wasm.serializeTypeValue(
        JSONbig.stringify(value),
        rawSchema.toString('hex'),
        verboseErrorMessage
    );
    return Buffer.from(serializedValue, 'hex');
}

/**
 * Given a contract's raw state, its name and its schema, return the state as a JSON object.
 * The return type is any, and the actual type should be determined by using the schema.
 */
export function deserializeContractState(
    contractName: string,
    schema: Buffer,
    state: Buffer,
    verboseErrorMessage = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
    const serializedState = wasm.deserializeState(
        contractName,
        state.toString('hex'),
        schema.toString('hex'),
        verboseErrorMessage
    );
    try {
        return JSONbig({
            alwaysParseAsBig: true,
            useNativeBigInt: true,
        }).parse(serializedState);
    } catch (e) {
        throw new Error(
            'unable to deserialize state, due to: ' + serializedState
        ); // In this case serializedState is the error message from the rust module
    }
}

/**
 * Deserializes a receive functions's return value from a sequence of bytes into a json object.
 * @param returnValueBytes A buffer containing the return value as raw bytes.
 * @param moduleSchema The raw module schema as a buffer.
 * @param contractName The name of the contract where the receive function is located.
 * @param functionName The name of the receive function which return value you want to deserialize.
 * @param schemaVersion The schema version as a number. This parameter is optional, if you provide a serialized versioned schema this argument won't be needed.
 * @param verboseErrorMessage Whether errors are in a verbose format or not. Defaults to `false`.
 */
export function deserializeReceiveReturnValue(
    returnValueBytes: Buffer,
    moduleSchema: Buffer,
    contractName: string,
    functionName: string,
    schemaVersion?: number,
    verboseErrorMessage = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
    const deserializedReturnValue = wasm.deserializeReceiveReturnValue(
        returnValueBytes.toString('hex'),
        moduleSchema.toString('hex'),
        contractName,
        functionName,
        schemaVersion,
        verboseErrorMessage
    );
    try {
        return JSONbig({
            alwaysParseAsBig: true,
            useNativeBigInt: true,
        }).parse(deserializedReturnValue);
    } catch (e) {
        throw new Error(
            'unable to deserialize the return value, due to: ' +
                deserializedReturnValue
        ); // In this case deserializedReturnValue is the error message from the rust module
    }
}

/**
 * Deserializes a receive function's error from a sequence of bytes into a json object.
 * @param errorBytes A buffer containing the error as raw bytes.
 * @param moduleSchema The raw module schema as a buffer.
 * @param contractName The name of the contract where the receive function is located.
 * @param functionName The name of the receive function which error you want to deserialize.
 * @param verboseErrorMessage Whether errors are in a verbose format or not. Defaults to `false`.
 */
export function deserializeReceiveError(
    errorBytes: Buffer,
    moduleSchema: Buffer,
    contractName: string,
    functionName: string,
    verboseErrorMessage = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
    const deserializedError = wasm.deserializeReceiveError(
        errorBytes.toString('hex'),
        moduleSchema.toString('hex'),
        contractName,
        functionName,
        verboseErrorMessage
    );
    try {
        return JSONbig({
            alwaysParseAsBig: true,
            useNativeBigInt: true,
        }).parse(deserializedError);
    } catch (e) {
        throw new Error(
            'unable to deserialize the error value, due to: ' +
                deserializedError
        ); // In this case deserializedError is the error message from the rust module
    }
}

/**
 * Deserializes an init function's error from a sequence of bytes into a json object.
 * @param errorBytes A buffer containing the error as raw bytes.
 * @param moduleSchema The raw module schema as a buffer.
 * @param contractName The name of the init function which error you want to deserialize.
 * @param verboseErrorMessage Whether errors are in a verbose format or not. Defaults to `false`.
 */
export function deserializeInitError(
    errorBytes: Buffer,
    moduleSchema: Buffer,
    contractName: string,
    verboseErrorMessage = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
    const deserializedError = wasm.deserializeInitError(
        errorBytes.toString('hex'),
        moduleSchema.toString('hex'),
        contractName,
        verboseErrorMessage
    );
    try {
        return JSONbig({
            alwaysParseAsBig: true,
            useNativeBigInt: true,
        }).parse(deserializedError);
    } catch (e) {
        throw new Error(
            'unable to deserialize the error value, due to: ' +
                deserializedError
        ); // In this case deserializedError is the error message from the rust module
    }
}

/**
 * Given a binary value for a smart contract type, and the raw schema for that type, deserialize the value into the JSON representation.
 * @param value the value that should be deserialized.
 * @param rawSchema the schema for the type that the given value should be deserialized as
 * @param verboseErrorMessage Whether errors are in a verbose format or not. Defaults to `false`.
 * @returns the deserialized value
 */
export function deserializeTypeValue(
    value: Buffer,
    rawSchema: Buffer,
    verboseErrorMessage = false
): SmartContractTypeValues {
    const deserializedValue = wasm.deserializeTypeValue(
        value.toString('hex'),
        rawSchema.toString('hex'),
        verboseErrorMessage
    );
    return JSONbig({
        alwaysParseAsBig: true,
        useNativeBigInt: true,
    }).parse(deserializedValue);
}
