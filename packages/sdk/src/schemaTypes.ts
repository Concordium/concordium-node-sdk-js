import { Buffer } from 'buffer/index.js';

import { ContractName, EntrypointName } from './contractHelpers.js';
import {
    Cursor,
    Deserializer,
    deserializeBigUInt64LE,
    deserializeUInt8,
    deserializeUInt16LE,
    deserializeUInt32LE,
} from './deserializationHelpers.js';
import { encodeWord8, encodeWord16, encodeWord32, encodeWord64 } from './serializationHelpers.js';

/**
 * The JSON schema representation of a rust Option
 *
 * @template T - The type to represent as optional
 */
export type OptionJson<T> = { None: [] } | { Some: [T] };

/**
 * Takes a value and wraps it in a {@link OptionJson}.
 *
 * @template T - The type to represent as optional
 *
 * @param {T} value - The value to wrap.
 *
 * @returns {OptionJson<T>} the wrapped value
 */
export function toOptionJson<T>(value: T | undefined): OptionJson<T> {
    if (value === undefined) {
        return { None: [] };
    }

    return { Some: [value] };
}

/** Schema version from before the schema bytes contained version information. */
export type UnversionedSchemaVersion = 0 | 1;

/**
 * Represents unparsed bytes for a smart contract module schema.
 */
export type RawModuleSchema =
    | {
          /** The bytes does contain the version information. */
          readonly type: 'versioned';
          /** Buffer containing the schema module bytes, assumed to contain the version information. */
          readonly buffer: ArrayBuffer;
      }
    | {
          /** The bytes does not contain the version information. */
          readonly type: 'unversioned';
          /** Buffer containing the schema module bytes. Assumed to be without the version information */
          readonly buffer: ArrayBuffer;
          /** Smart contract module schema version. */
          readonly version: UnversionedSchemaVersion;
      };

/**
 * Parse a raw smart contract module schema into a structured type.
 *
 * @param {RawModuleSchema} rawModuleSchema The raw smart contract module schema.
 * @returns {VersionedSchemaModule} A structured representation of the smart contract module schema.
 * @throws If unable to deserialize the module schema from provided bytes.
 */
export function parseRawModuleSchema(rawModuleSchema: RawModuleSchema): VersionedSchemaModule {
    const cursor = Cursor.fromBuffer(rawModuleSchema.buffer);
    if (rawModuleSchema.type === 'versioned') {
        return deserializeVersionedSchemaModule(cursor);
    } else {
        return deserializeUnversionedSchemaModule(rawModuleSchema.version, cursor);
    }
}

/**
 * Represents the different schema versions.
 *
 * The serialization of this type includes the versioning information.
 * The serialization of this is always prefixed with two 255u8 in order to distinguish this versioned schema from the unversioned.
 * When embedded into a smart contract module, name the custom section `concordium-schema`.
 */
export type VersionedSchemaModule =
    | {
          version: 0;
          module: SchemaModuleV0;
      }
    | {
          version: 1;
          module: SchemaModuleV1;
      }
    | {
          version: 2;
          module: SchemaModuleV2;
      }
    | {
          version: 3;
          module: SchemaModuleV3;
      };

/**
 * Contains all schemas for a smart contract module V0.
 * Older versions of smart contracts might have this embedded in the custom section labelled `concordium-schema-v1`.
 */
export type SchemaModuleV0 = {
    /** Map from contract name to a collection of schemas for that contract. */
    contracts: Map<ContractName, SchemaContractV1>;
};

/**
 * Contains all schemas for a smart contract module V1.
 * Older versions of smart contracts might have this embedded in the custom section labelled `concordium-schema-v2`.
 */
export type SchemaModuleV1 = {
    /** Map from contract name to a collection of schemas for that contract. */
    contracts: Map<ContractName, SchemaContractV1>;
};

/** Contains all the contract schemas for a smart contract module V1. */
export type SchemaModuleV2 = {
    /** Map from contract name to a collection of schemas for that contract. */
    contracts: Map<ContractName, SchemaContractV2>;
};

/** Contains all the contract schemas for a smart contract module V1. */
export type SchemaModuleV3 = {
    /** Map from contract name to a collection of schemas for that contract. */
    contracts: Map<ContractName, SchemaContractV3>;
};

