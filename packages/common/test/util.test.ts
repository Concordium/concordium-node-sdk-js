import { intToStringTransformer, stringToInt, wasmToSchema } from '../src/util';
import { readFileSync } from 'fs';
import { Buffer } from 'buffer/';

test('intToStringTransformer transform chosen field, but not others', () => {
    const keysToTransform = ['a'];
    const input =
        '{ "a":90071992547409910, "b":90071992547409911, "aa":90071992547409912}';
    const transformed = intToStringTransformer(keysToTransform)(input);
    expect(transformed).toEqual(
        '{ "a":"90071992547409910", "b":90071992547409911, "aa":90071992547409912}'
    );
});

test('intToStringTransformer transforms multiple fields', () => {
    const keysToTransform = ['a', 'b'];
    const input =
        '{ "a":90071992547409910, "b":90071992547409911, "aa":{"a":12071992547409910,"c":1}}';
    const transformed = intToStringTransformer(keysToTransform)(input);
    expect(transformed).toEqual(
        '{ "a":"90071992547409910", "b":"90071992547409911", "aa":{"a":"12071992547409910","c":1}}'
    );
});

test('intToStringTransformer will not change the string if no keys match', () => {
    const keysToTransform = ['d', 'aaa'];
    const input =
        '{ "a":90071992547409910, "b":90071992547409911, "aa":{"a":12071992547409910,"c":1}}';
    const transformed = intToStringTransformer(keysToTransform)(input);
    expect(transformed).toEqual(input);
});

test('stringToInt transforms chosen field, but not others', () => {
    const keysToTransform = ['a'];
    const input =
        '{ "a":"90071992547409910", "b":"90071992547409911", "aa":"90071992547409912"}';
    const transformed = stringToInt(input, keysToTransform);
    expect(transformed).toEqual(
        '{ "a":90071992547409910, "b":"90071992547409911", "aa":"90071992547409912"}'
    );
});

test('stringToInt transforms multiple fields', () => {
    const keysToTransform = ['a', 'b'];
    const input =
        '{ "a":"90071992547409910", "b":"90071992547409911", "aa":{"a":"12071992547409910","c":"1"}}';
    const transformed = stringToInt(input, keysToTransform);
    expect(transformed).toEqual(
        '{ "a":90071992547409910, "b":90071992547409911, "aa":{"a":12071992547409910,"c":"1"}}'
    );
});

test('stringToInt will not change the string if no keys match', () => {
    const keysToTransform = ['d', 'aaa'];
    const input =
        '{ "a":"90071992547409910", "b":"90071992547409911", "aa":{"a":"12071992547409910","c":"1"}}';
    const transformed = stringToInt(input, keysToTransform);
    expect(transformed).toEqual(input);
});

test('stringToInt can inverse intToStringTransformer (with same chosen keys, and no matching number fields)', () => {
    const keysToTransform = ['a', 'b'];
    const input =
        '{ "a":90071992547409910, "b":90071992547409911, "aa":{"a":12071992547409910,"c":"1"}, "d": true}';
    const transformed = stringToInt(
        intToStringTransformer(keysToTransform)(input),
        keysToTransform
    );
    expect(transformed).toEqual(input);
});

test('intToStringTransformer is inverse of stringToInt (with same chosen keys, and no matching string fields)', () => {
    const keysToTransform = ['a', 'b'];
    const input =
        '{ "a":"90071992547409910", "b":"90071992547409911", "aa":{"a":"12071992547409910","c":"1"}, "d": true}';
    const transformed = intToStringTransformer(keysToTransform)(
        stringToInt(input, keysToTransform)
    );
    expect(transformed).toEqual(input);
});

test('Embedded schema is the same as a seperate schema file', () => {
    const versionedWasmModule = new Buffer(
        readFileSync('test/resources/icecream-with-schema.wasm')
    );
    // Strip module version information
    const wasmModule = versionedWasmModule.slice(8);

    const seperateSchema = new Buffer(
        readFileSync('test/resources/icecream-schema.bin')
    );
    const embeddedSchema = wasmToSchema(wasmModule);

    expect(seperateSchema).toEqual(embeddedSchema);
});
