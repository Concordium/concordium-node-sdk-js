import { AccountAddress } from '../../src/index.js';

type OverrideCheck<A> = {
    when: (a: unknown) => boolean;
    check: (l: A, r: A) => boolean;
};

const checkBuffers: OverrideCheck<ArrayBuffer> = {
    when(u) {
        return u instanceof ArrayBuffer;
    },
    check(l, r) {
        if (l.byteLength !== r.byteLength) {
            return false;
        }
        const lu8 = new Uint8Array(l);
        const ru8 = new Uint8Array(r);
        for (let i = 0; i < l.byteLength; i++) {
            if (lu8.at(i) !== ru8.at(i)) {
                return false;
            }
        }
        return true;
    },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const equalOverrides: OverrideCheck<any>[] = [
    {
        when: AccountAddress.isAccountAddress,
        check: AccountAddress.equals,
    },
    checkBuffers,
];

export function expectToEqual<A = unknown>(value: A, expected: A) {
    const override = equalOverrides.find(({ when: guard }) => guard(expected));
    if (override !== undefined) {
        if (!override.when(value)) {
            throw new Error(`Expected: ${expected} instead got ${value}`);
        }
        if (!override.check(value, expected)) {
            throw new Error(
                `Expected:\n    ${JSON.stringify(
                    expected
                )}\n\nInstead got:\n    ${JSON.stringify(value)}`
            );
        }
    } else if (Array.isArray(expected)) {
        if (!Array.isArray(value) || value.length !== expected.length) {
            throw new Error(`Expected: ${expected} instead got ${value}`);
        }
        for (let i = 0; i < expected.length; i++) {
            expectToEqual(value[i], expected[i]);
        }
    } else if (typeof expected === 'object' && expected !== null) {
        for (const key of Object.keys(expected)) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expectToEqual(value[key], expected[key]);
        }
    } else {
        if (value !== expected) {
            expect(value).toBe(expected);
        }
    }
}