/** Describes all the schemas of a V0 smart contract. */
export type SchemaContractV0 = {
    /** Schema for the smart contract state. */
    state?: SchemaType;
    /** Schemas for the init-function. */
    init?: SchemaFunctionV1;
    /** Map of schemas for the receive-functions. */
    receive: Map<EntrypointName, SchemaFunctionV1>;
};

/** Describes schemas of a smart contract in a V1 smart contract module. */
export type SchemaContractV1 = {
    /** Schemas for the init-function. */
    init?: SchemaFunctionV1;
    /** Map of schemas for the receive-functions. */
    receive: Map<EntrypointName, SchemaFunctionV1>;
};

/** Describes schemas of a smart contract in a V1 smart contract module. */
export type SchemaContractV2 = {
    /** Schemas for the init-function. */
    init?: SchemaFunctionV2;
    /** Map of schemas for the receive-functions. */
    receive: Map<EntrypointName, SchemaFunctionV2>;
};

/** Describes schemas of a smart contract in a V1 smart contract module. */
export type SchemaContractV3 = {
    /** Schemas for the init-function. */
    init?: SchemaFunctionV2;
    /** Map of schemas for the receive-functions. */
    receive: Map<EntrypointName, SchemaFunctionV2>;
    /** Schema for events logged by this contract. */
    event?: SchemaType;
};

/** Describes schemas of a init or receive function in a smart contract in a V1 smart contract module. */
export type SchemaFunctionV1 = {
    /** Schema for the parameter of this function. */
    parameter?: SchemaType;
    /** Schema for the return value of this function. */
    returnValue?: SchemaType;
};

/** Describes schemas of a init or receive function in a smart contract in a V1 smart contract module. */
export type SchemaFunctionV2 = {
    /** Schema for the parameter of this function. */
    parameter?: SchemaType;
    /** Schema for the return value of this function. */
    returnValue?: SchemaType;
    /** Schema for error message of this function. */
    error?: SchemaType;
};

/** Type of the variable used to encode the length collections such as Sets, List, Maps and more. */
export type SchemaSizeLength = 'U8' | 'U16' | 'U32' | 'U64';

/** Schema information for some variant of an enum (here it is an enum in Rust terms). */
export type SchemaEnumVariant = {
    /** Name of the variant. */
    name: string;
    /** Fields of this variant */
    fields: SchemaFields;
};

/**
 * Schema information of fields in either a struct or a variant of some enum (here it is an enum in Rust terms).
 * The fields are either named, unnamed or none.
 */
export type SchemaFields =
    | { type: 'Named'; fields: SchemaNamedField[] }
    | { type: 'Unnamed'; fields: SchemaType[] }
    | { type: 'None' };

/**
 * Schema information of a single named field in either a struct or a variant of some enum (here it is an enum in Rust terms).
 */
export type SchemaNamedField = { name: string; field: SchemaType };

/** The schema type information. Provides information of how to serialize or deserialzie some binary information into a structure. */
export type SchemaType =
    | {
          type:
              | 'Unit'
              | 'Bool'
              | 'U8'
              | 'U16'
              | 'U32'
              | 'U64'
              | 'U128'
              | 'I8'
              | 'I16'
              | 'I32'
              | 'I64'
              | 'I128'
              | 'Amount'
              | 'AccountAddress'
              | 'ContractAddress'
              | 'Timestamp'
              | 'Duration';
      }
    | { type: 'Pair'; first: SchemaType; second: SchemaType }
    | { type: 'List'; sizeLength: SchemaSizeLength; item: SchemaType }
    | { type: 'Set'; sizeLength: SchemaSizeLength; item: SchemaType }
    | {
          type: 'Map';
          sizeLength: SchemaSizeLength;
          key: SchemaType;
          value: SchemaType;
      }
    | { type: 'Array'; size: number; item: SchemaType }
    | { type: 'Struct'; fields: SchemaFields }
    | { type: 'Enum'; variants: SchemaEnumVariant[] }
    | { type: 'String'; sizeLength: SchemaSizeLength }
    | { type: 'ContractName'; sizeLength: SchemaSizeLength }
    | { type: 'ReceiveName'; sizeLength: SchemaSizeLength }
    | { type: 'ULeb128'; maxByteSize: number }
    | { type: 'ILeb128'; maxByteSize: number }
    | { type: 'ByteList'; sizeLength: SchemaSizeLength }
    | { type: 'ByteArray'; size: number }
    | { type: 'TaggedEnum'; variants: Map<number, SchemaEnumVariant> };

