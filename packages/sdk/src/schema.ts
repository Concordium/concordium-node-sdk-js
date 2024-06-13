import * as wasm from '@concordium/rust-bindings';
import { Buffer } from 'buffer/index.js';
import JSONbig from 'json-bigint';

import { SchemaVersion, SmartContractTypeValues } from './types.js';
import * as ContractName from './types/ContractName.js';
import * as EntrypointName from './types/EntrypointName.js';
import * as Parameter from './types/Parameter.js';

/**
 * @param moduleSchema buffer for the schema of a module that contains the contract
 * @param contractName name of the contract that the init contract transaction will initialize
 * @param schemaVersion the version of the schema provided
 * @returns buffer containing the schema for of init contract parameters
 */
export function getInitContractParameterSchema(
    moduleSchema: ArrayBuffer,
    contractName: ContractName.Type,
    schemaVersion?: SchemaVersion
): Uint8Array {
    const parameterSchema = wasm.getInitContractParameterSchema(
        Buffer.from(moduleSchema).toString('hex'),
        ContractName.toString(contractName),
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
    moduleSchema: ArrayBuffer,
    contractName: ContractName.Type,
    receiveFunctionName: EntrypointName.Type,
    schemaVersion?: SchemaVersion
): Uint8Array {
    const parameterSchema = wasm.getReceiveContractParameterSchema(
        Buffer.from(moduleSchema).toString('hex'),
        ContractName.toString(contractName),
        EntrypointName.toString(receiveFunctionName),
        schemaVersion
    );
    return Buffer.from(parameterSchema, 'hex');
}

/**
 * @param rawSchema the schema for the type
 * @returns JSON template of the schema
 */
export function displayTypeSchemaTemplate(rawSchema: ArrayBuffer): string {
    return wasm.displayTypeSchemaTemplate(Buffer.from(rawSchema).toString('hex'));
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
    contractName: ContractName.Type,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    parameters: any,
    rawSchema: ArrayBuffer,
    schemaVersion?: SchemaVersion,
    verboseErrorMessage = false
): Parameter.Type {
    const serializedParameters = wasm.serializeInitContractParameters(
        JSONbig.stringify(parameters),
        Buffer.from(rawSchema).toString('hex'),
        ContractName.toString(contractName),
        schemaVersion,
        verboseErrorMessage
    );
    return Parameter.fromBuffer(Buffer.from(serializedParameters, 'hex'));
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
    contractName: ContractName.Type,
    receiveFunctionName: EntrypointName.Type,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    parameters: any,
    rawSchema: ArrayBuffer,
    schemaVersion?: SchemaVersion,
    verboseErrorMessage = false
): Parameter.Type {
    const serializedParameters = wasm.serializeReceiveContractParameters(
        JSONbig.stringify(parameters),
        Buffer.from(rawSchema).toString('hex'),
        ContractName.toString(contractName),
        EntrypointName.toString(receiveFunctionName),
        schemaVersion,
        verboseErrorMessage
    );
    return Parameter.fromBuffer(Buffer.from(serializedParameters, 'hex'));
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
    rawSchema: ArrayBuffer,
    verboseErrorMessage = false
): Parameter.Type {
    const serializedValue = wasm.serializeTypeValue(
        JSONbig.stringify(value),
        Buffer.from(rawSchema).toString('hex'),
        verboseErrorMessage
    );
    return Parameter.fromBuffer(Buffer.from(serializedValue, 'hex'));
}

/**
 * Given a contract's raw state, its name and its schema, return the state as a JSON object.
 * The return type is any, and the actual type should be determined by using the schema.
 */
export function deserializeContractState(
    contractName: ContractName.Type,
    schema: ArrayBuffer,
    state: ArrayBuffer,
    verboseErrorMessage = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
    const serializedState = wasm.deserializeState(
        ContractName.toString(contractName),
        Buffer.from(state).toString('hex'),
        Buffer.from(schema).toString('hex'),
        verboseErrorMessage
    );
    try {
        return JSONbig({
            alwaysParseAsBig: true,
            useNativeBigInt: true,
        }).parse(serializedState);
    } catch (e) {
        throw new Error('unable to deserialize state, due to: ' + serializedState); // In this case serializedState is the error message from the rust module
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
    returnValueBytes: ArrayBuffer,
    moduleSchema: ArrayBuffer,
    contractName: ContractName.Type,
    functionName: EntrypointName.Type,
    schemaVersion?: number,
    verboseErrorMessage = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
    const deserializedReturnValue = wasm.deserializeReceiveReturnValue(
        Buffer.from(returnValueBytes).toString('hex'),
        Buffer.from(moduleSchema).toString('hex'),
        ContractName.toString(contractName),
        EntrypointName.toString(functionName),
        schemaVersion,
        verboseErrorMessage
    );
    try {
        return JSONbig({
            alwaysParseAsBig: true,
            useNativeBigInt: true,
        }).parse(deserializedReturnValue);
    } catch (e) {
        throw new Error('unable to deserialize the return value, due to: ' + deserializedReturnValue); // In this case deserializedReturnValue is the error message from the rust module
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
    errorBytes: ArrayBuffer,
    moduleSchema: ArrayBuffer,
    contractName: ContractName.Type,
    functionName: EntrypointName.Type,
    verboseErrorMessage = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
    const deserializedError = wasm.deserializeReceiveError(
        Buffer.from(errorBytes).toString('hex'),
        Buffer.from(moduleSchema).toString('hex'),
        ContractName.toString(contractName),
        EntrypointName.toString(functionName),
        verboseErrorMessage
    );
    try {
        return JSONbig({
            alwaysParseAsBig: true,
            useNativeBigInt: true,
        }).parse(deserializedError);
    } catch (e) {
        throw new Error('unable to deserialize the error value, due to: ' + deserializedError); // In this case deserializedError is the error message from the rust module
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
    errorBytes: ArrayBuffer,
    moduleSchema: ArrayBuffer,
    contractName: ContractName.Type,
    verboseErrorMessage = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
    const deserializedError = wasm.deserializeInitError(
        Buffer.from(errorBytes).toString('hex'),
        Buffer.from(moduleSchema).toString('hex'),
        ContractName.toString(contractName),
        verboseErrorMessage
    );
    try {
        return JSONbig({
            alwaysParseAsBig: true,
            useNativeBigInt: true,
        }).parse(deserializedError);
    } catch (e) {
        throw new Error('unable to deserialize the error value, due to: ' + deserializedError); // In this case deserializedError is the error message from the rust module
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
    value: ArrayBuffer,
    rawSchema: ArrayBuffer,
    verboseErrorMessage = false
): SmartContractTypeValues {
    const deserializedValue = wasm.deserializeTypeValue(
        Buffer.from(value).toString('hex'),
        Buffer.from(rawSchema).toString('hex'),
        verboseErrorMessage
    );
    return JSONbig({
        alwaysParseAsBig: true,
        useNativeBigInt: true,
    }).parse(deserializedValue);
}
