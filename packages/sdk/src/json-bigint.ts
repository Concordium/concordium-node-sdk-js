import JSONBig from 'json-bigint';

export function stringify(value: unknown): string {
    return JSONBig.stringify(value);
}

export function parse(value: string): any {
    return JSONBig({ useNativeBigInt: true, alwaysParseAsBig: true }).parse(value);
}
