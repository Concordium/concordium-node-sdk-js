import { isAsciiAlphaNumericPunctuation } from '../contractHelpers.js';
import * as ContractName from './ContractName.js';
import * as EntrypointName from './EntrypointName.js';
import type * as Proto from '../grpc-api/v2/concordium/types.js';
import { TypeBase, TypedJsonDiscriminator, makeFromTypedJson } from './util.js';

/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 */
export const JSON_TYPE = TypedJsonDiscriminator.ReceiveName;
type Serializable = string;

/**
 * Represents a receive-function in a smart contract module.
 * A value of this type is assumed to be a valid receive name which means:
 * - It only contains ASCII alpha, numeric and punctuations.
 * - It is at most 100 characters.
 * - It contains at least one '.' character.
 */
class ReceiveName extends TypeBase<Serializable> {
    protected typedJsonType = JSON_TYPE;
    protected get serializableJsonValue(): Serializable {
        return this.value;
    }

    constructor(
        /** The internal string value of the receive name. */
        public readonly value: string
    ) {
        super();
    }
}

/**
 * Represents a receive-function in a smart contract module.
 * A value of this type is assumed to be a valid receive name which means:
 * - It only contains ASCII alpha, numeric and punctuations.
 * - It is at most 100 characters.
 * - It contains at least one '.' character.
 */
export type Type = ReceiveName;

/**
 * Create a ReceiveName.
 * @param {ContractName.Type} contractName The name of the smart contract using this receive-function.
 * @param {EntrypointName.Type} entrypointName The entrypoint of the smart contract corresponding to this receive-function.
 * @throws If the provided value is not a valid receive name.
 * @returns {ReceiveName} The receive name.
 */
export function create(
    contractName: ContractName.Type,
    entrypointName: EntrypointName.Type
): ReceiveName {
    return fromString(
        `${ContractName.toString(contractName)}.${EntrypointName.toString(
            entrypointName
        )}`
    );
}

/**
 * Create a smart contract receive-name from a string, ensuring it follows the required format.
 * @param {string} value The string of the receive name.
 * @throws If the provided value is not a valid receive name.
 * @returns {ReceiveName}
 */
export function fromString(value: string): ReceiveName {
    if (value.length > 100) {
        throw new Error(
            'Invalid ReceiveName: Can be atmost 100 characters long.'
        );
    }
    if (!value.includes('.')) {
        throw new Error(
            "Invalid ReceiveName: Must contain at least one '.' character."
        );
    }
    if (!isAsciiAlphaNumericPunctuation(value)) {
        throw new Error(
            'Invalid ReceiveName: Must only contain ASCII alpha, numeric and punctuation characters.'
        );
    }
    return new ReceiveName(value);
}

/**
 * Create a smart contract receive name from a string, but _without_ ensuring it follows the required format.
 * It is up to the caller to ensure the string is a valid receive name.
 * @param {string} value The string with the receive name.
 * @returns {ReceiveName}
 */
export function fromStringUnchecked(value: string): ReceiveName {
    return new ReceiveName(value);
}

/**
 * Convert a receive name to a string
 * @param {ReceiveName} receiveName The receive name to stringify.
 * @returns {string}
 */
export function toString(receiveName: ReceiveName): string {
    return receiveName.value;
}

/**
 * Convert a receive name to a ContractName
 * @param {ReceiveName} receiveName The receive name to get the contract name from.
 * @returns {ContractName.Type}
 */
export function toContractName(receiveName: ReceiveName): ContractName.Type {
    const splitAt = receiveName.value.indexOf('.');
    const contractName = receiveName.value.substring(0, splitAt);
    return ContractName.fromStringUnchecked(contractName);
}

/**
 * Convert a receive name to a EntrypointName
 * @param {ReceiveName} receiveName The receive name to get the entrypoint name from.
 * @returns {EntrypointName.Type}
 */
export function toEntrypointName(
    receiveName: ReceiveName
): EntrypointName.Type {
    const splitAt = receiveName.value.indexOf('.');
    const entrypointName = receiveName.value.substring(splitAt + 1);
    return EntrypointName.fromStringUnchecked(entrypointName);
}

/** Type used when encoding a receive-name using a schema. */
export type SchemaValue = {
    contract: string;
    func: string;
};

/**
 * Get receiveName in the format used by schemas.
 * @param {ReceiveName} receiveName The receive name.
 * @returns {SchemaValue} The schema value representation.
 */
export function toSchemaValue(receiveName: ReceiveName): SchemaValue {
    const contract = ContractName.toString(toContractName(receiveName));
    const func = EntrypointName.toString(toEntrypointName(receiveName));
    return { contract, func };
}

/**
 * Convert a smart contract receive name from its protobuf encoding.
 * @param {Proto.ReceiveName} receiveName The protobuf encoding.
 * @returns {ReceiveName}
 */
export function fromProto(receiveName: Proto.ReceiveName): ReceiveName {
    return fromStringUnchecked(receiveName.value);
}

/**
 * Convert a smart contract receive name into its protobuf encoding.
 * @param {ReceiveName} receiveName The receive name.
 * @returns {Proto.ReceiveName} The protobuf encoding.
 */
export function toProto(receiveName: ReceiveName): Proto.ReceiveName {
    return {
        value: receiveName.value,
    };
}

/**
 * Check if two smart contract receive names represent the same.
 * @param {ReceiveName} left
 * @param {ReceiveName} right
 * @returns {boolean} True if they are equal.
 */
export function equals(left: ReceiveName, right: ReceiveName): boolean {
    return left.value === right.value;
}

/**
 * Takes a JSON string and converts it to instance of type {@linkcode Type}.
 *
 * @param {JsonString} json - The JSON string to convert.
 * @throws {TypedJsonParseError} - If unexpected JSON string is passed.
 * @returns {Type} The parsed instance.
 */
export const fromTypedJSON = makeFromTypedJson(JSON_TYPE, fromString);
