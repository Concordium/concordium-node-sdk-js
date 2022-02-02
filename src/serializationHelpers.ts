import { Buffer } from 'buffer/';
import { VerifyKey } from '.';
import { ParameterType, ContractAddress } from './types';
import { AccountAddress } from './types/accountAddress';
import { GtuAmount } from '../src/types/gtuAmount';
import {
    ArrayType,
    FieldsTag,
    Type,
    StructType,
    NamedFields,
    UnNamedFields,
    ListType,
    PairType,
    MapType,
    EnumType,
    SizeLength,
    Fields,
} from './deserializeSchema';
const MAX_UINT_64 = 2n ** 64n - 1n; // 2^64 - 1
import { DataBlob } from './types/DataBlob';

export function serializeMap<K extends string | number | symbol, T>(
    map: Record<K, T>,
    encodeSize: (size: number) => Buffer,
    encodeKey: (k: string) => Buffer,
    encodeValue: (t: T) => Buffer
): Buffer {
    const keys = Object.keys(map);
    const buffers = [encodeSize(keys.length)];
    keys.forEach((key) => {
        buffers.push(encodeKey(key));
        buffers.push(encodeValue(map[key as K]));
    });
    return Buffer.concat(buffers);
}

export function serializeList<T>(
    list: T[],
    putSize: (size: number) => Buffer,
    putMember: (t: T) => Buffer
): Buffer {
    const buffers = [putSize(list.length)];
    list.forEach((member: T) => {
        buffers.push(putMember(member));
    });
    return Buffer.concat(buffers);
}

/**
 * Encodes a 128 bit signed integer to a Buffer using big endian.
 * @param value a 128 bit integer
 * @returns big endian serialization of the input
 */
export function encodeInt128(value: bigint): Buffer {
    if (value > -18446744073709551616n || value < 18446744073709551615n) {
        throw new Error(
            'The input has to be a 128 bit signed integer but it was: ' + value
        );
    }
    const arr = new ArrayBuffer(32);
    const view = new DataView(arr);
    const byteOffset = 4;
    const res = splitUInt128toUInt64(value);
    view.setBigInt64(byteOffset, res.left);
    view.setBigInt64(byteOffset + 8, res.right);
    return Buffer.from(new Uint8Array(arr));
}

/**
 * Encodes a 128 bit unsigned integer to a Buffer using big endian.
 * @param value a 128 bit integer
 * @returns big endian serialization of the input
 */
export function encodeWord128(value: bigint): Buffer {
    if (value > 170141183460469231731687303715884105728n || value < 0n) {
        throw new Error(
            'The input has to be a 128 bit unsigned integer but it was: ' +
                value
        );
    }
    const arr = new ArrayBuffer(32);
    const view = new DataView(arr);
    const byteOffset = 4;
    const res = splitUInt128toUInt64(value);
    view.setBigUint64(byteOffset, res.left);
    view.setBigUint64(byteOffset + 8, res.right);
    return Buffer.from(new Uint8Array(arr));
}

/**
 * Encodes a 64 bit signed integer to a Buffer using big endian.
 * @param value a 64 bit integer
 * @returns big endian serialization of the input
 */
export function encodeInt64(value: bigint): Buffer {
    if (value > 4294967295n || value < -4294967296n) {
        throw new Error(
            'The input has to be a 64 bit signed integer but it was: ' + value
        );
    }
    const arr = new ArrayBuffer(8);
    const view = new DataView(arr);
    view.setBigInt64(0, value, false);
    return Buffer.from(new Uint8Array(arr));
}

/**
 * Encodes a boolean to a Buffer using big endian.
 * @param value a boolean value
 * @returns boolean serialization of the input
 */
export function encodeBool(value: boolean): Buffer {
    const result = value === true ? 1 : 0;
    const arr = new ArrayBuffer(1);
    const view = new DataView(arr);
    view.setInt8(0, result);
    return Buffer.from(new Int8Array(arr));
}

