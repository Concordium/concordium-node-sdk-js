import { Big, BigSource } from 'big.js';

import type * as Proto from '../grpc-api/v2/concordium/types.js';
import { TypedJson, TypedJsonDiscriminator, makeFromTypedJson } from './util.js';

const MICRO_CCD_PER_CCD = 1_000_000;
/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 * @deprecated
 */
export const JSON_DISCRIMINATOR = TypedJsonDiscriminator.CcdAmount;
/**
 * @deprecated
 */
export type Serializable = string;

/**
 * Representation of a CCD amount.
 * The base unit of CCD is micro CCD, which is the representation
 * used on chain.
 */
class CcdAmount {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __type = JSON_DISCRIMINATOR;
    constructor(
        /** Internal representation of Ccd amount in micro Ccd. */
        public readonly microCcdAmount: bigint
    ) {}

    /**
     * Get a string representation of the CCD amount.
     * @returns {string} The string representation.
     */
    public toString(): string {
        const microCcdString = this.microCcdAmount.toString();
        const padded = microCcdString.padStart(7, '0');
        return `${padded.slice(0, -6)}.${padded.slice(-6)}`;
    }

    /**
     * Get a JSON-serializable representation of the CCD amount in micro CCD.
     * @returns {string} The JSON-serializable representation.
     */
    public toJSON(): string {
        return this.microCcdAmount.toString();
    }
}

/**
 * Converts a `bigint` to a CCD amount in micro CCD.
 * @param {string} json The JSON representation of the CCD amount.
 * @returns {CcdAmount} The CCD amount.
 */
export function fromJSON(json: string): CcdAmount {
    return fromMicroCcd(json);
}

/**
 * Representation of a CCD amount.
 * The base unit of CCD is micro CCD, which is the representation
 * used on chain.
 */
export type Type = CcdAmount;

/**
 * Type predicate for {@linkcode Type}
 *
 * @param value value to check.
 * @returns whether `value` is of type {@linkcode Type}
 */
export function instanceOf(value: unknown): value is CcdAmount {
    return value instanceof CcdAmount;
}

/**
 * Constructs a CcdAmount and checks that it is valid. It accepts a number, string, big, or bigint as parameter.
 *
 * @param microCcdAmount The amount of micro CCD as a number, string, big, or bigint.
 * @throws If an invalid micro CCD amount is passed, i.e. any value which is not an unsigned 64-bit integer
 */
export function fromMicroCcd(microCcdAmount: BigSource | bigint): CcdAmount {
    // If the input is a "BigSource" assert that the number is whole
    if (typeof microCcdAmount !== 'bigint') {
        microCcdAmount = Big(microCcdAmount);

        if (!microCcdAmount.mod(Big(1)).eq(Big(0))) {
            throw Error('Can not create CcdAmount from a non-whole number!');
        }

        microCcdAmount = BigInt(microCcdAmount.toFixed());
    }

    if (microCcdAmount < 0n) {
        throw new Error('A micro CCD amount must be a non-negative integer but was: ' + microCcdAmount);
    } else if (microCcdAmount > 18446744073709551615n) {
        throw new Error(
            'A micro CCD amount must be representable as an unsigned 64 bit integer but was: ' + microCcdAmount
        );
    }

    return new CcdAmount(microCcdAmount);
}

/**
 * Create a value representing zero CCD.
 * @returns {CcdAmount} A zero amount of CCD
 */
export function zero(): CcdAmount {
    return new CcdAmount(0n);
}

/**
 * Creates a CcdAmount from a number, string, big, or bigint.
 *
 * @param ccd The amount of CCD as a number, string, big or bigint.
 * @returns The CcdAmount object derived from the ccd input parameter
 * @throws If a number is passed with several decimal seperators
 * @throws If a negative amount of micro CCD is passed
 * @throws If the micro CCD passed is greater than what can be contained in a 64-bit integer
 */
export function fromCcd(ccd: BigSource | bigint): CcdAmount {
    if (typeof ccd === 'bigint') {
        ccd = ccd.toString();
    }

    const microCcd = Big(ccd).mul(Big(MICRO_CCD_PER_CCD));
    return fromMicroCcd(microCcd);
}

/**
 * Returns the amount of micro CCD as a Big.
 * @param {CcdAmount} amount The CCD amount.
 * @returns {Big} The amount in micro CCD.
 */
export function toMicroCcd(amount: CcdAmount): Big {
    return Big(amount.microCcdAmount.toString());
}

