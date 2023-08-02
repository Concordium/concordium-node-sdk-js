/**
 * The JSON schema representation of a rust Option
 *
 * @template T - The type to represent as optional
 */
export type OptionJson<T> = { None: [] } | { Some: [T] };

/**
 * Takes a value and wraps it in a {@link OptionJson}.
 *
 * @template T - The type to represent as optional
 *
 * @param {T} value - The value to wrap.
 *
 * @returns {OptionJson<T>} the wrapped value
 */
export function toOptionJson<T>(value: T | undefined): OptionJson<T> {
    if (value === undefined) {
        return { None: [] };
    }

    return { Some: [value] };
}
