import { Cursor } from './deserializationHelpers';
import { Buffer } from 'buffer/';
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

type UnversionedSchemaVersion = 0 | 1;

export class RawModuleSchema {
    private constructor(
        public readonly buffer: ArrayBuffer,
        private readonly version?: UnversionedSchemaVersion
    ) {}

    public static fromBytes(buffer: ArrayBuffer): RawModuleSchema {
        return new RawModuleSchema(buffer);
    }

    public static fromUnversionedBytes(
        buffer: ArrayBuffer,
        version: UnversionedSchemaVersion
    ): RawModuleSchema {
        return new RawModuleSchema(buffer, version);
    }

    public parse(): ParsedModuleSchema {
        if (this.version === undefined) {
            return ParsedModuleSchema.fromBytes(this.buffer);
        } else {
            return ParsedModuleSchema.fromUnversionedBytes(
                this.buffer,
                this.version
            );
        }
    }
}

export class ParsedModuleSchema {
    private constructor(public readonly schema: VersionedSchemaModule) {}

    public static fromBytes(bytes: ArrayBuffer): ParsedModuleSchema {
        return new ParsedModuleSchema(
            deserializeVersionedSchemaModule(Cursor.fromBuffer(bytes))
        );
    }

    public static fromUnversionedBytes(
        bytes: ArrayBuffer,
        version: UnversionedSchemaVersion
    ): ParsedModuleSchema {
        return new ParsedModuleSchema(
            deserializeUnversionedSchemaModule(
                Cursor.fromBuffer(bytes),
                version
            )
        );
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
 * Contains all the contract schemas for a smart contract module V0.
 * Older versions of smart contracts might have this embedded in the custom section labelled `concordium-schema-v1`.
 */
export type SchemaModuleV0 = {
    contracts: Map<string, SchemaContractV1>;
};

export type SchemaContractV0 = {
    state?: SchemaType;
    init?: SchemaFunctionV1;
    receive: Map<string, SchemaFunctionV1>;
};

/**
 * Contains all the contract schemas for a smart contract module V1.
 * Older versions of smart contracts might have this embedded in the custom section labelled `concordium-schema-v2`.
 */
export type SchemaModuleV1 = {
    contracts: Map<string, SchemaContractV1>;
};

export type SchemaContractV1 = {
    init?: SchemaFunctionV1;
    receive: Map<string, SchemaFunctionV1>;
};

export type SchemaFunctionV1 = {
    parameter?: SchemaType;
    returnValue?: SchemaType;
};

export type SchemaModuleV2 = {
    contracts: Map<string, SchemaContractV2>;
};

export type SchemaContractV2 = {
    init?: SchemaFunctionV2;
    receive: Map<string, SchemaFunctionV2>;
};

export type SchemaModuleV3 = {
    contracts: Map<string, SchemaContractV3>;
};

export type SchemaContractV3 = {
    init?: SchemaFunctionV2;
    receive: Map<string, SchemaFunctionV2>;
    event?: SchemaType;
};

export type SchemaFunctionV2 = {
    parameter?: SchemaType;
    returnValue?: SchemaType;
    error?: SchemaType;
};

export type SchemaSizeLength = 'U8' | 'U16' | 'U32' | 'U64';
export type SchemaEnumVariant = {
    name: string;
    fields: SchemaFields;
};
export type SchemaFields =
    | { type: 'Named'; fields: SchemaNamedField[] }
    | { type: 'Unnamed'; fields: SchemaType[] }
    | { type: 'None' };

export type SchemaNamedField = { name: string; field: SchemaType };

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

const magicPrefixVersionedSchema = Buffer.alloc(2, 255);

export function deserializeVersionedSchemaModule(
    cursor: Cursor
): VersionedSchemaModule {
    const prefix = cursor.read(2);
    if (!prefix.equals(magicPrefixVersionedSchema)) {
        throw new Error(
            'Deserialization failed: Unable to find prefix for versioned module.'
        );
    }
    const version = cursor.readUInt8();
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
            throw new Error(
                'Deserialization failed: Unsupported version for schema module.'
            );
    }
}

export function deserializeUnversionedSchemaModule(
    cursor: Cursor,
    version: UnversionedSchemaVersion
): VersionedSchemaModule {
    switch (version) {
        case 0:
            return { version, module: deserializeSchemaModuleV0(cursor) };
        case 1:
            return { version, module: deserializeSchemaModuleV1(cursor) };
        default:
            throw new Error(
                'Deserialization failed: Unsupported version provided for unversioned schema module.'
            );
    }
}

interface Deserializer<A> {
    (cursor: Cursor): A;
}

function mapDeserializer<K, V>(
    sizeLength: SchemaSizeLength,
    deserialKey: Deserializer<K>,
    deserialValue: Deserializer<V>
): Deserializer<Map<K, V>> {
    const deserialSizeLength = sizeLengthDeserializer(sizeLength);
    return (cursor) => {
        const itemLen = deserialSizeLength(cursor);
        const map = new Map<K, V>();
        for (let i = 0; i < itemLen; i++) {
            const key = deserialKey(cursor);
            const value = deserialValue(cursor);
            map.set(key, value);
        }
        return map;
    };
}

function deserializeSizeLength(cursor: Cursor): SchemaSizeLength {
    const sizeLength = cursor.readUInt8();
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
            throw new Error(
                'Deserialization failed: Unknown size length tag: ' + sizeLength
            );
    }
}