/**
 * Prefix of versioned smart contract module schemas.
 * This allows tooling to distinguish a module schema with version information from a schema without, since the versioned must have this exact prefix.
 */
const magicPrefixVersionedSchema = Buffer.alloc(2, 255);

/**
 * Deserialize a versioned smart contract module schema. This checks for the prefix of two max-value u8 bytes and fails otherwise.
 * @param {Cursor} cursor A cursor over the buffer to deserialize.
 * @throws If provided smart contract module schema is not prefixed with two max-value u8 bytes, or if the deserialization fails.
 * @returns {VersionedSchemaModule} The structured representation of a smart contract schema module.
 */
export function deserializeVersionedSchemaModule(cursor: Cursor): VersionedSchemaModule {
    const prefix = cursor.read(2);
    if (!prefix.equals(magicPrefixVersionedSchema)) {
        throw new Error('Deserialization failed: Unable to find prefix for versioned module.');
    }
    const version = deserializeUInt8(cursor);
    switch (version) {
        case 0:
            return { version, module: deserializeSchemaModuleV0(cursor) };
        case 1:
            return { version, module: deserializeSchemaModuleV1(cursor) };
        case 2:
            return { version, module: deserializeSchemaModuleV2(cursor) };
        case 3:
            return { version, module: deserializeSchemaModuleV3(cursor) };
        default:
            throw new Error('Deserialization failed: Unsupported version for schema module.');
    }
}

/**
 * Deserialize a smart contract module schema which does not contain version information.
 * This is only relevant for old versions of the smart contract module schema.
 * @param {UnversionedSchemaVersion} version The version of the smart contract schema module.
 * @param {Cursor} cursor A cursor over the buffer to deserialize.
 * @throws If the deserialization fails.
 * @returns {VersionedSchemaModule} The structured representation of a smart contract schema module.
 */
export function deserializeUnversionedSchemaModule(
    version: UnversionedSchemaVersion,
    cursor: Cursor
): VersionedSchemaModule {
    switch (version) {
        case 0:
            return { version, module: deserializeSchemaModuleV0(cursor) };
        case 1:
            return { version, module: deserializeSchemaModuleV1(cursor) };
        default:
            throw new Error('Deserialization failed: Unsupported version provided for unversioned schema module.');
    }
}

/**
 * Deserialize maps provided the size length and functions for deserializing keys and values.
 * It will first deserialize the size of the map, then deserialize this number of key-value pairs building the map.
 *
 * @template K Type representing the key in the map.
 * @template V Type representing the value in the map.
 * @param {SchemaSizeLength} sizeLength Size of the encoding of the collection lenght.
 * @param {Deserializer<K>} deserialKey Function for deserializing a key.
 * @param {Deserializer<V>} deserialValue Function for deserializing a value.
 * @param {Cursor} cursor A cursor over the buffer to deserialize.
 * @returns {Map<K, V>}
 */
function deserializeMap<K, V>(
    sizeLength: SchemaSizeLength,
    deserialKey: Deserializer<K>,
    deserialValue: Deserializer<V>,
    cursor: Cursor
): Map<K, V> {
    const itemLen = deserializeSize(sizeLength, cursor);
    const map = new Map<K, V>();
    for (let i = 0; i < itemLen; i++) {
        const key = deserialKey(cursor);
        const value = deserialValue(cursor);
        map.set(key, value);
    }
    return map;
}

/**
 * Deserialize a schema size length.
 * @param {Cursor} cursor A cursor over the buffer to deserialize.
 * @returns {SchemaSizeLength}
 */
function deserializeSizeLength(cursor: Cursor): SchemaSizeLength {
    const sizeLength = deserializeUInt8(cursor);
    switch (sizeLength) {
        case 0:
            return 'U8';
        case 1:
            return 'U16';
        case 2:
            return 'U32';
        case 3:
            return 'U64';
        default:
            throw new Error('Deserialization failed: Unknown size length tag: ' + sizeLength);
    }
}

/**
 * Deserialize a size provided some size length.
 * @param {SchemaSizeLength} sizeLength The size length to use for deserializing.
 * @param {Cursor} cursor A cursor over the buffer to deserialize.
 * @returns {bigint} The deserialized size.
 */
