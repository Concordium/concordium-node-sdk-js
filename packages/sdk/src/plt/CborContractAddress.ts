import { Tag, decode } from 'cbor2';
import { encode, registerEncoder } from 'cbor2/encoder';

import { MAX_U64 } from '../constants.js';
import { ContractAddress } from '../types/index.js';
import { isDefined } from '../util.js';

/**
 * Enum representing the types of errors that can occur when creating a contract address.
 */
export enum ErrorType {
    /** Error type indicating a contract index exceeds the maximum allowed value. */
    EXCEEDS_MAX_VALUE = 'EXCEEDS_MAX_VALUE',
    /** Error type indicating a contract index is negative. */
    NEGATIVE = 'NEGATIVE',
}

/**
 * Custom error to represent issues with contract addresses.
 */
export class Err extends Error {
    private constructor(
        /** The {@linkcode ErrorType} of the error. Can be used to distinguish different types of errors. */
        public readonly type: ErrorType,
        message: string
    ) {
        super(message);
        this.name = `CborContractAddress.Err.${type}`;
    }

    /**
     * Creates a CborContractAddress.Err indicating that the contract address index exceeds the maximum allowed value.
     */
    public static exceedsMaxValue(): Err {
        return new Err(ErrorType.EXCEEDS_MAX_VALUE, `Contract indices cannot be larger than ${MAX_U64}`);
    }

    /**
     * Creates a CborContractAddress.Err indicating that the contract address index is negative.
     */
    public static negative(): Err {
        return new Err(ErrorType.NEGATIVE, 'Contract indices cannot be negative');
    }
}

/**
 * CIS-7 CBOR representation of a `ContractAddress`.
 */
class CborContractAddress {
    #nominal = true;

    constructor(
        /** The index of the smart contract address. */
        public readonly index: bigint,
        /** The subindex of the smart contract address. Interpreted as `0` if not specified. */
        public readonly subindex?: bigint
    ) {
        const values = [index, subindex].filter(isDefined);
        if (values.some((v) => v < 0n)) {
            throw Err.negative();
        }
        if (values.some((v) => v > MAX_U64)) {
            throw Err.exceedsMaxValue();
        }
    }

    /**
     * Get a string representation of the contract address using the `<index, subindex>` format.
     * @returns {string} The string representation.
     */
    public toString(): string {
        return toContractAddress(this).toString();
    }

    /**
     * Get the JSON representation (i.e. object format) of the contract address.
     * It's up to the user to process this, as bigints are not JSON serializable.
     * @returns {JSON} The JSON representation.
     */
    public toJSON(): JSON {
        if (this.subindex === undefined) return { index: this.index };
        return { index: this.index, subindex: this.subindex };
    }
}

/**
 * CIS-7 CBOR representation of a `ContractAddress`.
 */
export type Type = CborContractAddress;

/**
 * Type predicate for {@linkcode Type}.
 *
 * @param v - a value of unknown type to check
 * @returns whether the type is an instance of {@linkcode Type}
 */
export const instanceOf = (v: unknown): v is CborContractAddress => v instanceof CborContractAddress;

/**
 * The JSON representation of a {@linkcode Type} cbor contract address.
 * It's up to the user to process this, as bigints are not JSON serializable.
 */
export type JSON = { index: bigint; subindex?: bigint };

type NumLike = string | number | bigint;

/**
 * Create a CBOR-compatible contract address from numeric index (and optional subindex).
 *
 * @param index Index of the contract (string | number | bigint accepted, coerced via BigInt()).
 * @param subindex Optional subindex of the contract (same coercion rules). If `0`, the value is omitted.
 *
 * @returns CborContractAddress instance representing the provided (index, subindex).
 * @throws {Err} If index or subindex is negative ({@link Err.negative}).
 * @throws {Err} if index of subindex exceed MAX_U64 ({@link Err.exceedsMaxValue}).
 */
export function create(index: NumLike, subindex?: NumLike): CborContractAddress {
    if (subindex === undefined) {
        return new CborContractAddress(BigInt(index));
    }

    const sub = BigInt(subindex);
    if (sub === 0n) {
        return new CborContractAddress(BigInt(index));
    }

    return new CborContractAddress(BigInt(index), BigInt(subindex));
}

/**
 * Convert a public `ContractAddress.Type` (sdk representation) into its CBOR wrapper form.
 *
 * @param address The contract address value (with bigint index/subindex) to wrap.
 * @returns Equivalent CborContractAddress instance.
 */
export function fromContractAddress(address: ContractAddress.Type): CborContractAddress {
    return create(address.index, address.subindex);
}

/**
 * Convert a CBOR wrapper contract address to the public `ContractAddress.Type`.
 *
 * @param address The CBOR contract address wrapper to convert.
 * @returns New `ContractAddress.Type` constructed from wrapper values.
 */
export function toContractAddress(address: CborContractAddress): ContractAddress.Type {
    return ContractAddress.create(address.index, address.subindex);
}