function sizeLengthDeserializer(
    sizeLength: SchemaSizeLength
): Deserializer<bigint> {
    return (cursor) => {
        switch (sizeLength) {
            case 'U8':
                return BigInt(cursor.readUInt8());
            case 'U16':
                return BigInt(cursor.readUInt16LE());
            case 'U32':
                return BigInt(cursor.readUInt32LE());
            case 'U64':
                return cursor.readBigUInt64LE();
        }
    };
}

function stringDeserializer(
    sizeLength: SchemaSizeLength
): Deserializer<string> {
    const deserialSizeLength = sizeLengthDeserializer(sizeLength);
    return (cursor) => {
        const byteLen = deserialSizeLength(cursor);
        if (byteLen > BigInt(Number.MAX_SAFE_INTEGER)) {
            throw new Error(
                'Deserialization failed: Unsupported string length: ' + byteLen
            );
        }
        const bytes = cursor.read(Number(byteLen)); // Converting bigint to number here is safe becuase of the check above.
        return bytes.toString('utf8');
    };
}

function listDeserializer<A>(
    sizeLength: SchemaSizeLength,
    deserializeItem: Deserializer<A>
): Deserializer<A[]> {
    const deserialSizeLength = sizeLengthDeserializer(sizeLength);
    return (cursor) => {
        const len = deserialSizeLength(cursor);
        const out = [];
        for (let i = 0n; i < len; i++) {
            out.push(deserializeItem(cursor));
        }
        return out;
    };
}

function optional<A>(
    deserializeValue: Deserializer<A>
): Deserializer<A | undefined> {
    return (cursor: Cursor) => {
        const byte = cursor.readUInt8();
        if (byte === 0) {
            return undefined;
        } else if (byte === 1) {
            return deserializeValue(cursor);
        } else {
            throw new Error(
                'Deserialization failed: Unexpected tag for optional value: ' +
                    byte
            );
        }
    };
}

type DeserializerOut<D> = D extends Deserializer<infer O> ? O : never;

type StructDeserializerDescription = Record<string, Deserializer<unknown>>;

type StructDeserializer<S extends StructDeserializerDescription> =
    Deserializer<{ [K in keyof S]: DeserializerOut<S[K]> }>;

function structDeserializer<S extends StructDeserializerDescription>(
    struct: S
): StructDeserializer<S> {
    return (cursor: Cursor) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const out = {} as any;
        for (const key in struct) {
            if (Object.prototype.hasOwnProperty.call(struct, key)) {
                out[key] = struct[key](cursor);
            }
        }
        return out;
    };
}

