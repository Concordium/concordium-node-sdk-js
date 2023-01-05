import { Buffer } from 'buffer/';
import { SchemaVersion } from './types';
import * as wasm from '@concordium/rust-bindings';

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
    try {
        return Buffer.from(parameterSchema, 'hex');
    } catch (e) {
        throw new Error(
            'unable to get parameter schema, due to: ' + parameterSchema
        ); // In this case parameterSchema is the error message from the rust module
    }
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
    try {
        return Buffer.from(parameterSchema, 'hex');
    } catch (e) {
        throw new Error(
            'unable to get parameter schema, due to: ' + parameterSchema
        ); // In this case parameterSchema is the error message from the rust module
    }
}