/**
 * Encodes a 64 bit unsigned integer to a Buffer using big endian.
 * @param value a 64 bit integer
 * @returns big endian serialization of the input
 */
export function encodeWord64(value: bigint): Buffer {
    if (value > 9223372036854775807n || value < 0n) {
        throw new Error(
            'The input has to be a 64 bit unsigned integer but it was: ' + value
        );
    }
    const arr = new ArrayBuffer(8);
    const view = new DataView(arr);
    view.setBigUint64(0, value, false);
    return Buffer.from(new Uint8Array(arr));
}

/**
 * Encodes a 32 bit signed integer to a Buffer using big endian.
 * @param value a 32 bit integer
 * @returns big endian serialization of the input
 */
export function encodeInt32(value: number): Buffer {
    if (value > -2147483648 || value < 2147483647 || !Number.isInteger(value)) {
        throw new Error(
            'The input has to be a 32 bit signed integer but it was: ' + value
        );
    }
    const arr = new ArrayBuffer(4);
    const view = new DataView(arr);
    view.setInt32(0, value, false);
    return Buffer.from(new Int8Array(arr));
}

/**
 * Encodes a 32 bit unsigned integer to a Buffer using little endian.
 * @param value a 32 bit integer
 * @useLittleEndian a boolean value false to use big endian else little endian.
 * @returns big endian serialization of the input
 */
export function encodeWord32(value: number, useLittleEndian = false): Buffer {
    if (value > 4294967295 || value < 0 || !Number.isInteger(value)) {
        throw new Error(
            'The input has to be a 32 bit unsigned integer but it was: ' + value
        );
    }
    const arr = new ArrayBuffer(4);
    const view = new DataView(arr);
    view.setUint32(0, value, useLittleEndian);
    return Buffer.from(new Uint8Array(arr));
}

/**
 * Encodes a 16 bit signed integer to a Buffer using big endian.
 * @param value a 16 bit integer
 * @returns big endian serialization of the input
 */
export function encodeInt16(value: number): Buffer {
    if (value > -32768 || value < 32767 || !Number.isInteger(value)) {
        throw new Error(
            'The input has to be a 16 bit signed integer but it was: ' + value
        );
    }
    const arr = new ArrayBuffer(2);
    const view = new DataView(arr);
    view.setInt16(0, value, false);
    return Buffer.from(new Int8Array(arr));
}

/**
 * Encodes a 16 bit unsigned integer to a Buffer using big endian.
 * @param value a 16 bit integer
 * @returns big endian serialization of the input
 */
export function encodeWord16(value: number): Buffer {
    if (value > 65535 || value < 0 || !Number.isInteger(value)) {
        throw new Error(
            'The input has to be a 16 bit unsigned integer but it was: ' + value
        );
    }
    const arr = new ArrayBuffer(2);
    const view = new DataView(arr);
    view.setUint16(0, value, false);
    return Buffer.from(new Uint8Array(arr));
}

/**
 * Encodes a 8 bit signed integer to a Buffer using big endian.
 * @param value a 8 bit integer
 * @returns big endian serialization of the input
 */
export function encodeInt8(value: number): Buffer {
    if (value > 127 || value < -128 || !Number.isInteger(value)) {
        throw new Error(
            'The input has to be a 8 bit signed integer but it was: ' + value
        );
    }

    return Buffer.from(Buffer.of(value));
}

/**
 * Encodes a 8 bit unsigned integer to a Buffer using big endian.
 * @param value a 8 bit integer
 * @returns big endian serialization of the input
 */
export function encodeWord8(value: number): Buffer {
    if (value > 255 || value < 0 || !Number.isInteger(value)) {
        throw new Error(
            'The input has to be a 8 bit unsigned integer but it was: ' + value
        );
    }
    return Buffer.from(Buffer.of(value));
}

export function encodeWord8FromString(value: string): Buffer {
    return encodeWord8(Number(value));
}

/**
 * Encodes a Datablob.
 * @param data Datablob containing data bytes.
 * @returns Buffer containing the length of the data and the data bytes.
 */