function deserialSchemaType(cursor: Cursor): SchemaType {
    const tag = cursor.readUInt8();
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
                size: cursor.readUInt32LE(),
                item: deserialSchemaType(cursor),
            };
        case 20:
            return {
                type: 'Struct',
                fields: deserialFields(cursor),
            };
        case 21:
            return {
                type: 'Enum',
                variants: listDeserializer('U32', deserialEnumVariant)(cursor),
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
                maxByteSize: cursor.readUInt32LE(),
            };
        case 28:
            return {
                type: 'ILeb128',
                maxByteSize: cursor.readUInt32LE(),
            };
        case 29:
            return {
                type: 'ByteList',
                sizeLength: deserializeSizeLength(cursor),
            };
        case 30:
            return {
                type: 'ByteArray',
                size: cursor.readUInt32LE(),
            };
        case 31:
            return {
                type: 'TaggedEnum',
                variants: mapDeserializer(
                    'U32',
                    (cursor) => cursor.readUInt8(),
                    deserialEnumVariant
                )(cursor),
            };

        default:
            throw new Error(
                'Deserialization failed: Unexpected tag for SchemaType: ' + tag
            );
    }
}

function deserialSchemaFunctionV1(cursor: Cursor): SchemaFunctionV1 {
    const tag = cursor.readUInt8();
    const out: SchemaFunctionV1 = {};
    if ([0, 2].includes(tag)) {
        out.parameter = deserialSchemaType(cursor);
    }
    if ([1, 2].includes(tag)) {
        out.returnValue = deserialSchemaType(cursor);
    }
    return out;
}

function deserialSchemaFunctionV2(cursor: Cursor): SchemaFunctionV2 {
    const idx = cursor.readUInt8();
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

const deserialContractV0: Deserializer<SchemaContractV0> = structDeserializer({
    state: optional(deserialSchemaType),
    init: optional(deserialSchemaFunctionV1),
    receive: mapDeserializer(
        'U32',
        stringDeserializer('U32'),
        deserialSchemaFunctionV1
    ),
});

const deserialContractV1: Deserializer<SchemaContractV1> = structDeserializer({
    init: optional(deserialSchemaFunctionV1),
    receive: mapDeserializer(
        'U32',
        stringDeserializer('U32'),
        deserialSchemaFunctionV1
    ),
});

const deserialContractV2: Deserializer<SchemaContractV2> = structDeserializer({
    init: optional(deserialSchemaFunctionV2),
    receive: mapDeserializer(
        'U32',
        stringDeserializer('U32'),
        deserialSchemaFunctionV2
    ),
});

const deserialContractV3: Deserializer<SchemaContractV3> = structDeserializer({
    init: optional(deserialSchemaFunctionV2),
    receive: mapDeserializer(
        'U32',
        stringDeserializer('U32'),
        deserialSchemaFunctionV2
    ),
    event: optional(deserialSchemaType),
});

const deserializeSchemaModuleV0: Deserializer<SchemaModuleV0> =
    structDeserializer({
        contracts: mapDeserializer(
            'U32',
            stringDeserializer('U32'),
            deserialContractV0
        ),
    });

const deserializeSchemaModuleV1: Deserializer<SchemaModuleV1> =
    structDeserializer({
        contracts: mapDeserializer(
            'U32',
            stringDeserializer('U32'),
            deserialContractV1
        ),
    });

const deserializeSchemaModuleV2: Deserializer<SchemaModuleV2> =
    structDeserializer({
        contracts: mapDeserializer(
            'U32',
            stringDeserializer('U32'),
            deserialContractV2
        ),
    });

const deserializeSchemaModuleV3: Deserializer<SchemaModuleV3> =
    structDeserializer({
        contracts: mapDeserializer(
            'U32',
            stringDeserializer('U32'),
            deserialContractV3
        ),
    });

function deserialFields(cursor: Cursor): SchemaFields {
    const tag = cursor.readUInt8();
    switch (tag) {
        case 0:
            return {
                type: 'Named',
                fields: listDeserializer('U32', deserialNamedField)(cursor),
            };
        case 1:
            return {
                type: 'Unnamed',
                fields: listDeserializer('U32', deserialSchemaType)(cursor),
            };
        case 2:
            return { type: 'None' };
        default:
            throw new Error(
                'Deserialization failed: Unexpected tag for Fields: ' + tag
            );
    }
}
const deserialNamedField: Deserializer<SchemaNamedField> = structDeserializer({
    name: stringDeserializer('U32'),
    field: deserialSchemaType,
});

const deserialEnumVariant: Deserializer<SchemaEnumVariant> = structDeserializer(
    {
        name: stringDeserializer('U32'),
        fields: deserialFields,
    }
);