function deserializeSize(sizeLength: SchemaSizeLength, cursor: Cursor): bigint {
    switch (sizeLength) {
        case 'U8':
            return BigInt(deserializeUInt8(cursor));
        case 'U16':
            return BigInt(deserializeUInt16LE(cursor));
        case 'U32':
            return BigInt(deserializeUInt32LE(cursor));
        case 'U64':
            return deserializeBigUInt64LE(cursor);
    }
}

/**
 * Deserialize a string provided the length of the size encoding.
 * The function will first deserialize size of the string and then this number of bytes for the content encoded as uft8.
 *
 * @param {SchemaSizeLength} sizeLength The size length to use for deserializing the string length.
 * @param {Cursor} cursor A cursor over the buffer to deserialize.
 * @returns {string} The deserialized string.
 */
function deserializeString(sizeLength: SchemaSizeLength, cursor: Cursor): string {
    const byteLen = deserializeSize(sizeLength, cursor);
    if (byteLen > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new Error('Deserialization failed: Unsupported string length: ' + byteLen);
    }
    const bytes = cursor.read(Number(byteLen)); // Converting bigint to number here is safe becuase of the check above.
    return bytes.toString('utf8');
}

/**
 * Deserialize a list of items provided the length of the size encoding.
 * The function will first deserialize the size of the list and then this number of items.
 *
 * @template A Type representing an item in the list.
 * @param {SchemaSizeLength} sizeLength The size length to use for deserializing the list size.
 * @param {Deserializer<A>} deserializeItem Function for deserializing an item in this list.
 * @param {Cursor} cursor A cursor over the buffer to deserialize.
 * @returns {A[]} The deserialized list of items.
 */
function deserializeList<A>(sizeLength: SchemaSizeLength, deserializeItem: Deserializer<A>, cursor: Cursor): A[] {
    const len = deserializeSize(sizeLength, cursor);
    const out = [];
    for (let i = 0n; i < len; i++) {
        out.push(deserializeItem(cursor));
    }
    return out;
}

/**
 * Deserialize an optional value.
 * The function will first deserialize a byte indicating whether a value is present or not, if present it will deserialize the value.
 *
 * @template A Type representing the optional value.
 * @param {Deserializer<A>} deserializeValue Function for deserializing the value.
 * @param {Cursor} cursor A cursor over the buffer to deserialize.
 * @returns {A | undefined} The deserialized optional item.
 */
function deserializeOption<A>(deserializeValue: Deserializer<A>, cursor: Cursor): A | undefined {
    const byte = deserializeUInt8(cursor);
    if (byte === 0) {
        return undefined;
    } else if (byte === 1) {
        return deserializeValue(cursor);
    } else {
        throw new Error('Deserialization failed: Unexpected tag for optional value: ' + byte);
    }
}

/**
 * Deserialize a schema type.
 * @param {ArrayBuffer} buffer The buffer to deserialize.
 * @returns {SchemaType} The deserialized schema type.
 */
export function deserializeSchemaType(buffer: ArrayBuffer): SchemaType {
    const cursor = Cursor.fromBuffer(buffer);
    return deserialSchemaType(cursor);
}

/**
 * Deserialize a schema type.
 * @param {Cursor} cursor A cursor over the buffer to deserialize.
 * @returns {SchemaType} The deserialized schema type.
 */