export function encodeDataBlob(blob: DataBlob): Buffer {
    const length = encodeWord16(blob.data.length);
    return Buffer.concat([length, blob.data]);
}

/**
 * Packing a buffer along with its length in 64 bits
 * @param buffer
 * @returns Buffer containing the 64 bit length of buffer and buffer.
 */
export function packBufferWithWord64Length(buffer: Buffer): Buffer {
    const length = encodeWord64(BigInt(buffer.length));
    return Buffer.concat([length, buffer]);
}

/**
 * Packing a buffer along with its length in 32 bits
 * @param buffer
 * @useLittleEndian a boolean value false to use big endian else little endian.
 * @returns Buffer containing the 32 bit length of buffer and buffer.
 */
export function packBufferWithWord32Length(
    buffer: Buffer,
    useLittleEndian = false
): Buffer {
    const length = encodeWord32(buffer.length, useLittleEndian);
    return Buffer.concat([length, buffer]);
}

/**
 * Packing a buffer along the with offset of 16 bit length
 * @param buffer containing the buffer
 * @returns Buffer containing the length of the buffer of 16 bit and buffer.
 */
export function packBufferWithWord16Length(buffer: Buffer): Buffer {
    const length = encodeWord16(buffer.length);
    return Buffer.concat([length, buffer]);
}

/**
 * Convert string to byte array
 * @param utf-8 string
 * @returns Buffer
 */
export function encodeStringToByteArray(str: string): Buffer {
    const buffer = new Buffer(str, 'utf8');
    const length = encodeWord16(buffer.length);
    return Buffer.concat([length, buffer]);
}

enum SchemeId {
    Ed25519 = 0,
}

/**
 * Serializes a public key. The serialization includes the
 * scheme used for the key/
 * @param key the key to serialize
 * @returns the serialization of the key
 */
export function serializeVerifyKey(key: VerifyKey): Buffer {
    const scheme = key.schemeId as keyof typeof SchemeId;
    let schemeId;
    if (SchemeId[scheme] !== undefined) {
        schemeId = SchemeId[scheme];
    } else {
        throw new Error(`Unknown key type: ${scheme}`);
    }
    const keyBuffer = Buffer.from(key.verifyKey, 'hex');
    const serializedScheme = encodeWord8(schemeId);
    return Buffer.concat([serializedScheme, keyBuffer]);
}

/**
 * Serializes a year and month string.
 * @param yearMonth year and month formatted as "YYYYMM"
 * @returns the serialization of the year and month string
 */
export function serializeYearMonth(yearMonth: string): Buffer {
    const year = parseInt(yearMonth.substring(0, 4), 10);
    const month = parseInt(yearMonth.substring(4, 6), 10);
    const serializedYear = encodeWord16(year);
    const serializedMonth = encodeWord8(month);
    return Buffer.concat([serializedYear, serializedMonth]);
}

/**
 * @param bigint bigint value that need to be splitted
 * @returns two bigint values
 */
function splitUInt128toUInt64(bigint: bigint): {
    left: bigint;
    right: bigint;
} {
    return {
        left: (bigint & (MAX_UINT_64 << 64n)) >> 64n,
        right: bigint & MAX_UINT_64,
    };
}

/**
 * Serailize the parameters
 * @param paramSchema type of the init or update contract
 * @param userInput user input
 * @returns Buffer of parameters
 */
