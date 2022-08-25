import { PassThrough, Readable } from 'stream';
import { ParameterType, SchemaVersion } from './types';
import { Buffer } from 'buffer/';
/**
 * Function that reags an output of specified type from {@link Readable}.
 *
 * @typeParam T - output type
 */
export interface Deserial<T> {
    (source: Readable): T;
}

/**
 * schema (V1) for a module, which is a
 * map of contract names to contract schemas.
 */
export type ModuleV1 = Record<string, ContractV1>;
/**
 * schema (V2) for a module, which is a
 * map of contract names to contract schemas.
 */
export type ModuleV2 = Record<string, ContractV2>;
/**
 * schema (V3) for a module, which is a
 * map of contract names to contract schemas.
 */
export type ModuleV3 = Record<string, ContractV3>;

/**
 * Versioned schema for a module.
 * Note that the version is the schema version and not the module version.
 */
export type VersionedModule =
    | {
          v: SchemaVersion.V1;
          value: ModuleV1;
      }
    | {
          v: SchemaVersion.V2;
          value: ModuleV2;
      }
    | {
          v: SchemaVersion.V3;
          value: ModuleV3;
      };

/**
 * Reads the schema (V1) for a contract module from the given {@link Readable}.
 *
 * @param source input stream
 * @returns schema (V1) of a module (contract map)
 */
export function deserialModuleV1(source: Readable): ModuleV1 {
    return deserialMapFn<string, ContractV1>(
        deserialString,
        deserialContractV1
    )(source);
}

/**
 *  Reads the schema (V2) for a contract module from the given{@link Readable}.
 *
 * @param source input stream
 * @returns schema (V2) of a module (contract map)
 */
export function deserialModuleV2(source: Readable): ModuleV2 {
    return deserialMapFn<string, ContractV2>(
        deserialString,
        deserialContractV2
    )(source);
}

export function deserialModuleV3(source: Readable): ModuleV3 {
    return deserialMapFn<string, ContractV3>(
        deserialString,
        deserialContractV3
    )(source);
}

/**
 *  Magic prefix for versioned schemas, used to distinguish between a versioned
 *  schema and the older format without versioning as part of the schema.
 *
 *  The constant is corresponding to two maxed-out bytes, interpreted as a 16-bit unsigned integer.
 */
export const VERSIONED_SCHEMA_PREFIX = 65535;

/**
 *  Reads a versioned schema for a contract module from the given{@link Readable}.
 *
 * @param source input stream
 * @returns schema (Versioned) of a module (contract map)
 */
export function deserialVersionedModule(source: Readable): VersionedModule {
    const prefix = deserialUint16(source);
    if (prefix != VERSIONED_SCHEMA_PREFIX) {
        throw new Error(
            'Versioned schema module must be prefixed with two maxed-out bytes'
        );
    }
    const version = deserialUint8(source);
    switch (version) {
        case SchemaVersion.V1:
            return {
                v: version,
                value: deserialModuleV1(source),
            };
        case SchemaVersion.V2:
            return {
                v: version,
                value: deserialModuleV2(source),
            };
        case SchemaVersion.V3:
            return {
                v: version,
                value: deserialModuleV3(source),
            };
        default:
            throw new Error('Unsupported schema version');
    }
}

/**
 *   schema (V1) for a contract.
 */
export type ContractV1 = {
    /** Optional schema for the contract state. */
    state: Type | null;
    /** Optional schema for init function parameters. */
    init: Type | null;
    /** Map of receive function names to schemas for their respective parameters. */
    receive: Record<string, Type>;
};

/**
 *  schema (V2) for a contract.
 */
export type ContractV2 = {
    /** Optional schema for init function. */
    init: ContractFunction | null;
    /** Map of receive function names to schemas for their respective parameters and return values. */
    receive: Record<string, ContractFunction>;
};

/**
 *  schema (V3) for a contract.
 */
export type ContractV3 = {
    /** Optional schema for init function. */
    init: ContractFunctionV2 | null;
    /** Map of receive function names to schemas for their respective parameters and return values. */
    receive: Record<string, ContractFunctionV2>;
};

/**
 * Reads {@link ContractV1} from the given {@link Readable}.
 *
 * @param source input stream
 * @returns schema (V1) for a contract.
 */
