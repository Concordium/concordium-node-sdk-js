import { Buffer } from 'buffer/';
import {
    uleb128Decode,
    uleb128DecodeWithIndex,
    uleb128Encode,
} from '../src/uleb128';

test('uleb128 encodes value as expected', () => {
    let value = 0n;
    let encoded = uleb128Encode(value);
    expect(encoded.toString('hex')).toBe('00');

    value = 100n;
    encoded = uleb128Encode(value);
    expect(encoded.toString('hex')).toBe('64');

    value = 128n;
    encoded = uleb128Encode(value);
    expect(encoded.toString('hex')).toBe('8001');

    value = 255n;
    encoded = uleb128Encode(value);
    expect(encoded.toString('hex')).toBe('ff01');

    value = 256n;
    encoded = uleb128Encode(value);
    expect(encoded.toString('hex')).toBe('8002');

    value = BigInt(Number.MAX_SAFE_INTEGER) + 123n;
    encoded = uleb128Encode(value);
    expect(encoded.toString('hex')).toBe('fa80808080808010');
});

test('uleb128 decodes value as expected', () => {
    let buf = Buffer.from('00', 'hex');
    let decoded = uleb128Decode(buf);
    expect(decoded.toString()).toBe('0');

    buf = Buffer.from('64', 'hex');
    decoded = uleb128Decode(buf);
    expect(decoded.toString()).toBe('100');

    buf = Buffer.from('ff89a209', 'hex');
    decoded = uleb128Decode(buf);
    expect(decoded.toString()).toBe('19432703');

    buf = Buffer.from('fa80808080808010', 'hex');
    decoded = uleb128Decode(buf);
    expect(decoded.toString()).toBe('9007199254741114');
});

test('uleb128 decodes value as expected with indexing', () => {
    let buf = Buffer.from('00', 'hex');
    let decoded = uleb128DecodeWithIndex(buf);
    expect(decoded.toString()).toBe('0,1');

    buf = Buffer.from('0000aa', 'hex');
    decoded = uleb128DecodeWithIndex(buf);
    expect(decoded.toString()).toBe('0,1');

    buf = Buffer.from('64', 'hex');
    decoded = uleb128DecodeWithIndex(buf);
    expect(decoded.toString()).toBe('100,1');

    buf = Buffer.from('01', 'hex');
    decoded = uleb128DecodeWithIndex(buf);
    expect(decoded.toString()).toBe('1,1');

    buf = Buffer.from('0100', 'hex');
    decoded = uleb128DecodeWithIndex(buf);
    expect(decoded.toString()).toBe('1,1');

    buf = Buffer.from('ff092209', 'hex');
    decoded = uleb128DecodeWithIndex(buf);
    expect(decoded.toString()).toBe('1279,2');

    buf = Buffer.from('fa80808080808010', 'hex');
    decoded = uleb128DecodeWithIndex(buf);
    expect(decoded.toString()).toBe('9007199254741114,8');

    buf = Buffer.from('', 'hex');
    expect(() => uleb128DecodeWithIndex(buf)).toThrowError(
        'The ULEB128 encoding was not valid: The passed bytes from index 0 must at least contain a single byte'
    );

    buf = Buffer.from('ffff', 'hex');
    expect(() => uleb128DecodeWithIndex(buf)).toThrowError(
        'The ULEB128 encoding was not valid: Could not find end of number'
    );

    // Testing indexing

    buf = Buffer.from('aa01', 'hex');
    decoded = uleb128DecodeWithIndex(buf, 1);
    expect(decoded.toString()).toBe('1,2');

    buf = Buffer.from('0100aa', 'hex');
    decoded = uleb128DecodeWithIndex(buf, 1);
    expect(decoded.toString()).toBe('0,2');
});