export function serializeParameters(
    paramSchema: Type | null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    userInput: any
): Buffer {
    const typeTag: ParameterType = paramSchema?.typeTag ?? ParameterType.Unit;
    switch (typeTag) {
        case ParameterType.U8:
            if (typeof userInput === 'number') {
                return encodeWord8(userInput as number);
            } else {
                throw new Error('Unsigned integer required');
            }
        case ParameterType.U16:
            if (typeof userInput === 'number') {
                return encodeWord16(userInput as number);
            } else {
                throw new Error('Unsigned integer required');
            }
        case ParameterType.U32:
            if (typeof userInput === 'number') {
                return encodeWord32(userInput as number);
            } else {
                throw new Error('Unsigned integer required');
            }
        case ParameterType.U64:
            if (typeof BigInt(userInput) === 'bigint') {
                return encodeWord64(BigInt(userInput));
            } else {
                throw new Error('Unsigned integer required');
            }
        case ParameterType.U128:
            if (typeof BigInt(userInput) === 'bigint') {
                return encodeWord128(BigInt(userInput));
            } else {
                throw new Error('Unsigned integer required');
            }
        case ParameterType.I8:
            if (typeof userInput === 'number') {
                return encodeInt8(userInput as number);
            } else {
                throw new Error('Signed integer required');
            }
        case ParameterType.I16:
            if (typeof userInput === 'number') {
                return encodeInt16(userInput as number);
            } else {
                throw new Error('Signed integer required');
            }
        case ParameterType.I32:
            if (typeof userInput === 'number') {
                return encodeInt32(userInput as number);
            } else {
                throw new Error('Signed integer required');
            }
        case ParameterType.I64:
            if (typeof BigInt(userInput) === 'bigint') {
                return encodeInt64(BigInt(userInput));
            } else {
                throw new Error('Signed integer required');
            }
        case ParameterType.I128:
            if (typeof BigInt(userInput) === 'bigint') {
                return encodeInt128(BigInt(userInput));
            } else {
                throw new Error('Signed integer required');
            }
        case ParameterType.Bool:
            if (typeof userInput === 'boolean') {
                return encodeBool(userInput as boolean);
            } else {
                throw new Error('Signed integer required');
            }
        case ParameterType.String:
            if (typeof userInput === 'string') {
                return packBufferWithWord32Length(
                    Buffer.from(userInput as string),
                    true
                );
            } else {
                throw new Error('String required');
            }
        case ParameterType.Array:
            return serializeArray(paramSchema as ArrayType, userInput);
        case ParameterType.Struct:
            return serializeStruct(paramSchema as StructType, userInput);
        case ParameterType.AccountAddress:
            return (userInput as AccountAddress).decodedAddress;
        case ParameterType.Amount:
            const GTUAmount = new GtuAmount(BigInt(userInput));
            return encodeWord64(GTUAmount.microGtuAmount);
        case ParameterType.Timestamp:
            if (typeof userInput === 'number') {
                return encodeWord128(BigInt(userInput));
            } else {
                throw new Error('Timestamp required in bigint format');
            }
        case ParameterType.Duration:
            if (typeof userInput === 'number') {
                return encodeWord128(BigInt(userInput));
            } else {
                throw new Error('Duration required in bigint format');
            }
        case ParameterType.ContractAddress:
            if (
                typeof (userInput as ContractAddress).index === 'number' &&
                typeof (userInput as ContractAddress).subindex === 'number'
            ) {
                const serializeIndex = encodeWord64(
                    (userInput as ContractAddress).index
                );
                const serializeSubIndex = encodeWord64(
                    (userInput as ContractAddress).subindex
                );
                return Buffer.concat([serializeIndex, serializeSubIndex]);
            } else {
                throw new Error('Invaild contract address format');
            }
        case ParameterType.Unit:
            return Buffer.from([]);
        case ParameterType.List:
        case ParameterType.Set:
            return serializeListOrSet(paramSchema as ListType, userInput);
        case ParameterType.ContractName:
        case ParameterType.ReceiveName:
            if (typeof userInput === 'string') {
                return Buffer.from(userInput as string);
            } else {
                throw new Error('Signed integer required');
            }
        case ParameterType.Pair:
            return serializePairType(paramSchema as PairType, userInput);
        case ParameterType.Map:
            return serializeMapType(paramSchema as MapType, userInput);
        case ParameterType.Enum:
            return serializeEnumType(paramSchema as EnumType, userInput);
        default:
            throw new Error('Type is not supported currently.');
    }
}

