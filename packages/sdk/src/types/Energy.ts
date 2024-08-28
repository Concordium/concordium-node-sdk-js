import type * as Proto from '../grpc-api/v2/concordium/types.js';
import { TypedJson, TypedJsonDiscriminator, makeFromTypedJson } from './util.js';

/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 * @deprecated
 */
export const JSON_DISCRIMINATOR = TypedJsonDiscriminator.Energy;
export type Serializable = string;

/** Energy measure. Used as part of cost calculations for transactions. */
class Energy {
    protected get serializable(): Serializable {
        return this.value.toString();
    }

    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __type = JSON_DISCRIMINATOR;
    constructor(
        /** The internal value for representing the energy. */
        public readonly value: bigint
    ) {}

    /**
     * Get a string representation of the energy.
     * @returns {string} The string representation.
     */
    public toString(): string {
        return this.value.toString();
    }
}

/**
 * Unwraps {@linkcode Type} value
 * @param value value to unwrap.
 * @returns the unwrapped {@linkcode bigint} value
 */
export function toUnwrappedJSON(value: Type): bigint {
    return value.value;
}

/** Energy measure. Used as part of cost calculations for transactions. */
export type Type = Energy;

/**
 * Type predicate for {@linkcode Type}
 *
 * @param value value to check.
 * @returns whether `value` is of type {@linkcode Type}
 */
export function instanceOf(value: unknown): value is Energy {
    return value instanceof Energy;
}

/**
 * Construct an Energy type.
 * @param {bigint | number} value The measure of energy.
 * @throws If the provided value is a negative number.
 * @returns {Energy}
 */
export function create(value: bigint | number): Energy {
    if (value < 0) {
        throw new Error('Invalid energy: The value cannot be a negative number.');
    }
    return new Energy(BigInt(value));
}

/**
 * Convert energy from its protobuf encoding.
 * @param {Proto.Energy} energy The energy in protobuf.
 * @returns {Energy} The energy.
 */
export function fromProto(energy: Proto.Energy): Energy {
    return new Energy(energy.value);
}

/**
 * Convert energy into its protobuf encoding.
 * @param {Energy} energy The energy.
 * @returns {Proto.Energy} The protobuf encoding.
 */
export function toProto(energy: Energy): Proto.Energy {
    return {
        value: energy.value,
    };
}

/**
 * Constructs a {@linkcode Type} from {@linkcode Serializable}.
 * @param {Serializable} value
 * @returns {Type} The duration.
 */
export function fromSerializable(value: Serializable): Type {
    return create(BigInt(value));
}

/**
 * Converts {@linkcode Type} into {@linkcode Serializable}
 * @param {Type} energy
 * @returns {Serializable} The serializable value
 */
export function toSerializable(energy: Type): Serializable {
    return energy.value.toString();
}

/**
 * Takes an {@linkcode Type} and transforms it to a {@linkcode TypedJson} format.
 * @deprecated Use the {@linkcode toSerializable} function instead.
 * @param {Type} value - The account address instance to transform.
 * @returns {TypedJson} The transformed object.
 */
export function toTypedJSON(value: Type): TypedJson<Serializable> {
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