/**
 * Returns the amount of CCD as a Big.
 * @param {CcdAmount} amount The CCD amount.
 * @returns The amount of CCD as a Big
 */
export function toCcd(amount: CcdAmount): Big {
    return Big(amount.microCcdAmount.toString()).div(Big(MICRO_CCD_PER_CCD));
}

/**
 * Converts an amount of CCD to micro CCD and asserts that the amount is a valid amount of CCD.
 *
 * @param ccd The amount of CCD as a number, string, big or bigint.
 * @returns The amount of micro CCD as a Big
 * @throws If a number is passed with several decimal seperators
 * @throws If a negative amount of micro CCD is passed
 * @throws If the micro CCD passed is greater than what can be contained in a 64-bit integer
 */
export function ccdToMicroCcd(ccd: BigSource | bigint): Big {
    return toMicroCcd(fromCcd(ccd));
}

/**
 * Converts an amount of micro CCD to CCD and asserts that the amount is a valid amount of CCD.
 *
 * @param microCcd The amount of micro CCD as a number, string, big or bigint.
 * @returns The amount of CCD as a Big
 * @throws If a number is passed with several decimal seperators
 * @throws If a negative amount of micro CCD is passed
 * @throws If the micro CCD passed is greater than what can be contained in a 64-bit integer
 */
export function microCcdToCcd(microCcd: BigSource | bigint): Big {
    return toCcd(fromMicroCcd(microCcd));
}

/**
 * Type used when encoding a CCD amount in the JSON format used when serializing using a smart contract schema type.
 * String representation of the amount of micro CCD.
 */
export type SchemaValue = string;

/**
 * Get CCD amount in the JSON format used when serializing using a smart contract schema type.
 * @param {CcdAmount} amount The amount.
 * @returns {SchemaValue} The schema value representation.
 */
export function toSchemaValue(amount: CcdAmount): SchemaValue {
    return amount.microCcdAmount.toString();
}

/**
 * Convert to CCD amount from JSON format used when serializing using a smart contract schema type.
 * @param {SchemaValue} microCcdString The amount in schema format.
 * @returns {CcdAmount} The amount.
 */
export function fromSchemaValue(microCcdString: SchemaValue): CcdAmount {
    return new CcdAmount(BigInt(microCcdString));
}

/**
 * Convert an amount of CCD from its protobuf encoding.
 * @param {Proto.Amount} amount The energy in protobuf.
 * @returns {CcdAmount} The energy.
 */
export function fromProto(amount: Proto.Amount): CcdAmount {
    return new CcdAmount(amount.value);
}

/**
 * Convert an amount of CCD into its protobuf encoding.
 * @param {CcdAmount} amount The CCD amount.
 * @returns {Proto.Amount} The protobuf encoding.
 */
export function toProto(amount: CcdAmount): Proto.Amount {
    return {
        value: amount.microCcdAmount,
    };
}

/**
 * Constructs a {@linkcode Type} from {@linkcode Serializable}.
 * @deprecated Use  the{@linkcode fromJSON} function instead.
 * @param {Serializable} value
 * @returns {Type} The duration.
 */
export function fromSerializable(value: Serializable): Type {
    return fromMicroCcd(value);
}

/**
 * Converts {@linkcode Type} into {@linkcode Serializable}
 * @deprecated Use {@linkcode CcdAmount.toJSON} method instead.
 * @param {Type} value
 * @returns {Serializable} The serializable value
 */
export function toSerializable(value: Type): Serializable {
    return value.microCcdAmount.toString();
}

/**
 * Takes an {@linkcode Type} and transforms it to a {@linkcode TypedJson} format.
 * @deprecated Use the {@linkcode CcdAmount.toJSON} method instead.
 * @param {Type} value - The account address instance to transform.
 * @returns {TypedJson} The transformed object.
 */
export function toTypedJSON(value: CcdAmount): TypedJson<Serializable> {
    return {
        ['@type']: JSON_DISCRIMINATOR,
        value: toSerializable(value),
    };
}

/**
 * Takes a {@linkcode TypedJson} object and converts it to instance of type {@linkcode Type}.
 * @deprecated Use the {@linkcode fromJSON} function instead.
 * @param {TypedJson} json - The typed JSON to convert.
 * @throws {TypedJsonParseError} - If unexpected JSON string is passed.
 * @returns {Type} The parsed instance.
 */
export const fromTypedJSON = /*#__PURE__*/ makeFromTypedJson(JSON_DISCRIMINATOR, fromSerializable);