/**
 * Serialize array of parameters to Buffer
 * @param size array size
 * @param arrayType type of array
 * @param userArrayValues user input
 * @returns serialize array of parameters to Buffer
 */
export function serializeArray(
    arraySchema: ArrayType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    userArrayValues: any
): Buffer {
    const bufferArray: Buffer[] = [];
    if (!userArrayValues) {
        throw new Error('Invalid input for type array');
    }
    if (userArrayValues && arraySchema.size === userArrayValues.length) {
        for (let i = 0; i < arraySchema.size; i++) {
            const userValue = userArrayValues[i];
            bufferArray.push(serializeParameters(arraySchema.of, userValue));
        }
    } else {
        throw new Error('Array size and user input array not matched');
    }
    return Buffer.concat(bufferArray);
}

/**
 * Serialize struct of parameters to Buffer
 * @param structType type of struct
 * @param structData user input
 * @returns serialize struct of parameters to Buffer
 */
export function serializeStruct(
    structType: StructType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    structData: any
): Buffer {
    if (!structData) {
        throw new Error('Invalid input for type struct');
    }
    return serializeSchemaFields(structType.fields, structData);
}

/**
 * Serialize the list type parameters to Buffer
 * @param listType type of list
 * @param listData user input
 * @returns serialize list parameters to Buffer
 */
export function serializeListOrSet(
    listType: ListType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    listData: any
): Buffer {
    if (!listData) {
        throw new Error('Invalid input for type list or set');
    }
    const bufferArray: Buffer[] = [];
    const length = listData.length;
    const listLengthBuffer = serializeLength(length, listType.sizeLength);
    bufferArray.push(listLengthBuffer);
    for (let i = 0; i < listData.length; i++) {
        const userValue = listData[i];
        bufferArray.push(serializeParameters(listType.of, userValue));
    }
    return Buffer.concat(bufferArray);
}

/**
 * Serialize the pair type parameters to Buffer
 * @param pairType type of list parameters
 * @param pairData user input
 * @returns serialize pair parameters to Buffer
 */
export function serializePairType(
    pairType: PairType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    pairData: any
): Buffer {
    if (!pairData) {
        throw new Error('Invalid input for type pair');
    }
    const bufferArray: Buffer[] = [];
    const keys = Object.keys(pairData);
    if (keys.length === 2) {
        const leftValue = pairData[keys[0]];
        const rightValue = pairData[keys[1]];
        bufferArray.push(serializeParameters(pairType.ofLeft, leftValue));
        bufferArray.push(serializeParameters(pairType.ofRight, rightValue));
        return Buffer.concat(bufferArray);
    } else {
        throw new Error('Only pairs of two are supported');
    }
}

/**
 * Serialize the map type parameters to Buffer
 * @param mapType type of map parameters
 * @param mapData user input
 * @returns serialize map parameters to Buffer
 */
export function serializeMapType(
    mapType: MapType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    mapData: any
): Buffer {
    if (!mapData) {
        throw new Error('Invalid input for type map');
    }
    const bufferArray: Buffer[] = [];
    const length = mapData.length;
    const pairLengthBuffer = serializeLength(length, mapType.sizeLength);
    bufferArray.push(pairLengthBuffer);
    if (mapType.sizeLength === mapData.length) {
        for (let i = 0; i < mapType.sizeLength; i++) {
            const itemValue = mapData[i];
            const keys = Object.keys(itemValue);
            if (keys.length === 2) {
                const leftValue = itemValue[keys[0]];
                const rightValue = itemValue[keys[1]];
                bufferArray.push(
                    serializeParameters(mapType.ofKeys, leftValue)
                );
                bufferArray.push(
                    serializeParameters(mapType.ofValues, rightValue)
                );
            } else {
                throw new Error('Expected key-value pair');
            }
        }
    } else {
        throw new Error('Map size and user input map not matched');
    }

    return Buffer.concat(bufferArray);
}

/**
 * Serialize the enum type parameters to Buffer
 * @param enumType type of enum parameters
 * @param enumData user input
 * @returns serialize enum parameters to Buffer
 */
