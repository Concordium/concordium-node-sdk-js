import { intListToStringList, intToStringTransformer } from '../src/util';

test('Correctly converts stringified list of numbers to stringified list of corresponding strings', () => {
    // List of ints
    let numbers = '[1, 22, 332]';
    let strings = intListToStringList(numbers);

    expect(strings).toEqual('["1", "22", "332"]');

    // Empty list
    numbers = '[]';
    strings = intListToStringList(numbers);

    expect(strings).toEqual('[]');

    // Single int list
    numbers = '[1]';
    strings = intListToStringList(numbers);

    expect(strings).toEqual('["1"]');

    // negative int list
    numbers = '[-1, 21, -32]';
    strings = intListToStringList(numbers);

    expect(strings).toEqual('["-1", "21", "-32"]');
});

test('intToStringTransformer transform chosen field, but not others', () => {
    const keysToTransform = ['a'];
    const input = '{ "a":1, "b":2, "aa":3}';
    const transformed = intToStringTransformer(keysToTransform)(input);
    expect(transformed).toEqual('{ "a":"1", "b":2, "aa":3}');
});

test('intToStringTransformer transforms multiple fields', () => {
    const keysToTransform = ['a', 'b'];
    const input = '{ "a":1, "b":2, "aa":{"a":124,"c":1}}';
    const transformed = intToStringTransformer(keysToTransform)(input);
    expect(transformed).toEqual('{ "a":"1", "b":"2", "aa":{"a":"124","c":1}}');
});

test('intToStringTransformer will not change the string if no keys match', () => {
    const keysToTransform = ['d', 'aaa'];
    const input = '{ "a":1, "b":2, "aa":{"a":124,"c":1}}';
    const transformed = intToStringTransformer(keysToTransform)(input);
    expect(transformed).toEqual(input);
});