/**
 * Create a CborContractAddress from its JSON-like object representation.
 *
 * @param address Object with index and optional subindex.
 * @returns Corresponding CborContractAddress instance.
 */
export function fromJSON(address: JSON): CborContractAddress {
    if (address.subindex === undefined || address.subindex === null) {
        return new CborContractAddress(BigInt(address.index));
    }
    return new CborContractAddress(BigInt(address.index), BigInt(address.subindex));
}

const TAGGED_CONTRACT_ADDRESS = 40919;

/**
 * Produce the tagged CBOR value representation (tag + contents) for a contract address.
 * Tag format simple: 40919(index).
 * Tag format full: 40919([index, subindex]).
 *
 * @param address The CBOR contract address wrapper instance.
 * @returns cbor2.Tag carrying the encoded address.
 */
export function toCBORValue(address: CborContractAddress): Tag {
    let contents = address.subindex === undefined ? address.index : [address.index, address.subindex];
    return new Tag(TAGGED_CONTRACT_ADDRESS, contents);
}

/**
 * Encode a contract address to raw CBOR binary (Uint8Array) using its tagged representation.
 *
 * @param address The CBOR contract address wrapper to encode.
 * @returns Uint8Array containing the canonical CBOR encoding.
 */
export function toCBOR(address: CborContractAddress): Uint8Array {
    return new Uint8Array(encode(toCBORValue(address)));
}

/**
 * Registers a CBOR encoder for the CborContractAddress type with the `cbor2` library.
 * This allows CborContractAddress instances to be automatically encoded when used with
 * the `cbor2` library's encode function.
 *
 * @returns {void}
 * @example
 * // Register the encoder
 * registerCBOREncoder();
 * // Now CborContractAddress instances can be encoded directly
 * const encoded = encode(myCborContractAddress);
 */
export function registerCBOREncoder(): void {
    registerEncoder(CborContractAddress, (value) => {
        const { tag, contents } = toCBORValue(value);
        return [tag, contents];
    });
}

/**
 * Decodes a CBOR-encoded contract address tagged value (tag 40919) into a {@linkcode CborContractAddress} instance.
 *
 * @param {unknown} decoded - The CBOR decoded value, expected to be a tagged value with tag 40919.
 * @throws {Error} - If the decoded value is not a valid CBOR encoded contract address.
 * @returns {CborContractAddress} The decoded contract address as a CborContractAddress instance.
 */
function fromCBORValue(decoded: unknown): CborContractAddress {
    // Verify we have a tagged value with tag 40919 (tagged-contract-address)
    if (!(decoded instanceof Tag) || decoded.tag !== TAGGED_CONTRACT_ADDRESS) {
        throw new Error(`Invalid CBOR encoded contract address: expected tag ${TAGGED_CONTRACT_ADDRESS}`);
    }

    const validateUint = (val: unknown): val is number | bigint => typeof val === 'number' || typeof val === 'bigint';

    const value = decoded.contents;
    if (Array.isArray(value) && value.length === 2 && value.every(validateUint))
        return new CborContractAddress(BigInt(value[0]), BigInt(value[1]));
    else if (validateUint(value)) return new CborContractAddress(BigInt(value));
    else throw new Error('Invalid CBOR encoded contract address: expected uint value or tuple with 2 uint values.');
}

/**
 * Decodes a CBOR-encoded contract address into an CborContractAddress instance.
 * This function can handle both the full format (with subindex)
 * and a simplified format with just the index.
 *
 * 1. With subindex:
 * ```
 * [uint, uint]
 * ```
 *
 * 2. Without subindex:
 * ```
 * uint
 * ```
 *
 * @param {Uint8Array} bytes - The CBOR encoded representation of an contract address.
 * @throws {Error} - If the input is not a valid CBOR encoding of an contract address.
 * @returns {Type} The decoded CborContractAddress instance.
 */
export function fromCBOR(bytes: Uint8Array): Type {
    return fromCBORValue(decode(bytes));
}

/**
 * Registers a CBOR decoder for the tagged-contract address (40919) format with the `cbor2` library.
 * This enables automatic decoding of CBOR data containing Concordium contract addresses
 * when using the `cbor2` library's decode function.
 *
 * @returns {() => void} A cleanup function that, when called, will restore the previous
 * decoder (if any) that was registered for the tagged-address format. This is useful
 * when used in an existing `cbor2` use-case.
 *
 * @example
 * // Register the decoder
 * const cleanup = registerCBORDecoder();
 * // Use the decoder
 * const tokenHolder = decode(cborBytes); // Returns CborContractAddress if format matches
 * // Later, unregister the decoder
 * cleanup();
 */
export function registerCBORDecoder(): () => void {
    const old = [Tag.registerDecoder(TAGGED_CONTRACT_ADDRESS, fromCBORValue)];

    // return cleanup function to restore the old decoder
    return () => {
        for (const decoder of old) {
            if (decoder) {
                Tag.registerDecoder(TAGGED_CONTRACT_ADDRESS, decoder);
            } else {
                Tag.clearDecoder(TAGGED_CONTRACT_ADDRESS);
            }
        }
    };
}