export function serializeEnumType(
    enumType: EnumType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    enumData: any
): Buffer {
    if (!enumData) {
        throw new Error('Invalid input for type enum');
    }
    const bufferEnum: Buffer[] = [];
    const enumFields = enumType.variants;
    //get the schema field from the user enum data
    let variantString: string;
    let variantField: Fields;
    for (let i = 0; i < enumFields.length; i++) {
        const variant = enumFields[i];
        variantString = variant[0];
        variantField = variant[1];
        if (variantField.fieldsTag === FieldsTag.None) {
            if (enumData === variantString) {
                if (enumFields.length <= 256) {
                    bufferEnum.push(encodeWord8(i + 1));
                    return Buffer.concat(bufferEnum);
                } else if (enumFields.length <= 256 * 256) {
                    bufferEnum.push(encodeWord16(i + 1));
                    return Buffer.concat(bufferEnum);
                } else {
                    throw new Error(
                        'Enums with more than 65536 variants are not supported.'
                    );
                }
            }
        } else {
            if (Object.keys(enumData)[0] === variantString) {
                const enumDataValue = enumData[Object.keys(enumData)[0]];
                if (enumFields.length <= 256) {
                    bufferEnum.push(encodeWord8(i + 1));
                    bufferEnum.push(
                        serializeSchemaFields(variantField, enumDataValue)
                    );
                    return Buffer.concat(bufferEnum);
                } else if (enumFields.length <= 256 * 256) {
                    bufferEnum.push(encodeWord16(i + 1));
                    bufferEnum.push(
                        serializeSchemaFields(variantField, enumDataValue)
                    );
                    return Buffer.concat(bufferEnum);
                } else {
                    throw new Error(
                        'Enums with more than 65536 variants are not supported.'
                    );
                }
            }
        }
    }
    throw new Error('Invalid enum input');
}

/**
 *
 * @param fields Field type of the schema
 * @param userData  user data
 * @returns
 */
export function serializeSchemaFields(
    fields: Fields,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    userData: any
): Buffer {
    const buffer: Buffer[] = [];
    const keys = Object.keys(userData);
    switch (fields.fieldsTag) {
        case FieldsTag.Named:
            const namedFields = fields as NamedFields;
            if (keys.length === namedFields.contents.length) {
                for (let i = 0; i < namedFields.contents.length; i++) {
                    const fieldInfo = namedFields.contents[i];
                    const userJsonProperty = fieldInfo[0];
                    const userValue = userData[userJsonProperty];
                    buffer.push(serializeParameters(fieldInfo[1], userValue));
                }
                return Buffer.concat(buffer);
            } else {
                throw new Error(
                    `Expected ${namedFields.contents.length} named fields`
                );
            }
        case FieldsTag.Unnamed:
            const unNamedFields = fields as UnNamedFields;
            if (userData.length === unNamedFields.contents.length) {
                for (let i = 0; i < unNamedFields.contents.length; i++) {
                    const fieldInfo = unNamedFields.contents[i];
                    const userValue = userData[i];
                    buffer.push(serializeParameters(fieldInfo, userValue));
                }
                return Buffer.concat(buffer);
            } else {
                throw new Error(
                    `Expected ${unNamedFields.contents.length} unnamed fields`
                );
            }
        case FieldsTag.None:
        default:
            return Buffer.from(buffer);
    }
}

/**
 *
 * @param length length of the values provided by the user
 * @param sizeLength sizeLength represented as an unsigned integer
 * @returns
 */

export function serializeLength(
    length: number,
    sizeLength: SizeLength
): Buffer {
    switch (sizeLength) {
        case SizeLength.U8:
            return encodeWord8(length);
        case SizeLength.U16:
            return encodeWord16(length);
        case SizeLength.U32:
            return encodeWord32(length);
        case SizeLength.U64:
            return encodeWord64(BigInt(length));
        default:
            return Buffer.from([]);
    }
}
