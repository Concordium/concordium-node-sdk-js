import { Buffer } from 'buffer/';
import { VerifyKey } from '.';
import { ParameterType } from './types';
import { AccountAddress } from './types/accountAddress';
import { GtuAmount } from '../src/types/gtuAmount';
import {
    ArrayType,
    FieldsTag,
    Type,
    StructType,
    NamedFields,
    UnnamedFields,
    ListType,
    PairType,
    MapType,
    EnumType,
    SizeLength,
    Fields,
    StringType,
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
 * @returns little endian serialization of the input
 */
export function encodeInt128LE(value: bigint): Buffer {
    if (
        value < -170141183460469231731687303715884105728n ||
        value > 170141183460469231731687303715884105727n
    ) {
        throw new Error(
            'The input has to be a 128 bit signed integer but it was: ' + value
        );
    }
    const arr = new ArrayBuffer(16);
    const view = new DataView(arr);
    const byteOffset = 0;
    const res = splitUInt128toUInt64LE(value);
    view.setBigInt64(byteOffset, res.left, true);
    view.setBigInt64(byteOffset + 8, res.right, true);
    return Buffer.from(new Uint8Array(arr));
}

/**
 * Encodes a 128 bit unsigned integer to a Buffer using big endian.
 * @param value a 128 bit integer
 * @returns little endian serialization of the input
 */
export function encodeWord128LE(value: bigint): Buffer {
    if (value > 340282366920938463463374607431768211455n || value < 0n) {
        throw new Error(
            'The input has to be a 128 bit unsigned integer but it was: ' +
                value
        );
    }
    const arr = new ArrayBuffer(16);
    const view = new DataView(arr);
    const byteOffset = 0;
    const res = splitUInt128toUInt64LE(value);
    view.setBigUint64(byteOffset, res.left, true);
    view.setBigUint64(byteOffset + 8, res.right, true);
    return Buffer.from(new Uint8Array(arr));
}

/**
 * Encodes a 64 bit signed integer to a Buffer using big endian.
 * @param value a 64 bit integer
 * @param useLittleEndian a boolean value, if not given, the value is serialized in big endian.
 * @returns serialization of the input
 */
export function encodeInt64(value: bigint, useLittleEndian = false): Buffer {
    if (value > 9223372036854775807n || value < -9223372036854775808n) {
        throw new Error(
            'The input has to be a 64 bit signed integer but it was: ' + value
        );
    }
    const arr = new ArrayBuffer(8);
    const view = new DataView(arr);
    view.setBigInt64(0, value, useLittleEndian);
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
 * @param useLittleEndian a boolean value, if not given, the value is serialized in big endian.
 * @returns big endian serialization of the input
 */
export function encodeWord64(value: bigint, useLittleEndian = false): Buffer {
    if (value > 18446744073709551615n || value < 0n) {
        throw new Error(
            'The input has to be a 64 bit unsigned integer but it was: ' + value
        );
    }
    const arr = new ArrayBuffer(8);
    const view = new DataView(arr);
    view.setBigUint64(0, value, useLittleEndian);
    return Buffer.from(new Uint8Array(arr));
}

/**
 * Encodes a 32 bit signed integer to a Buffer using big endian.
 * @param value a 32 bit integer
 * @param useLittleEndian a boolean value, if not given, the value is serialized in big endian.
 * @returns big endian serialization of the input
 */
export function encodeInt32(value: number, useLittleEndian = false): Buffer {
    if (value < -2147483648 || value > 2147483647 || !Number.isInteger(value)) {
        throw new Error(
            'The input has to be a 32 bit signed integer but it was: ' + value
        );
    }
    const arr = new ArrayBuffer(4);
    const view = new DataView(arr);
    view.setInt32(0, value, useLittleEndian);
    return Buffer.from(new Int8Array(arr));
}

/**
 * Encodes a 32 bit unsigned integer to a Buffer.
 * @param value a 32 bit integer
 * @param useLittleEndian a boolean value, if not given, the value is serialized in big endian.
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
 * Encodes a 16 bit signed integer to a Buffer.
 * @param value a 16 bit integer
 * @param useLittleEndian a boolean value, if not given, the value is serialized in big endian.
 * @returns big endian serialization of the input
 */
export function encodeInt16(value: number, useLittleEndian = false): Buffer {
    if (value < -32768 || value > 32767 || !Number.isInteger(value)) {
        throw new Error(
            'The input has to be a 16 bit signed integer but it was: ' + value
        );
    }
    const arr = new ArrayBuffer(2);
    const view = new DataView(arr);
    view.setInt16(0, value, useLittleEndian);
    return Buffer.from(new Int8Array(arr));
}

/**
 * Encodes a 16 bit unsigned integer to a Buffer using big endian.
 * @param value a 16 bit integer
 * @param useLittleEndian a boolean value, if not given, the value is serialized in big endian.
 * @returns big endian serialization of the input
 */
export function encodeWord16(value: number, useLittleEndian = false): Buffer {
    if (value > 65535 || value < 0 || !Number.isInteger(value)) {
        throw new Error(
            'The input has to be a 16 bit unsigned integer but it was: ' + value
        );
    }
    const arr = new ArrayBuffer(2);
    const view = new DataView(arr);
    view.setUint16(0, value, useLittleEndian);
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
 * Encodes a boolean in a Buffer.
 * @param value a boolean
 * @returns serialization of the input
 */
export function encodeBoolean(value: boolean): Buffer {
    return Buffer.from(Buffer.of(value ? 1 : 0));
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
 * Packing a buffer along with its length in 32 bits
 * @param buffer
 * @param useLittleEndian a boolean value, if not given, the value is serialized in big endian.
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
 * @param bigint 128 bit bigint value that needs to be split
 * @returns two 64 bit bigint values left and right
 * where left is most signficant bits
 * where right is least signficant bits
 */
function splitUInt128toUInt64LE(bigint: bigint): {
    left: bigint;
    right: bigint;
} {
    return {
        right: (bigint & (MAX_UINT_64 << 64n)) >> 64n,
        left: bigint & MAX_UINT_64,
    };
}

/**
 * Serializes the userInput according to the given schema
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
                return encodeWord16(userInput as number, true);
            } else {
                throw new Error('Unsigned integer required');
            }
        case ParameterType.U32:
            if (typeof userInput === 'number') {
                return encodeWord32(userInput as number, true);
            } else {
                throw new Error('Unsigned integer required');
            }
        case ParameterType.U64:
            if (typeof BigInt(userInput) === 'bigint') {
                return encodeWord64(BigInt(userInput), true);
            } else {
                throw new Error('Unsigned integer required');
            }
        case ParameterType.U128:
            if (typeof BigInt(userInput) === 'bigint') {
                return encodeWord128LE(BigInt(userInput));
            } else {
                throw new Error('String integer required');
            }
        case ParameterType.I8:
            if (typeof userInput === 'number') {
                return encodeInt8(userInput as number);
            } else {
                throw new Error('Signed integer required');
            }
        case ParameterType.I16:
            if (typeof userInput === 'number') {
                return encodeInt16(userInput as number, true);
            } else {
                throw new Error('Signed integer required');
            }
        case ParameterType.I32:
            if (typeof userInput === 'number') {
                return encodeInt32(userInput as number, true);
            } else {
                throw new Error('Signed integer required');
            }
        case ParameterType.I64:
            if (typeof BigInt(userInput) === 'bigint') {
                return encodeInt64(BigInt(userInput), true);
            } else {
                throw new Error('Signed integer required');
            }
        case ParameterType.I128:
            if (typeof BigInt(userInput) === 'bigint') {
                return encodeInt128LE(BigInt(userInput));
            } else {
                throw new Error('String integer required');
            }
        case ParameterType.Bool:
            if (typeof userInput === 'boolean') {
                return encodeBool(userInput as boolean);
            } else {
                throw new Error('Boolean required');
            }
        case ParameterType.String:
            if (typeof userInput === 'string') {
                const pSchema: StringType = paramSchema as StringType;
                const bufferString: Buffer[] = [];
                const length = userInput.length;
                const stringLengthBuffer = serializeLength(
                    length,
                    pSchema.sizeLength
                );
                bufferString.push(stringLengthBuffer);
                const stringBuffer = Buffer.from(userInput);
                bufferString.push(stringBuffer);
                return Buffer.concat(bufferString);
            } else {
                throw new Error('String value required');
            }
        case ParameterType.Array:
            const buffer = serializeArray(paramSchema as ArrayType, userInput);
            return buffer;
        case ParameterType.Struct:
            return serializeStruct(paramSchema as StructType, userInput);
        case ParameterType.AccountAddress:
            const accountAddress = new AccountAddress(userInput);
            return accountAddress.decodedAddress;
        case ParameterType.Amount:
            if (typeof userInput === 'string') {
                const GTUAmount = new GtuAmount(BigInt(userInput));
                return encodeWord64(GTUAmount.microGtuAmount, true);
            } else {
                throw new Error('Amount required in string format');
            }
        case ParameterType.Timestamp:
            if (typeof userInput === 'string') {
                const timestamp = Date.parse(userInput);
                if (timestamp == null || isNaN(timestamp)) {
                    throw new Error('Invalid timestamp format');
                } else {
                    return encodeWord64(BigInt(timestamp), true);
                }
            } else {
                throw new Error('Timestamp required in string format');
            }
        case ParameterType.Duration:
            if (typeof userInput === 'string') {
                const duration = getMilliSeconds(userInput);
                return encodeWord64(BigInt(duration), true);
            } else {
                throw new Error('Duration required in string format');
            }
        case ParameterType.ContractAddress:
            if (
                typeof BigInt(userInput.index) === 'bigint' ||
                typeof BigInt(userInput.subindex) === 'bigint'
            ) {
                const serializeIndex = encodeWord64(
                    BigInt(userInput.index),
                    true
                );
                let serializeSubIndex = Buffer.from([]);
                if (userInput.subindex != undefined) {
                    serializeSubIndex = encodeWord64(
                        BigInt(userInput.subindex),
                        true
                    );
                } else {
                    serializeSubIndex = encodeWord64(BigInt(0), true);
                }
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
            if (userInput.hasOwnProperty('contract')) {
                const pSchema: StringType = paramSchema as StringType;
                const bufferString: Buffer[] = [];
                const contractName = 'init_' + userInput.contract;
                const length = contractName.length;
                const stringLengthBuffer = serializeLength(
                    length,
                    pSchema.sizeLength
                );
                bufferString.push(stringLengthBuffer);
                const stringBuffer = Buffer.from(contractName);
                bufferString.push(stringBuffer);
                return Buffer.concat(bufferString);
            } else {
                throw new Error(
                    "Missing field 'contract' of type JSON String."
                );
            }
        case ParameterType.ReceiveName:
            if (userInput.hasOwnProperty('contract')) {
                if (userInput.hasOwnProperty('func')) {
                    const pSchema: StringType = paramSchema as StringType;
                    const bufferString: Buffer[] = [];
                    const receiveName =
                        userInput.contract + '.' + userInput.func;
                    const length = receiveName.length;
                    const stringLengthBuffer = serializeLength(
                        length,
                        pSchema.sizeLength
                    );
                    bufferString.push(stringLengthBuffer);
                    const stringBuffer = Buffer.from(receiveName);
                    bufferString.push(stringBuffer);
                    return Buffer.concat(bufferString);
                } else {
                    throw new Error(
                        "Missing field 'func' of type JSON String."
                    );
                }
            } else {
                throw new Error(
                    "Missing field 'contract' of type JSON String."
                );
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
 * @returns Buffer containing serialization of array
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
            const stringBuffer = serializeParameters(arraySchema.of, userValue);
            bufferArray.push(stringBuffer);
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
 * @returns Buffer containing serialization of struct
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
 * @returns Buffer containing serialization of list
 */
export function serializeListOrSet(
    listType: ListType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    listData: any
): Buffer {
    if (!listData) {
        throw new Error('Invalid input for type list or set');
    }
    const bufferList: Buffer[] = [];
    const length = listData.length;
    const listLengthBuffer = serializeLength(length, listType.sizeLength);
    bufferList.push(listLengthBuffer);
    for (let i = 0; i < listData.length; i++) {
        const userValue = listData[i];
        const buffer = serializeParameters(listType.of, userValue);
        bufferList.push(buffer);
    }
    return Buffer.concat(bufferList);
}

/**
 * Serialize the pair type parameters to Buffer
 * @param pairType type of pair
 * @param pairData user input
 * @returns Buffer containing serialization of pair
 */
export function serializePairType(
    pairType: PairType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    pairData: any
): Buffer {
    if (!pairData) {
        throw new Error('Invalid input for type pair');
    }
    const bufferPair: Buffer[] = [];
    if (pairData.length === 2) {
        const leftValue = pairData[0];
        const rightValue = pairData[1];
        bufferPair.push(serializeParameters(pairType.ofLeft, leftValue));
        bufferPair.push(serializeParameters(pairType.ofRight, rightValue));
        return Buffer.concat(bufferPair);
    } else {
        throw new Error('Only pairs of two are supported');
    }
}

/**
 * Serialize the map type parameters to Buffer
 * @param mapType type of map parameters
 * @param mapData user input
 * @returns Buffer containing serialization of map
 */
export function serializeMapType(
    mapType: MapType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    mapData: any
): Buffer {
    if (!mapData) {
        throw new Error('Invalid input for type map');
    }
    const bufferMap: Buffer[] = [];
    const length = mapData.length;
    const mapLengthBuffer = serializeLength(length, mapType.sizeLength);
    bufferMap.push(mapLengthBuffer);
    for (let i = 0; i < length; i++) {
        const itemValue = mapData[i];
        if (itemValue.length === 2) {
            const leftValue = itemValue[0];
            const rightValue = itemValue[1];
            bufferMap.push(serializeParameters(mapType.ofKeys, leftValue));
            bufferMap.push(serializeParameters(mapType.ofValues, rightValue));
        } else {
            throw new Error('Expected key-value pair');
        }
    }

    return Buffer.concat(bufferMap);
}

/**
 * Serialize the enum type parameters to Buffer
 * @param enumType type of enum parameters
 * @param enumData user input
 * @returns Buffer containing serialization of enum
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
        const enumDataVariant = Object.keys(enumData)[0];
        const enumDataValue = enumData[enumDataVariant];
        const variant = enumFields[i];
        variantString = variant[0];
        variantField = variant[1];
        if (enumDataVariant === variantString) {
            if (enumFields.length <= 256) {
                bufferEnum.push(encodeWord8(i));
            } else if (enumFields.length <= 256 * 256) {
                bufferEnum.push(encodeWord16(i));
            } else {
                throw new Error(
                    'Enums with more than 65536 variants are not supported.'
                );
            }
            bufferEnum.push(serializeSchemaFields(variantField, enumDataValue));
            return Buffer.concat(bufferEnum);
        }
    }
    throw new Error('Invalid enum input');
}

/**
 *
 * @param fields Field type of the schema
 * @param userData user data
 * @returns Buffer containing serialization of struct or enum based on the fields
 */
export function serializeSchemaFields(
    fields: Fields,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    userData: any
): Buffer {
    const bufferStruct: Buffer[] = [];
    const keys = Object.keys(userData);
    switch (fields.fieldsTag) {
        case FieldsTag.Named:
            const namedFields = fields as NamedFields;
            if (keys.length === namedFields.contents.length) {
                for (let i = 0; i < namedFields.contents.length; i++) {
                    const fieldInfo = namedFields.contents[i];
                    const userJsonProperty = fieldInfo[0];
                    const userValue = userData[userJsonProperty];
                    bufferStruct.push(
                        serializeParameters(fieldInfo[1], userValue)
                    );
                }
                return Buffer.concat(bufferStruct);
            } else {
                throw new Error(
                    `Expected ${namedFields.contents.length} named fields`
                );
            }
        case FieldsTag.Unnamed:
            const unNamedFields = fields as UnnamedFields;
            if (userData.length === unNamedFields.contents.length) {
                for (let i = 0; i < unNamedFields.contents.length; i++) {
                    const fieldInfo = unNamedFields.contents[i];
                    const userValue = userData[i];
                    bufferStruct.push(
                        serializeParameters(fieldInfo, userValue)
                    );
                }
                return Buffer.concat(bufferStruct);
            } else {
                throw new Error(
                    `Expected ${unNamedFields.contents.length} unnamed fields`
                );
            }
        case FieldsTag.None:
        default:
            return Buffer.from(bufferStruct);
    }
}

/**
 *
 * @param length length of the values provided by the user
 * @param sizeLength sizeLength represented as an unsigned integer
 * @returns serialization of the length using the number of bytes specified by the sizeLength
 */

export function serializeLength(
    length: number,
    sizeLength: SizeLength
): Buffer {
    switch (sizeLength) {
        case SizeLength.U8:
            return encodeWord8(length);
        case SizeLength.U16:
            return encodeWord16(length, true);
        case SizeLength.U32:
            return encodeWord32(length, true);
        case SizeLength.U64:
            return encodeWord64(BigInt(length), true);
        default:
            throw new Error('Unknown SizeLength provided');
    }
}

/**
 *
 * @param value Duration string
 * @returns milliseconds value for the given duration
 */
function getMilliSeconds(value: string): number {
    let milliSeconds = 0;
    const days = getDuration(value, new RegExp(/(\d+)\s*d/g));
    const hours = getDuration(value, new RegExp(/(\d+)\s*h/g));
    const minutes = getDuration(value, new RegExp(/(\d+)\s*m\b/g));
    const sec = getDuration(value, new RegExp(/(\d+)\s*s/g));
    const millisec = getDuration(value, new RegExp(/(\d+)\s*ms/g));
    if (days) {
        milliSeconds += days * 86400 * 1000;
    }
    if (hours) {
        milliSeconds += hours * 3600 * 1000;
    }
    if (minutes) {
        milliSeconds += minutes * 60 * 1000;
    }
    if (sec) {
        milliSeconds += sec * 1000;
    }
    milliSeconds = milliSeconds + millisec;
    return Math.round(milliSeconds);
}

/**
 *
 * @param value Duration string
 * @param regex regex pattern
 * @returns sum of units based on regex in the given string
 */
function getDuration(value: string, regex: RegExp): number {
    let hours = 0;
    let z;
    while (null != (z = regex.exec(value))) {
        hours += parseInt(z[1]);
    }
    return hours;
}