function deserialSchemaType(cursor: Cursor): SchemaType {
    const tag = deserializeUInt8(cursor);
    switch (tag) {
        case 0:
            return { type: 'Unit' };
        case 1:
            return { type: 'Bool' };
        case 2:
            return { type: 'U8' };
        case 3:
            return { type: 'U16' };
        case 4:
            return { type: 'U32' };
        case 5:
            return { type: 'U64' };
        case 6:
            return { type: 'I8' };
        case 7:
            return { type: 'I16' };
        case 8:
            return { type: 'I32' };
        case 9:
            return { type: 'I64' };
        case 10:
            return { type: 'Amount' };
        case 11:
            return { type: 'AccountAddress' };
        case 12:
            return { type: 'ContractAddress' };
        case 13:
            return { type: 'Timestamp' };
        case 14:
            return { type: 'Duration' };
        case 15:
            return {
                type: 'Pair',
                first: deserialSchemaType(cursor),
                second: deserialSchemaType(cursor),
            };
        case 16:
            return {
                type: 'List',
                sizeLength: deserializeSizeLength(cursor),
                item: deserialSchemaType(cursor),
            };
        case 17:
            return {
                type: 'Set',
                sizeLength: deserializeSizeLength(cursor),
                item: deserialSchemaType(cursor),
            };
        case 18:
            return {
                type: 'Map',
                sizeLength: deserializeSizeLength(cursor),
                key: deserialSchemaType(cursor),
                value: deserialSchemaType(cursor),
            };
        case 19:
            return {
                type: 'Array',
                size: deserializeUInt32LE(cursor),
                item: deserialSchemaType(cursor),
            };
        case 20:
            return {
                type: 'Struct',
                fields: deserializeFields(cursor),
            };
        case 21:
            return {
                type: 'Enum',
                variants: deserializeList('U32', deserializeEnumVariant, cursor),
            };
        case 22:
            return {
                type: 'String',
                sizeLength: deserializeSizeLength(cursor),
            };
        case 23:
            return { type: 'U128' };
        case 24:
            return { type: 'I128' };
        case 25:
            return {
                type: 'ContractName',
                sizeLength: deserializeSizeLength(cursor),
            };
        case 26:
            return {
                type: 'ReceiveName',
                sizeLength: deserializeSizeLength(cursor),
            };
        case 27:
            return {
                type: 'ULeb128',
                maxByteSize: deserializeUInt32LE(cursor),
            };
        case 28:
            return {
                type: 'ILeb128',
                maxByteSize: deserializeUInt32LE(cursor),
            };
        case 29:
            return {
                type: 'ByteList',
                sizeLength: deserializeSizeLength(cursor),
            };
        case 30:
            return {
                type: 'ByteArray',
                size: deserializeUInt32LE(cursor),
            };
        case 31:
            return {
                type: 'TaggedEnum',
                variants: deserializeMap('U32', deserializeUInt8, deserializeEnumVariant, cursor),
            };

        default:
            throw new Error('Deserialization failed: Unexpected tag for SchemaType: ' + tag);
    }
}

/**
 * Deserialize fields for schema type struct or enum variant.
 * @param {Cursor} cursor A cursor over the buffer to deserialize.
 * @returns {SchemaFields} The deserialized contract schemas.
 */
function deserializeFields(cursor: Cursor): SchemaFields {
    const tag = deserializeUInt8(cursor);
    switch (tag) {
        case 0:
            return {
                type: 'Named',
                fields: deserializeList('U32', deserializeNamedField, cursor),
            };
        case 1:
            return {
                type: 'Unnamed',
                fields: deserializeList('U32', deserialSchemaType, cursor),
            };
        case 2:
            return { type: 'None' };
        default:
            throw new Error('Deserialization failed: Unexpected tag for Fields: ' + tag);
    }
}

/**
 * Deserialize a named field for schema type struct or enum variant.
 * @param {Cursor} cursor A cursor over the buffer to deserialize.
 * @returns {SchemaNamedField} The deserialized contract schemas.
 */
function deserializeNamedField(cursor: Cursor): SchemaNamedField {
    return {
        name: deserializeString('U32', cursor),
        field: deserialSchemaType(cursor),
    };
}

/**
 * Deserialize an enum variant.
 * @param {Cursor} cursor A cursor over the buffer to deserialize.
 * @returns {SchemaEnumVariant} The deserialized contract schemas.
 */
function deserializeEnumVariant(cursor: Cursor): SchemaEnumVariant {
    return {
        name: deserializeString('U32', cursor),
        fields: deserializeFields(cursor),
    };
}

/**
 * Deserialize schemas for a smart contract init- or receive function.
 * @param {Cursor} cursor A cursor over the buffer to deserialize.
 * @returns {SchemaFunctionV1} The deserialized function schemas.
 */
function deserializeSchemaFunctionV1(cursor: Cursor): SchemaFunctionV1 {
    const idx = deserializeUInt8(cursor);
    const out: SchemaFunctionV1 = {};
    if ([0, 2].includes(idx)) {
        out.parameter = deserialSchemaType(cursor);
    }
    if ([1, 2].includes(idx)) {
        out.returnValue = deserialSchemaType(cursor);
    }
    return out;
}

