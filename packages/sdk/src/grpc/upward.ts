import { bail } from '../util.js';

export type Unknown = null;

/**
 * Represents types returned by the GRPC API of a Concordium node which are
 * possibly unknown to the SDK version. {@linkcode Unknown} means that the type is unknown.
 *
 * @template T - The type representing the known variants
 *
 * @example
 * // fail on unknown value
 * const upwardValue: Upward<string> = ...
 * if (!isKnown(upwardValue)) {
 *   throw new Error('Uncountered unknown value')
 * }
 * // the value is known from this point
 *
 * @example
 * // gracefully handle unknown values
 * const upwardValue: Upward<string> = ...
 * if (!isKnown(upwardValue)) {
 *   console.warn('Uncountered unknown value')
 * } else {
 *   // the value is known from this point
 * }
 */
export type Upward<T> = T | Unknown;

// Recursively remove all occurrences of `null` (or `Unknown`) from a type. Since `null` is only
// used via the Upward<T> sentinel (and never intentionally in other field types),
// this yields a type appropriate for constructing outbound payloads where all
// values must be known.
export type Known<T> = T extends Unknown
    ? never
    : T extends Function
      ? T
      : T extends Map<infer K, infer V>
        ? Map<Known<K>, Known<V>>
        : T extends Set<infer S>
          ? Set<Known<S>>
          : T extends readonly (infer U)[]
            ? T extends readonly [any, ...any[]]
                ? { [I in keyof T]: Known<T[I]> }
                : Known<U>[]
            : T extends object
              ? { [P in keyof T]: Known<T[P]> }
              : T;

/**
 * Type guard that checks whether an Upward<T> holds a known value.
 *
 * @template T - The type representing the known variants
 * @param value - The possibly {@linkcode Unknown} value returned from gRPC.
 * @returns True if value is not {@linkcode Unknown} (i.e., is T).
 */
export function isKnown<T>(value: Upward<T>): value is T {
    return value !== null;
}

/**
 * Asserts that an Upward<T> is known, otherwise throws the provided error.
 *
 * Useful when {@linkcode Unknown} values should be treated as hard failures.
 *
 * @template T - The type representing the known variants
 * @param value - The possibly {@linkcode Unknown} value returned from gRPC.
 * @param error - Error to throw if value is unknown.
 * @returns True as a type predicate when value is known.
 */
export function assertKnown<T>(value: Upward<T>, error: Error | string): value is T {
    return isKnown(value) || bail(error);
}

/**
 * Returns the known value or throws the provided error when unknown.
 *
 * @template T - The type representing the known variants
 * @param value - The possibly {@linkcode Unknown} value returned from gRPC.
 * @param error - Error to throw if value is unknown.
 * @returns The unwrapped known value of type T.
 */
export function knownOrError<T>(value: Upward<T>, error: Error | string): T {
    if (!isKnown(value)) throw error instanceof Error ? error : new Error(error);
    return value;
}
