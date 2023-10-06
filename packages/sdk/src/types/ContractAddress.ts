import type * as Proto from '../grpc-api/v2/concordium/types.js';
import { TypeBase, TypedJsonDiscriminator, makeFromTypedJson } from './util.js';

/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 */
export const JSON_DISCRIMINATOR = TypedJsonDiscriminator.ContractAddress;
type Serializable = { index: string; subindex: string };

/** Address of a smart contract instance. */
class ContractAddress extends TypeBase<Serializable> {
    protected typedJsonType = JSON_DISCRIMINATOR;
    protected get serializable(): Serializable {
        return {
            index: this.index.toString(),
            subindex: this.subindex.toString(),
        };
    }

    constructor(
        /** The index of the smart contract address. */
        public readonly index: bigint,
        /** The subindex of the smart contract address. */
        public readonly subindex: bigint
    ) {
        super();
    }
}

/** Address of a smart contract instance. */
export { ContractAddress as Type };

/**
 * Type guard for ContractAddress
 * @param {unknown} input Input to check.
 * @returns {boolean} Boolean indicating whether input is a contract address.
 */
export function isContractAddress(input: unknown): input is ContractAddress {
    return (
        typeof input === 'object' &&
        input !== null &&
        'index' in input &&
        'subindex' in input &&
        typeof input.index === 'bigint' &&
        typeof input.subindex === 'bigint' &&
        0 <= input.index &&
        0 <= input.subindex
    );
}

/**
 * Construct a ContractAddress type.
 * @param {number | bigint} index The index of the smart contract instance.
 * @param {number | bigint} [subindex] The subindex of the smart contract instance. Defaults to 0.
 * @throws If provided index or subindex is sub-zero.
 * @returns {ContractAddress}
 */
export function create(
    index: number | bigint,
    subindex: number | bigint = 0n
): ContractAddress {
    if (index < 0) {
        throw new Error(
            'Invalid contract address: The index cannot be a negative number.'
        );
    }
    if (subindex < 0) {
        throw new Error(
            'Invalid contract address: The subindex cannot be a negative number.'
        );
    }
    return new ContractAddress(BigInt(index), BigInt(subindex));
}

/** Type used when representing a contract address while using a schema. */
export type SchemaValue = {
    index: bigint;
    subindex: bigint;
};

/**
 * Get contract address in the format used by schema.
 * @param {ContractAddress} contractAddress The contract address.
 * @returns {SchemaValue} The schema value representation.
 */
export function toSchemaValue(contractAddress: ContractAddress): SchemaValue {
    return { index: contractAddress.index, subindex: contractAddress.subindex };
}

/**
 * Convert a smart contract address from its protobuf encoding.
 * @param {Proto.ContractAddress} contractAddress The contract address in protobuf.
 * @returns {ContractAddress} The contract address.
 */
export function fromProto(
    contractAddress: Proto.ContractAddress
): ContractAddress {
    return create(contractAddress.index, contractAddress.subindex);
}

/**
 * Convert a smart contract address into its protobuf encoding.
 * @param {ContractAddress} contractAddress The contract address.
 * @returns {Proto.ContractAddress} The protobuf encoding.
 */
export function toProto(
    contractAddress: ContractAddress
): Proto.ContractAddress {
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
 * Takes a JSON string and converts it to instance of type {@linkcode Type}.
 *
 * @param {TypedJson} json - The typed JSON to convert.
 * @throws {TypedJsonParseError} - If unexpected JSON string is passed.
 * @returns {Type} The parsed instance.
 */
export const fromTypedJSON = makeFromTypedJson(
    JSON_DISCRIMINATOR,
    (v: Serializable) =>
        new ContractAddress(BigInt(v.index), BigInt(v.subindex))
);
