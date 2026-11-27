import { Buffer } from 'buffer/index.js';

import { deserializeTypeValue, serializeTypeValue } from '../schema.js';
import { SchemaType, serializeSchemaType } from '../schemaTypes.js';
import type { Base64String, SmartContractTypeValues } from '../types.js';
import { Type as Parameter, toBuffer } from './ParameterValue.js';

export * from './ParameterValue.js';

/**
 * Create a parameter from a schema type and the corresponding schema value.
 * @param {SchemaType} schemaType The schema type for some parameter.
 * @param {unknown} value The parameter value fitting the schema type.
 * @returns {Parameter} A parameter of the provided value encoded using the schema type.
 */
export function fromSchemaType(schemaType: SchemaType, value: unknown): Parameter {
    const schemaBytes = serializeSchemaType(schemaType);
    return serializeTypeValue(value, schemaBytes);
}

/**
 * Create a parameter from a schema type and the corresponding schema value.
 * @param {Base64String} schemaBase64 The schema type for some parameter in base64.
 * @param {unknown} value The parameter value fitting the schema type.
 * @returns {Parameter} A parameter of the provided value encoded using the schema type.
 */
export function fromBase64SchemaType(schemaBase64: Base64String, value: unknown): Parameter {
    const schemaBytes = Buffer.from(schemaBase64, 'base64');
    return serializeTypeValue(value, schemaBytes);
}

/**
 * Parse a contract parameter using a schema type.
 * @param {Parameter} parameter The parameter.
 * @param {SchemaType} schemaType The schema type for the parameter.
 * @returns {SmartContractTypeValues}
 */
export function parseWithSchemaType(parameter: Parameter, schemaType: SchemaType): SmartContractTypeValues {
    const schemaBytes = serializeSchemaType(schemaType);
    return deserializeTypeValue(toBuffer(parameter), schemaBytes);
}

/**
 * Parse a contract parameter using a schema type.
 * @param {Parameter} parameter The parameter to parse.
 * @param {Base64String} schemaBase64 The schema type for the parameter encoded as Base64.
 * @returns {SmartContractTypeValues}
 */
export function parseWithSchemaTypeBase64(parameter: Parameter, schemaBase64: Base64String): SmartContractTypeValues {
    const schemaBytes = Buffer.from(schemaBase64, 'base64');
    return deserializeTypeValue(toBuffer(parameter), schemaBytes);
}
