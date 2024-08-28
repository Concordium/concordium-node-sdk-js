import type * as Proto from '../grpc-api/v2/concordium/types.js';
import { TypedJson, TypedJsonDiscriminator, makeFromTypedJson } from './util.js';

/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 * @deprecated
 */
export const JSON_DISCRIMINATOR = TypedJsonDiscriminator.ContractAddress;
type ContractAddressLike<T> = { index: T; subindex: T };
export type Serializable = ContractAddressLike<string>;

/** Address of a smart contract instance. */
class ContractAddress implements ContractAddressLike<bigint> {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __type = JSON_DISCRIMINATOR;
    constructor(
        /** The index of the smart contract address. */
        public readonly index: bigint,
        /** The subindex of the smart contract address. */
        public readonly subindex: bigint
    ) {}

    /**
     * Get a string representation of the contract address using the `<index, subindex>` format.
     * @returns {string} The string representation.
     */
    public toString(): string {
        return `<${this.index}, ${this.subindex}>`;
    }
}

/**
 * Unwraps {@linkcode Type} value
 *
 * @param value value to unwrap.
 * @returns the unwrapped {@linkcode Serializable} value
 */
export function toUnwrappedJSON({ index, subindex }: Type): ContractAddressLike<bigint> {
    return { index, subindex };
}

/** Address of a smart contract instance. */
export type Type = ContractAddress;

/**
 * Type predicate for {@linkcode Type}
 *
 * @param value value to check.
 * @returns whether `value` is of type {@linkcode Type}
 */
export function instanceOf(value: unknown): value is ContractAddress {
    return value instanceof ContractAddress;
}

/**
 * Construct a ContractAddress type.
 * @param {number | bigint} index The index of the smart contract instance.
 * @param {number | bigint} [subindex] The subindex of the smart contract instance. Defaults to 0.
 * @throws If provided index or subindex is sub-zero.
 * @returns {ContractAddress}
 */
export function create(index: number | bigint, subindex: number | bigint = 0n): ContractAddress {
    if (index < 0) {
        throw new Error('Invalid contract address: The index cannot be a negative number.');
    }
    if (subindex < 0) {
        throw new Error('Invalid contract address: The subindex cannot be a negative number.');
    }
    return new ContractAddress(BigInt(index), BigInt(subindex));
}

/** Type used when encoding a contract address in the JSON format used when serializing using a smart contract schema type. */
export type SchemaValue = {
    index: bigint;
    subindex: bigint;
};

/**
 * Get contract address in the JSON format used when serializing using a smart contract schema type.
 * @param {ContractAddress} contractAddress The contract address.
 * @returns {SchemaValue} The schema JSON representation.
 */
export function toSchemaValue(contractAddress: ContractAddress): SchemaValue {
    return { index: contractAddress.index, subindex: contractAddress.subindex };
}

/**
 * Convert to contract address from JSON format used when serializing using a smart contract schema type.
 * @param {SchemaValue} contractAddress The contract address in schema JSON format.
 * @returns {ContractAddress} The contract address.
 */
export function fromSchemaValue(contractAddress: SchemaValue): ContractAddress {
    return create(contractAddress.index, contractAddress.subindex);
}

/**
 * Convert a smart contract address from its protobuf encoding.
 * @param {Proto.ContractAddress} contractAddress The contract address in protobuf.
 * @returns {ContractAddress} The contract address.
 */
export function fromProto(contractAddress: Proto.ContractAddress): ContractAddress {
    return create(contractAddress.index, contractAddress.subindex);
}

/**
 * Convert a smart contract address into its protobuf encoding.
 * @param {ContractAddress} contractAddress The contract address.
 * @returns {Proto.ContractAddress} The protobuf encoding.
 */
export function toProto(contractAddress: ContractAddress): Proto.ContractAddress {
    return {
        index: contractAddress.index,
        subindex: contractAddress.subindex,
    };
}

/**
 * Check if two contract addresses are the same.
 * @param {ContractAddress} left
 * @param {ContractAddress} right
 * @returns {boolean} True if they are equal.
 */
export function equals(left: ContractAddress, right: ContractAddress): boolean {
    return left.index === right.index && left.subindex === right.subindex;
}

/**
 * Constructs a {@linkcode ContractAddress} from {@linkcode Serializable}.
 * @param {Serializable} value
 * @returns {ContractAddress} The contract address.
 */
export function fromSerializable(value: Serializable): ContractAddress {
    return new ContractAddress(BigInt(value.index), BigInt(value.subindex));
}

/**
 * Converts {@linkcode ContractAddress} into {@linkcode Serializable}.
 * @param {ContractAddress} contractAddress
 * @returns {Serializable} The serializable contract address
 */
export function toSerializable(contractAddress: ContractAddress): Serializable {
    return {
        index: contractAddress.index.toString(),
        subindex: contractAddress.subindex.toString(),
    };
}

/**
 * Converts {@linkcode ContractAddress} into a string using the `<index, subindex>` format.
 * @deprecated Use the {@linkcode ContractAddress.toString} method instead.
 * @param {ContractAddress} contractAddress
 * @returns {string} The string representation of the address.
 */
export function toString(contractAddress: ContractAddress): string {
    return `<${contractAddress.index}, ${contractAddress.subindex}>`;
}

/**
 * Takes an {@linkcode Type} and transforms it to a {@linkcode TypedJson} format.
 * @deprecated Use the {@linkcode toSerializable} function instead.
 * @param {Type} value - The account address instance to transform.
 * @returns {TypedJson} The transformed object.
 */
export function toTypedJSON(value: ContractAddress): TypedJson<Serializable> {
    return {
        ['@type']: JSON_DISCRIMINATOR,
        value: toSerializable(value),
    };
}

/**
 * Takes a {@linkcode TypedJson} object and converts it to instance of type {@linkcode Type}.
 * @deprecated Use the {@linkcode fromSerializable} function instead.
 * @param {TypedJson} json - The typed JSON to convert.
 * @throws {TypedJsonParseError} - If unexpected JSON string is passed.
 * @returns {Type} The parsed instance.
 */
export const fromTypedJSON = /*#__PURE__*/ makeFromTypedJson(JSON_DISCRIMINATOR, fromSerializable);
