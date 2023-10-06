import type * as Proto from '../grpc-api/v2/concordium/types.js';
import { TypeBase, TypedJsonDiscriminator, makeFromTypedJson } from './util.js';

/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 */
export const JSON_TYPE = TypedJsonDiscriminator.Energy;
type Serializable = string;

/** Energy measure. Used as part of cost calculations for transactions. */
class Energy extends TypeBase<Serializable> {
    protected typedJsonType = JSON_TYPE;
    protected get serializable(): Serializable {
        return this.value.toString();
    }

    constructor(
        /** The internal value for representing the energy. */
        public readonly value: bigint
    ) {
        super();
    }
}

/** Energy measure. Used as part of cost calculations for transactions. */
export type Type = Energy;

/**
 * Construct an Energy type.
 * @param {bigint | number} value The measure of energy.
 * @throws If the provided value is a negative number.
 * @returns {Energy}
 */
export function create(value: bigint | number): Energy {
    if (value < 0) {
        throw new Error(
            'Invalid energy: The value cannot be a negative number.'
        );
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
 * Takes a JSON string and converts it to instance of type {@linkcode Type}.
 *
 * @param {TypedJson} json - The typed JSON to convert.
 * @throws {TypedJsonParseError} - If unexpected JSON string is passed.
 * @returns {Type} The parsed instance.
 */
export const fromTypedJSON = makeFromTypedJson(JSON_TYPE, Energy);
