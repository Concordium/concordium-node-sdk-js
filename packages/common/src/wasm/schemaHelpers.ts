import {
    getInitContractParameterSchema as getInitContractParameterSchemaWasm,
    getReceiveContractParameterSchema as getReceiveContractParameterSchemaWasm,
    displayTypeSchemaTemplate as displayTypeSchemaTemplateWasm,
} from '@concordium/rust-bindings/dapp';
import { Buffer } from 'buffer/';
import { SchemaVersion } from '../types';

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
    const parameterSchema = getInitContractParameterSchemaWasm(
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
    const parameterSchema = getReceiveContractParameterSchemaWasm(
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
    return displayTypeSchemaTemplateWasm(rawSchema.toString('hex'));
}