export function deserialContractV1(source: Readable): ContractV1 {
    return {
        state: deserialOptionFn<Type>(deserialType)(source),
        init: deserialOptionFn<Type>(deserialType)(source),
        receive: deserialMapFn<string, Type>(
            deserialString,
            deserialType
        )(source),
    };
}

/**
 * Reads {@link ContractV2} from the given {@link Readable}.
 *
 * @param source input stream
 * @returns schema (V2) for a contract.
 */
export function deserialContractV2(source: Readable): ContractV2 {
    return {
        init: deserialOptionFn<ContractFunction>(deserialFunction)(source),
        receive: deserialMapFn<string, ContractFunction>(
            deserialString,
            deserialFunction
        )(source),
    };
}

/**
 * Reads {@link ContractV3} from the given {@link Readable}.
 *
 * @param source input stream
 * @returns schema (V3) for a contract.
 */
export function deserialContractV3(source: Readable): ContractV3 {
    return {
        init: deserialOptionFn<ContractFunctionV2>(deserialFunctionV2)(source),
        receive: deserialMapFn<string, ContractFunctionV2>(
            deserialString,
            deserialFunctionV2
        )(source),
    };
}

/**
 * Size length of a {@link Type}, represented as an unsigned integer.
 */
export enum SizeLength {
    /** Takes 1 byte and represents a possible size range of 0..255. */
    U8 = 0,
    /** Takes 2 bytes and represents a possible size range of 0..65535. */
    U16,
    /** Takes 4 bytes and represents a possible size range of 0..4294967295. */
    U32,
    /** Takes 8 bytes and represents a possible size range of 0..2^64-1. */
    U64,
}

/**
 * Contract schema type.
 */
export type Type =
    | {
          typeTag:
              | ParameterType.Unit
              | ParameterType.Bool
              | ParameterType.U8
              | ParameterType.U16
              | ParameterType.U32
              | ParameterType.U64
              | ParameterType.U128
              | ParameterType.I8
              | ParameterType.I16
              | ParameterType.I32
              | ParameterType.I64
              | ParameterType.I128
              | ParameterType.Amount
              | ParameterType.AccountAddress
              | ParameterType.ContractAddress
              | ParameterType.Timestamp
              | ParameterType.Duration;
      }
    | PairType
    | ListType
    | MapType
    | ArrayType
    | StructType
    | EnumType
    | StringType
    | ULeb128Type
    | ILeb128Type
    | ByteListType
    | ByteArrayType;

export type ContractFunction = {
    parameter?: Type;
    returnValue?: Type;
};

export type ContractFunctionV2 = {
    parameter?: Type;
    returnValue?: Type;
    error?: Type;
};

export type StringType = {
    typeTag:
        | ParameterType.String
        | ParameterType.ContractName
        | ParameterType.ReceiveName;
    sizeLength: SizeLength;
};
/**
 * Array type.
 */
export type ArrayType = {
    typeTag: ParameterType.Array;
    size: number;
    of: Type;
};

/**
 * Struct type.
 */
export type StructType = {
    typeTag: ParameterType.Struct;
    fields: Fields;
};

/**
 * Enum type.
 */
export type EnumType = {
    typeTag: ParameterType.Enum;
    variants: [string, Fields][];
};

/**
 * Map type.
 */
export type MapType = {
    typeTag: ParameterType.Map;
    sizeLength: SizeLength;
    ofKeys: Type;
    ofValues: Type;
};

/**
 * List type.
 */
export type ListType = {
    typeTag: ParameterType.List | ParameterType.Set;
    sizeLength: SizeLength;
    of: Type;
};

/**
 * Pair type.
 */
export type PairType = {
    typeTag: ParameterType.Pair;
    ofLeft: Type;
    ofRight: Type;
};

/**
 *  LEB128 for unsigned integers type.
 */
export type ULeb128Type = {
    typeTag: ParameterType.ULeb128;
    constraint: number;
};

/**
 *  LEB128 for signed integers type.
 */
export type ILeb128Type = {
    typeTag: ParameterType.ILeb128;
    constraint: number;
};

/**
 *  List of bytes type.
 */
export type ByteListType = {
    typeTag: ParameterType.ByteList;
    sizeLength: SizeLength;
};

/**
 *  Array of bytes type.
 */