/**
 * Deserialize schemas for a smart contract init- or receive function.
 * @param {Cursor} cursor A cursor over the buffer to deserialize.
 * @returns {SchemaFunctionV2} The deserialized function schemas.
 */
function deserializeSchemaFunctionV2(cursor: Cursor): SchemaFunctionV2 {
    const idx = deserializeUInt8(cursor);
    if (idx > 7) {
        throw new Error('Deserialization failed: Unexpected ');
    }
    const out: SchemaFunctionV2 = {};
    if ([0, 2, 4, 6].includes(idx)) {
        out.parameter = deserialSchemaType(cursor);
    }
    if ([1, 2, 5, 6].includes(idx)) {
        out.returnValue = deserialSchemaType(cursor);
    }
    if ([3, 4, 5, 6].includes(idx)) {
        out.error = deserialSchemaType(cursor);
    }
    return out;
}

/**
 * Deserialize schemas for a smart contract.
 * @param {Cursor} cursor A cursor over the buffer to deserialize.
 * @returns {SchemaContractV0} The deserialized contract schemas.
 */
function deserializeContractV0(cursor: Cursor): SchemaContractV0 {
    return {
        state: deserializeOption(deserialSchemaType, cursor),
        init: deserializeOption(deserializeSchemaFunctionV1, cursor),
        receive: deserializeMap('U32', deserializeString.bind(undefined, 'U32'), deserializeSchemaFunctionV1, cursor),
    };
}

/**
 * Deserialize schemas for a smart contract.
 * @param {Cursor} cursor A cursor over the buffer to deserialize.
 * @returns {SchemaContractV1} The deserialized contract schemas.
 */
function deserializeContractV1(cursor: Cursor): SchemaContractV1 {
    return {
        init: deserializeOption(deserializeSchemaFunctionV1, cursor),
        receive: deserializeMap('U32', deserializeString.bind(undefined, 'U32'), deserializeSchemaFunctionV1, cursor),
    };
}

/**
 * Deserialize schemas for a smart contract.
 * @param {Cursor} cursor A cursor over the buffer to deserialize.
 * @returns {SchemaContractV2} The deserialized contract schemas.
 */
function deserializeContractV2(cursor: Cursor): SchemaContractV2 {
    return {
        init: deserializeOption(deserializeSchemaFunctionV2, cursor),
        receive: deserializeMap('U32', deserializeString.bind(undefined, 'U32'), deserializeSchemaFunctionV2, cursor),
    };
}

/**
 * Deserialize schemas for a smart contract.
 * @param {Cursor} cursor A cursor over the buffer to deserialize.
 * @returns {SchemaContractV3} The deserialized contract schemas.
 */
function deserializeContractV3(cursor: Cursor): SchemaContractV3 {
    return {
        init: deserializeOption(deserializeSchemaFunctionV2, cursor),
        receive: deserializeMap('U32', deserializeString.bind(undefined, 'U32'), deserializeSchemaFunctionV2, cursor),
        event: deserializeOption(deserialSchemaType, cursor),
    };
}

/**
 * Deserialize schemas for a smart contract module.
 * @param {Cursor} cursor A cursor over the buffer to deserialize.
 * @returns {SchemaModuleV0} The deserialized module schemas.
 */
function deserializeSchemaModuleV0(cursor: Cursor): SchemaModuleV0 {
    return {
        contracts: deserializeMap('U32', deserializeString.bind(undefined, 'U32'), deserializeContractV0, cursor),
    };
}

/**
 * Deserialize schemas for a smart contract module.
 * @param {Cursor} cursor A cursor over the buffer to deserialize.
 * @returns {SchemaModuleV1} The deserialized module schemas.
 */
function deserializeSchemaModuleV1(cursor: Cursor): SchemaModuleV1 {
    return {
        contracts: deserializeMap('U32', deserializeString.bind(undefined, 'U32'), deserializeContractV1, cursor),
    };
}

/**
 * Deserialize schemas for a smart contract module.
 * @param {Cursor} cursor A cursor over the buffer to deserialize.
 * @returns {SchemaModuleV2} The deserialized module schemas.
 */
function deserializeSchemaModuleV2(cursor: Cursor): SchemaModuleV2 {
    return {
        contracts: deserializeMap('U32', deserializeString.bind(undefined, 'U32'), deserializeContractV2, cursor),
    };
}

