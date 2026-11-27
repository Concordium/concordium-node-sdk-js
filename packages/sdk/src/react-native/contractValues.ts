import { Buffer } from 'buffer/index.js';

import type { SchemaType } from '../schemaTypes.js';
import type * as EventType from '../types/ContractEvent.js';
import type * as ParameterType from '../types/Parameter.js';
import type * as ReturnValueType from '../types/ReturnValue.js';
import { deserializeTypeValue, serializeTypeValue } from './schema.js';

async function schemaBytes(schema: SchemaType | string): Promise<Uint8Array> {
    if (typeof schema === 'string') return Buffer.from(schema, 'base64');
    return (await import('../schemaTypes.js')).serializeSchemaType(schema);
}

function parseWithSchemaType(
    { buffer }: ParameterType.Type | ReturnValueType.Type | EventType.Type,
    schema: SchemaType | string
) {
    return schemaBytes(schema).then((bytes) => deserializeTypeValue(buffer, bytes));
}

/** Async schema helpers for building and decoding the SDK's contract values. */
export const Parameter = {
    async fromSchemaType(schema: SchemaType | string, value: unknown): Promise<ParameterType.Type> {
        return serializeTypeValue(value, await schemaBytes(schema));
    },
    parseWithSchemaType,
};

export const ReturnValue = { parseWithSchemaType };
export const ContractEvent = { parseWithSchemaType };