export type ByteArrayType = {
    typeTag: ParameterType.ByteArray;
    size: number;
};

/**
 * The first byte of the function denotes whether the parameters, return value, or both are typed.
 */
enum FunctionTag {
    Parameter = 0,
    ReturnValue = 1,
    Both = 2,
}

/**
 * Reads {@link ContractFunction} from the given {@link Readable}.
 *
 * @param source input stream
 * @returns Function schema type
 */
export function deserialFunction(source: Readable): ContractFunction {
    const tag: FunctionTag = deserialUint8(source);
    switch (tag) {
        case FunctionTag.Parameter:
            return {
                parameter: deserialType(source),
            };
        case FunctionTag.ReturnValue:
            return {
                returnValue: deserialType(source),
            };
        case FunctionTag.Both:
            return {
                parameter: deserialType(source),
                returnValue: deserialType(source),
            };
        default:
            throw new Error('Incorrect tag for function');
    }
}

/**
 * The first byte of the function denotes whether the parameters, return value, errors or some combination of those, are typed.
 */
enum FunctionTagV2 {
    Param = 0,
    /// Rv is short for Return value.
    RV = 1,
    ParamRv = 2,
    Error = 3,
    ParamError = 4,
    RvError = 5,
    ParamRvError = 6,
}

/**
 * Reads {@link ContractFunctionV2} from the given {@link Readable}.
 *
 * @param source input stream
 * @returns Function schema type
 */
export function deserialFunctionV2(source: Readable): ContractFunctionV2 {
    const tag: FunctionTagV2 = deserialUint8(source);
    switch (tag) {
        case FunctionTagV2.Param:
            return {
                parameter: deserialType(source),
            };
        case FunctionTagV2.RV:
            return {
                returnValue: deserialType(source),
            };
        case FunctionTagV2.ParamRv:
            return {
                parameter: deserialType(source),
                returnValue: deserialType(source),
            };
        case FunctionTagV2.Error:
            return {
                error: deserialType(source),
            };
        case FunctionTagV2.ParamError:
            return {
                parameter: deserialType(source),
                error: deserialType(source),
            };
        case FunctionTagV2.RvError:
            return {
                returnValue: deserialType(source),
                error: deserialType(source),
            };
        case FunctionTagV2.ParamRvError:
            return {
                parameter: deserialType(source),
                returnValue: deserialType(source),
                error: deserialType(source),
            };
        default:
            throw new Error('Incorrect tag for function');
    }
}

/**
 * Reads {@link Type} from the given {@link Readable}.
 *
 * @param source input stream
 * @returns contract schema type
 */
export function deserialType(source: Readable): Type {
    const tag = deserialUint8(source);
    switch (tag) {
        case ParameterType.Unit:
        case ParameterType.Bool:
        case ParameterType.U8:
        case ParameterType.U16:
        case ParameterType.U32:
        case ParameterType.U64:
        case ParameterType.U128:
        case ParameterType.I8:
        case ParameterType.I16:
        case ParameterType.I32:
        case ParameterType.I64:
        case ParameterType.I128:
        case ParameterType.Amount:
        case ParameterType.AccountAddress:
        case ParameterType.ContractAddress:
        case ParameterType.Timestamp:
        case ParameterType.Duration:
            return { typeTag: tag };
        case ParameterType.Pair:
            return {
                typeTag: tag,
                ofLeft: deserialType(source),
                ofRight: deserialType(source),
            };
        case ParameterType.List:
        case ParameterType.Set:
            return {
                typeTag: tag,
                sizeLength: deserialUint8(source),
                of: deserialType(source),
            };
        case ParameterType.Map:
            return {
                typeTag: tag,
                sizeLength: deserialUint8(source),
                ofKeys: deserialType(source),
                ofValues: deserialType(source),
            };
        case ParameterType.Array:
            return {
                typeTag: tag,
                size: deserialUint32(source),
                of: deserialType(source),
            };
        case ParameterType.Struct:
            return {
                typeTag: tag,
                fields: deserialFields(source),
            };
        case ParameterType.Enum:
            return {
                typeTag: tag,
                variants: deserialArrayFn<[string, Fields]>(
                    deserialTupleFn<string, Fields>(
                        deserialString,
                        deserialFields
                    )
                )(source),
            };
        case ParameterType.String:
        case ParameterType.ContractName:
        case ParameterType.ReceiveName:
            return {
                typeTag: tag,
                sizeLength: deserialUint8(source),
            };
        case ParameterType.ULeb128:
            return {
                typeTag: tag,
                constraint: deserialUint32(source),
            };
        case ParameterType.ILeb128:
            return {
                typeTag: tag,
                constraint: deserialUint32(source),
            };
        case ParameterType.ByteList:
            return {
                typeTag: tag,
                sizeLength: deserialUint8(source),
            };
        case ParameterType.ByteArray:
            return {
                typeTag: tag,
                size: deserialUint32(source),
            };
        default:
            throw new Error(`unsupported type tag: ${tag}`);
    }
}