/**
 * Deserialize schemas for a smart contract module.
 * @param {Cursor} cursor A cursor over the buffer to deserialize.
 * @returns {SchemaModuleV3} The deserialized module schemas.
 */
function deserializeSchemaModuleV3(cursor: Cursor): SchemaModuleV3 {
    return {
        contracts: deserializeMap('U32', deserializeString.bind(undefined, 'U32'), deserializeContractV3, cursor),
    };
}

/**
 * Serialize a schema type.
 * @param {SchemaType} schemaType The schema type to serialize
 * @returns {Uint8Array} The buffer containing the serialized schema type.
 */
export function serializeSchemaType(schemaType: SchemaType): Uint8Array {
    switch (schemaType.type) {
        case 'Unit':
            return Uint8Array.of(0);
        case 'Bool':
            return Uint8Array.of(1);
        case 'U8':
            return Uint8Array.of(2);
        case 'U16':
            return Uint8Array.of(3);
        case 'U32':
            return Uint8Array.of(4);
        case 'U64':
            return Uint8Array.of(5);
        case 'I8':
            return Uint8Array.of(6);
        case 'I16':
            return Uint8Array.of(7);
        case 'I32':
            return Uint8Array.of(8);
        case 'I64':
            return Uint8Array.of(9);
        case 'Amount':
            return Uint8Array.of(10);
        case 'AccountAddress':
            return Uint8Array.of(11);
        case 'ContractAddress':
            return Uint8Array.of(12);
        case 'Timestamp':
            return Uint8Array.of(13);
        case 'Duration':
            return Uint8Array.of(14);
        case 'Pair':
            return Buffer.concat([
                Uint8Array.of(15),
                serializeSchemaType(schemaType.first),
                serializeSchemaType(schemaType.second),
            ]);
        case 'List':
            return Buffer.concat([
                Uint8Array.of(16),
                serialSizeLength(schemaType.sizeLength),
                serializeSchemaType(schemaType.item),
            ]);
        case 'Set':
            return Buffer.concat([
                Uint8Array.of(17),
                serialSizeLength(schemaType.sizeLength),
                serializeSchemaType(schemaType.item),
            ]);
        case 'Map':
            return Buffer.concat([
                Uint8Array.of(18),
                serialSizeLength(schemaType.sizeLength),
                serializeSchemaType(schemaType.key),
                serializeSchemaType(schemaType.value),
            ]);
        case 'Array':
            return Buffer.concat([
                Uint8Array.of(19),
                encodeWord32(schemaType.size, true),
                serializeSchemaType(schemaType.item),
            ]);
        case 'Struct':
            return Buffer.concat([Uint8Array.of(20), serialFields(schemaType.fields)]);
        case 'Enum':
            return Buffer.concat([Uint8Array.of(21), serializeList('U32', serializeEnumVariant, schemaType.variants)]);
        case 'String':
            return Buffer.concat([Uint8Array.of(22), serialSizeLength(schemaType.sizeLength)]);
        case 'U128':
            return Uint8Array.of(23);
        case 'I128':
            return Uint8Array.of(24);
        case 'ContractName':
            return Buffer.concat([Uint8Array.of(25), serialSizeLength(schemaType.sizeLength)]);
        case 'ReceiveName':
            return Buffer.concat([Uint8Array.of(26), serialSizeLength(schemaType.sizeLength)]);
        case 'ULeb128':
            return Buffer.concat([Uint8Array.of(27), encodeWord32(schemaType.maxByteSize, true)]);
        case 'ILeb128':
            return Buffer.concat([Uint8Array.of(28), encodeWord32(schemaType.maxByteSize, true)]);
        case 'ByteList':
            return Buffer.concat([Uint8Array.of(29), serialSizeLength(schemaType.sizeLength)]);
        case 'ByteArray':
            return Buffer.concat([Uint8Array.of(30), encodeWord32(schemaType.size, true)]);
        case 'TaggedEnum':
            return Buffer.concat([
                Uint8Array.of(31),
                serializeMap('U32', encodeWord8, serializeEnumVariant, schemaType.variants),
            ]);
        default:
            throw new Error('Deserialization failed: Unexpected tag for SchemaType: ');
    }
}

/**
 * Serialize the size length itself.
 * @param {SchemaSizeLength} sizeLength Size length to serialize.
 * @returns {Uint8Array} Buffer with serialization.
 */
