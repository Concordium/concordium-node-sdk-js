import { bail } from '../util.ts';

/**
 * Represents types returned by the GRPC API which are possibly unknown to the SDK version.
 * `null` means that the type is unknown.
 *
 * @template T - The type representing the known variants
 *
 * @example
 * // fail on unknown value
 * const upwardValue: Upward<string> = ...
 * if (upwardValue === null) {
 *   throw new Error('Uncountered unknown value')
 * }
 * // the value is known from this point
 *
 * @example
 * // gracefully handle unknown values
 * const upwardValue: Upward<string> = ...
 * if (upwardValue === null) {
 *   console.warn('Uncountered unknown value')
 * } else {
 *   // the value is known from this point
 * }
 */
export type Upward<T> = T | null;

/**
 * Type guard that checks whether an Upward<T> holds a known value.
 *
 * @template T - The type representing the known variants
 * @param value - The possibly-unknown value returned from gRPC.
 * @returns True if value is not null (i.e., is T).
 */
export function isKnown<T>(value: Upward<T>): value is T {
    return value !== null;
}

/**
 * Asserts that an Upward<T> is known, otherwise throws the provided error.
 *
 * Useful when unknowns should be treated as hard failures.
 *
 * @template T - The type representing the known variants
 * @param value - The possibly-unknown value returned from gRPC.
 * @param error - Error to throw if value is unknown.
 * @returns True as a type predicate when value is known.
 */
export function assertKnown<T>(value: Upward<T>, error: Error): value is T {
    return isKnown(value) || bail(error);
}

/**
 * Returns the known value or throws the provided error when unknown.
 *
 * @template T - The type representing the known variants
 * @param value - The possibly-unknown value returned from gRPC.
 * @param error - Error to throw if value is unknown.
 * @returns The unwrapped known value of type T.
 */
export function knownOrError<T>(value: Upward<T>, error: Error): T {
    if (!isKnown(value)) throw error;
    return value;
}
