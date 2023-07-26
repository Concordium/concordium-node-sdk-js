export type OptionJson<T> = { None: [] } | { Some: [T] };

export function toOptionJson<T>(value: T | undefined): OptionJson<T> {
    if (value === undefined) {
        return { None: [] };
    }

    return { Some: [value] };
}