function serialSizeLength(sizeLength: SchemaSizeLength): Uint8Array {
    switch (sizeLength) {
        case 'U8':
            return new Uint8Array([0]);
        case 'U16':
            return new Uint8Array([1]);
        case 'U32':
            return new Uint8Array([2]);
        case 'U64':
            return new Uint8Array([3]);
    }
}

/**
 * Serialize the size of some collection using the size length.
 * @param {SchemaSizeLength} sizeLength Size length to use when serializing the size.
 * @param {bigint | number} size Size to serialize.
 * @returns {Uint8Array} Buffer with serialization.
 */
function serialSize(sizeLength: SchemaSizeLength, size: bigint | number): Uint8Array {
    switch (sizeLength) {
        case 'U8':
            return encodeWord8(Number(size));
        case 'U16':
            return encodeWord16(Number(size), true);
        case 'U32':
            return encodeWord32(Number(size), true);
        case 'U64':
            return encodeWord64(BigInt(size), true);
    }
}

/**
 * Serialize fields for schema type struct or enum variant.
 * @param {SchemaFields} fields Fields for a struct or enum variant.
 * @returns {Uint8Array} Buffer with serialization.
 */
function serialFields(fields: SchemaFields): Uint8Array {
    switch (fields.type) {
        case 'Named':
            return Buffer.concat([Uint8Array.of(0), serializeList('U32', serialNamedField, fields.fields)]);
        case 'Unnamed':
            return Buffer.concat([Uint8Array.of(1), serializeList('U32', serializeSchemaType, fields.fields)]);
        case 'None':
            return Uint8Array.of(2);
    }
}

/**
 * Serialize named field for schema fields.
 * @param {SchemaNamedField} named The named field to serialize.
 * @returns {Uint8Array} Buffer with serialization.
 */
function serialNamedField(named: SchemaNamedField): Uint8Array {
    return Buffer.concat([serializeString('U32', named.name), serializeSchemaType(named.field)]);
}

/**
 * Serialize an enum variant.
 * @param {SchemaEnumVariant} variant The enum variant to serialize.
 * @returns {Uint8Array} Buffer with serialization.
 */
function serializeEnumVariant(variant: SchemaEnumVariant): Uint8Array {
    return Buffer.concat([serializeString('U32', variant.name), serialFields(variant.fields)]);
}

/**
 * Represent a function for serializing a type A.
 * @template A Item to be serialized.
 */
type Serializer<A> = (a: A) => Uint8Array;

/**
 * Serialize a list of items.
 * @template A Type of a list item.
 * @param {SchemaSizeLength} sizeLength The size length to use for serializing the size.
 * @param {Serializer<A>} serialItem Function for serializing each item.
 * @param {A[]} list List of items to serialize.
 * @returns {Uint8Array} Buffer with serialization.
 */
function serializeList<A>(sizeLength: SchemaSizeLength, serialItem: Serializer<A>, list: A[]): Uint8Array {
    return Buffer.concat([serialSize(sizeLength, list.length), ...list.map(serialItem)]);
}

/**
 * Serialize a string.
 * @param {SchemaSizeLength} sizeLength The size length to use for serializing the size.
 * @returns {Uint8Array} Buffer with serialization.
 */
function serializeString(sizeLength: SchemaSizeLength, value: string): Uint8Array {
    return Buffer.concat([serialSize(sizeLength, value.length), Buffer.from(value, 'utf8')]);
}

/**
 * Serialize a map.
 * @template K Type for keys used in the map.
 * @template V Type for values used in the map.
 * @param {SchemaSizeLength} sizeLength The size length to use for serializing the size.
 * @param {Serializer<K>} serialKey Function for serializing a key.
 * @param {Serializer<v>} serialValue Function for serializing a value.
 * @param {Map<K, V>} map The map to serialize.
 * @returns {Uint8Array} Buffer with serialization.
 */
function serializeMap<K, V>(
    sizeLength: SchemaSizeLength,
    serialKey: Serializer<K>,
    serialValue: Serializer<V>,
    map: Map<K, V>
): Uint8Array {
    const buffers: Uint8Array[] = [serialSize(sizeLength, map.size)];
    for (const [k, v] of map.entries()) {
        buffers.push(serialKey(k), serialValue(v));
    }
    return Buffer.concat(buffers);
}
