import { cborDecode } from '../types/cbor.js';
import {
    Cbor,
    CborAccountAddress,
    TokenAmount,
    TokenInitializationParameters,
    TokenMetadataUrl,
    TokenModuleAccountState,
    TokenModuleState,
    TokenOperation,
    UnknownTokenOperation,
    decodeTokenOperations,
} from './index.js';

function decodeTokenModuleState(value: Cbor.Type): TokenModuleState {
    const decoded = cborDecode(value.bytes);
    if (typeof decoded !== 'object' || decoded === null) throw new Error('Invalid CBOR data for TokenModuleState');

    // Validate optional fields
    if ('governanceAccount' in decoded && !CborAccountAddress.instanceOf(decoded.governanceAccount))
        throw new Error('Invalid TokenModuleState: missing or invalid governanceAccount');

    let metadata: TokenMetadataUrl.Type | undefined;
    try {
        if ('metadata' in decoded) metadata = TokenMetadataUrl.fromCBORValue(decoded.metadata);
    } catch {
        throw new Error('Invalid TokenModuleState: invalid metadata');
    }

    if ('name' in decoded && typeof decoded.name !== 'string')
        throw new Error('Invalid TokenModuleState: invalid name');
    if ('allowList' in decoded && typeof decoded.allowList !== 'boolean')
        throw new Error('Invalid TokenModuleState: allowList must be a boolean');
    if ('denyList' in decoded && typeof decoded.denyList !== 'boolean')
        throw Error('Invalid TokenModuleState: denyList must be a boolean');
    if ('mintable' in decoded && typeof decoded.mintable !== 'boolean')
        throw new Error('Invalid TokenModuleState: mintable must be a boolean');
    if ('burnable' in decoded && typeof decoded.burnable !== 'boolean')
        throw new Error('Invalid TokenModuleState: burnable must be a boolean');
    if ('paused' in decoded && typeof decoded.paused !== 'boolean')
        throw new Error('Invalid TokenModuleState: paused must be a boolean');

    return { ...decoded, metadata } as TokenModuleState;
}

function decodeTokenModuleAccountState(value: Cbor.Type): TokenModuleAccountState {
    const decoded = cborDecode(value.bytes);
    if (typeof decoded !== 'object' || decoded === null) {
        throw new Error('Invalid CBOR data for TokenModuleAccountState');
    }

    // Validate optional fields
    if ('allowList' in decoded && typeof decoded.allowList !== 'boolean') {
        throw new Error('Invalid TokenModuleState: allowList must be a boolean');
    }
    if ('denyList' in decoded && typeof decoded.denyList !== 'boolean') {
        throw Error('Invalid TokenModuleState: denyList must be a boolean');
    }

    return decoded as TokenModuleAccountState;
}

function decodeTokenInitializationParameters(value: Cbor.Type): TokenInitializationParameters {
    const decoded = cborDecode(value.bytes);
    if (typeof decoded !== 'object' || decoded === null) {
        throw new Error('Invalid CBOR data for TokenInitializationParameters');
    }

    // Validate optional fields
    if ('governanceAccount' in decoded && !CborAccountAddress.instanceOf(decoded.governanceAccount))
        throw new Error('Invalid TokenModuleState: invalid governanceAccount');

    let metadata: TokenMetadataUrl.Type | undefined;
    try {
        if ('metadata' in decoded) metadata = TokenMetadataUrl.fromCBORValue(decoded.metadata);
    } catch {
        throw new Error('Invalid TokenModuleState: invalid metadata');
    }

    if ('allowList' in decoded && typeof decoded.allowList !== 'boolean')
        throw new Error('Invalid TokenInitializationParameters: allowList must be a boolean');
    if ('denyList' in decoded && typeof decoded.denyList !== 'boolean')
        throw Error('Invalid TokenInitializationParameters: denyList must be a boolean');
    if ('mintable' in decoded && typeof decoded.mintable !== 'boolean')
        throw new Error('Invalid TokenInitializationParameters: mintable must be a boolean');
    if ('burnable' in decoded && typeof decoded.burnable !== 'boolean')
        throw new Error('Invalid TokenInitializationParameters: burnable must be a boolean');
    if ('paused' in decoded && typeof decoded.paused !== 'boolean')
        throw new Error('Invalid TokenInitializationParameters: paused must be a boolean');

    // Optional initial supply
    if ('initialSupply' in decoded && !TokenAmount.instanceOf(decoded.initialSupply))
        throw new Error(`Invalid TokenInitializationParameters: Expected 'initialSupply' to be of type 'TokenAmount'`);

    return { ...decoded, metadata } as TokenInitializationParameters;
}

type DecodeTypeMap = {
    TokenModuleState: TokenModuleState;
    TokenModuleAccountState: TokenModuleAccountState;
    TokenInitializationParameters: TokenInitializationParameters;
    'TokenOperation[]': (TokenOperation | UnknownTokenOperation)[];
};

/**
 * Decode CBOR encoded data into its original representation.
 * @param {Cbor.Type} cbor - The CBOR encoded data.
 * @param {string} type - type hint for decoding.
 * @returns {unknown} The decoded data.
 */
export function decode<T extends keyof DecodeTypeMap>(cbor: Cbor.Type, type: T): DecodeTypeMap[T];
/**
 * Decode CBOR encoded data into its original representation.
 * @param {Cbor.Type} cbor - The CBOR encoded data.
 * @returns {unknown} The decoded data.
 */
export function decode(cbor: Cbor.Type, type?: undefined): unknown;

/**
 * Decode CBOR encoded data into its original representation.
 * @param {Cbor.Type} cbor - The CBOR encoded data.
 * @param {string | undefined} type - Optional type hint for decoding.
 * @returns {unknown} The decoded data.
 */
export function decode<T extends keyof DecodeTypeMap | undefined>(cbor: Cbor.Type, type: T): unknown {
    switch (type) {
        case 'TokenModuleState':
            return decodeTokenModuleState(cbor);
        case 'TokenModuleAccountState':
            return decodeTokenModuleAccountState(cbor);
        case 'TokenInitializationParameters':
            return decodeTokenInitializationParameters(cbor);
        case 'TokenOperation[]':
            return decodeTokenOperations(cbor);
        default:
            return cborDecode(cbor.bytes);
    }
}
