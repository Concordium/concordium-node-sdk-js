import { readFileSync } from 'fs';

import { getEmbeddedModuleSchema } from '../../src/index.js';
import { stringToInt } from '../../src/util.js';

test('stringToInt transforms chosen field, but not others', () => {
    const keysToTransform = ['a'];
    const input = '{ "a":"90071992547409910", "b":"90071992547409911", "aa":"90071992547409912"}';
    const transformed = stringToInt(input, keysToTransform);
    expect(transformed).toEqual('{ "a":90071992547409910, "b":"90071992547409911", "aa":"90071992547409912"}');
});

test('stringToInt transforms multiple fields', () => {
    const keysToTransform = ['a', 'b'];
    const input = '{ "a":"90071992547409910", "b":"90071992547409911", "aa":{"a":"12071992547409910","c":"1"}}';
    const transformed = stringToInt(input, keysToTransform);
    expect(transformed).toEqual(
        '{ "a":90071992547409910, "b":90071992547409911, "aa":{"a":12071992547409910,"c":"1"}}'
    );
});

test('stringToInt will not change the string if no keys match', () => {
    const keysToTransform = ['d', 'aaa'];
    const input = '{ "a":"90071992547409910", "b":"90071992547409911", "aa":{"a":"12071992547409910","c":"1"}}';
    const transformed = stringToInt(input, keysToTransform);
    expect(transformed).toEqual(input);
});

test('Embedded schema is the same as a seperate schema file', () => {
    const versionedWasmModule = readFileSync('test/ci/resources/icecream-with-schema.wasm');
    // Strip module version information
    const wasmModule = versionedWasmModule.subarray(8);

    const seperateSchema = readFileSync('test/ci/resources/icecream-schema.bin');
    const embeddedSchema = getEmbeddedModuleSchema({
        source: wasmModule,
        version: 1,
    });

    expect(new Uint8Array(seperateSchema)).toEqual(new Uint8Array(embeddedSchema!.buffer));
});
