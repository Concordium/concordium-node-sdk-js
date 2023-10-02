import { Big, BigSource } from 'big.js';
import type * as Proto from '../grpc-api/v2/concordium/types.js';

const MICRO_CCD_PER_CCD = 1_000_000;

/**
 * Representation of a CCD amount.
 * The base unit of CCD is micro CCD, which is the representation
 * used on chain.
 */
class CcdAmount {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __nominal = true;
    constructor(
        /** Internal representation of Ccd amound in micro Ccd. */
        public readonly microCcdAmount: bigint
    ) {}

    toJSON(): string {
        return this.microCcdAmount.toString();
    }
}

/**
 * Representation of a CCD amount.
 * The base unit of CCD is micro CCD, which is the representation
 * used on chain.
 */
export type Type = CcdAmount;

/**
 * Constructs a CcdAmount and checks that it is valid. It accepts a number, string, big, or bigint as parameter.
 * It can accept a string as parameter with either a comma or a dot as the decimal separator.
 *
 * @param microCcdAmount The amount of micro CCD as a number, string, big, or bigint.
 * @throws If an invalid micro CCD amount is passed, i.e. any value which is not an unsigned 64-bit integer
 */
export function fromMicroCcd(microCcdAmount: BigSource | bigint): CcdAmount {
    // If the input is a "BigSource" assert that the number is whole
    if (typeof microCcdAmount !== 'bigint') {
        microCcdAmount = newBig(microCcdAmount);

        if (!microCcdAmount.mod(Big(1)).eq(Big(0))) {
            throw Error('Can not create CcdAmount from a non-whole number!');
        }

        microCcdAmount = BigInt(microCcdAmount.toFixed());
    }

    if (microCcdAmount < 0n) {
        throw new Error(
            'A micro CCD amount must be a non-negative integer but was: ' +
                microCcdAmount
        );
    } else if (microCcdAmount > 18446744073709551615n) {
        throw new Error(
            'A micro CCD amount must be representable as an unsigned 64 bit integer but was: ' +
                microCcdAmount
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
 * @param ccd The amount of micro CCD as a number, string, big or bigint.
 * @returns The CcdAmount object derived from the ccd input parameter
 * @throws If a number is passed with several decimal seperators
 * @throws If a negative amount of micro CCD is passed
 * @throws If the micro CCD passed is greater than what can be contained in a 64-bit integer
 */
export function fromCcd(ccd: BigSource | bigint): CcdAmount {
    if (typeof ccd === 'bigint') {
        ccd = ccd.toString();
    }

    const microCcd = newBig(ccd).mul(Big(MICRO_CCD_PER_CCD));
    return fromMicroCcd(microCcd);
}

function newBig(bigSource: BigSource): Big {
    if (typeof bigSource === 'string') {
        return Big(bigSource.replace(',', '.'));
    }
    return Big(bigSource);
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
 * Convert an amount of CCD from its protobuf encoding.
 * @param {Proto.Amount} amount The energy in protobuf.
 * @returns {CcdAmount} The energy.
 */
export function fromProto(amount: Proto.Energy): CcdAmount {
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