/**
 * {@link Fields} tag.
 */
export enum FieldsTag {
    /**
     * Represents named fields such as in
     * `struct RGB { r: u8, g: u8, b: u8 }`.
     */
    Named = 0,
    /**
     * Represents unnamed (anonymous) struct fields such as in
     * `struct Point { u32, u32 }`.
     */
    Unnamed,
    /**
     * Represents lack of fields in a struct or an enum, as is the case
     * with `Cat` in `enum Animal { Cat, Dog, Human }`.
     */
    None,
}

/**
 * Rust flavored struct/enum fields.
 */
export type Fields =
    | NamedFields
    | UnnamedFields
    | {
          fieldsTag: FieldsTag.None;
      };
/**
 * Named fields if the type is Struct/enum
 */
export type NamedFields = {
    fieldsTag: FieldsTag.Named;
    contents: [string, Type][];
};

/**
 * Unnamed fields if the type is Struct/enum
 */
export type UnnamedFields = {
    fieldsTag: FieldsTag.Unnamed;
    contents: Type[];
};

/**
 * Reads {@link Fields} from the given {@link Readable}.
 *
 * @param source input stream
 * @returns struct or enum variant fields
 */
export function deserialFields(source: Readable): Fields {
    const tag = deserialUint8(source);
    switch (tag) {
        case FieldsTag.Named:
            return {
                fieldsTag: tag,
                contents: deserialArrayFn<[string, Type]>(
                    deserialTupleFn<string, Type>(deserialString, deserialType)
                )(source),
            };
        case FieldsTag.Unnamed:
            return {
                fieldsTag: tag,
                contents: deserialArrayFn<Type>(deserialType)(source),
            };
        case FieldsTag.None:
            return { fieldsTag: tag };
        default:
            throw new Error(`unsupported fields tag: ${tag}`);
    }
}

/**
 * Reads a string from the given {@link Readable}.
 *
 * @param source input stream
 * @returns string
 */
export function deserialString(source: Readable): string {
    const bytes = deserialArrayFn<number>(deserialUint8)(source);

    return Buffer.from(bytes).toString('utf8');
}

/**
 * Takes a {@link Deserial} function of the given type and returns another
 * {@link Deserial} function that can read an array of the same type.
 *
 * @typeParam T - {@link Deserial} output type
 * @param deserial function that takes {@link Readable} and returns `T`
 * @returns function that takes {@link Readable} and returns an array of `T`
 */
export function deserialArrayFn<T>(deserial: Deserial<T>): Deserial<T[]> {
    return function (source: Readable): T[] {
        const len = deserialUint32(source);
        const arr: T[] = [];

        for (let i = 0; i < len; i++) {
            arr.push(deserial(source));
        }

        return arr;
    };
}

/**
 * Takes two {@link Deserial} functions of two given types: one for keys
 * and the other one for values. Returns another {@link Deserial} function
 * that can read a map with keys and values of corresponding types.
 *
 * @typeParam K - {@link Deserial} output type for keys
 * @typeParam V - {@link Deserial} output type for values
 * @param deserialKey function that takes {@link Readable} and returns `K`
 * @param deserialValue function that takes {@link Readable} and returns `V`
 * @returns function that takes {@link Readable} and returns a map from `K` to `V`
 */
export function deserialMapFn<K extends string, V>(
    deserialKey: Deserial<K>,
    deserialValue: Deserial<V>
): Deserial<Record<K, V>> {
    return function (source: Readable): Record<K, V> {
        const len = deserialUint32(source);
        const obj: Record<string, V> = {};

        for (let i = 0; i < len; i++) {
            const k = deserialKey(source);
            const v = deserialValue(source);

            obj[k] = v;
        }

        return obj;
    };
}

