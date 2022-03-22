import { intListToStringList } from '../src/util';

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