/**
 * Option tag.
 *
 * Options are equivalent to nullable types. They can be either
 * {@link OptionTag.None}, which means that the value is `null`, or
 * {@link OptionTag.Some}, which means that a non-`null` value is present.
 */
export enum OptionTag {
    /** Means that there's no value. */
    None = 0,
    /** Means that there's a value. */
    Some,
}

/**
 * Takes a {@link Deserial} function of the given type and returns another
 * {@link Deserial} function that can read an option wrapped (nullable)
 * version of the same type.
 *
 * @typeParam T - {@link Deserial} output type
 * @param deserial function that takes {@link Readable} and returns `T`
 * @returns function that takes {@link Readable} and returns `T` or `null`
 */
export function deserialOptionFn<T>(deserial: Deserial<T>): Deserial<T | null> {
    return function (source: Readable): T | null {
        const tag = deserialUint8(source);
        switch (tag) {
            case OptionTag.None:
                return null;
            case OptionTag.Some:
                return deserial(source);
            default:
                throw new Error(`unsupported option tag: ${tag}`);
        }
    };
}

/**
 * Takes two {@link Deserial} functions of two given types: one for left
 * values and the other one for right values. Returns another {@link Deserial}
 * function that can read a tuple with left and right values of corresponding
 * types.
 *
 * @typeParam L - {@link Deserial} output type for left values
 * @typeParam R - {@link Deserial} output type for right values
 * @param deserialLeft function that takes {@link Readable} and returns `L`
 * @param deserialRight function that takes {@link Readable} and returns `R`
 * @returns function that takes {@link Readable} and returns a tuple of `L` and `R`
 */
export function deserialTupleFn<L, R>(
    deserialLeft: Deserial<L>,
    deserialRight: Deserial<R>
): Deserial<[L, R]> {
    return function (source: Readable): [L, R] {
        const left = deserialLeft(source);
        const right = deserialRight(source);

        return [left, right];
    };
}

/**
 * Reads an unsigned 8-bit integer from the given {@link Readable}.
 *
 * @param source input stream
 * @returns number from 0 to 255
 */
export function deserialUint8(source: Readable): number {
    return source.read(1).readUInt8(0);
}

/**
 * Reads an unsigned 32-bit integer from the given {@link Readable}.
 *
 * @param source input stream
 * @returns number from 0 to 4294967295
 */
function deserialUint32(source: Readable): number {
    return source.read(4).readUInt32LE(0);
}

/**
 * Reads an unsigned 16-bit integer from the given {@link Readable}.
 *
 * @param source input stream
 * @returns number from 0 to 65535
 */
function deserialUint16(source: Readable): number {
    return source.read(2).readUInt16LE(0);
}

/**
 * @param buffer Schema buffer
 * @param moduleVersion the version of the module (only needed for older versions of the schema).
 * @returns deserialized module of wasm file
 */
export function deserialModuleFromBuffer(
    buffer: Buffer,
    schemaVersion?: SchemaVersion
): VersionedModule {
    const bufferStream = new PassThrough();
    bufferStream.end(buffer);
    if (buffer.readUInt16LE(0) === VERSIONED_SCHEMA_PREFIX) {
        return deserialVersionedModule(bufferStream);
    }
    if (schemaVersion === undefined) {
        throw new Error(
            'Supply a schema version to deserialize an unversioned schema'
        );
    }
    switch (schemaVersion) {
        case SchemaVersion.V1:
            return {
                v: SchemaVersion.V1,
                value: deserialModuleV1(bufferStream),
            };
        case SchemaVersion.V2:
            return {
                v: SchemaVersion.V2,
                value: deserialModuleV2(bufferStream),
            };
        default:
            throw new Error('Unsupported module version');
    }
}

export function getParameterType(
    schema: ContractFunction | Type | null,
    schemaVersion: SchemaVersion
): Type | null {
    if (!schema) {
        return null;
    }
    switch (schemaVersion) {
        case SchemaVersion.V1:
            return schema as Type;
        case SchemaVersion.V2:
            return (schema as ContractFunction).parameter || null;
        default:
            throw new Error('Unsupported module version');
    }
}
