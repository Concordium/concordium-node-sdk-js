import { schemaAsBuffer } from '../src/WalletConnection';

// Tests have been taken from https://github.com/bcgit/bc-java/blob/main/core/src/test/java/org/bouncycastle/util/encoders/test/Base64Test.java.

test('Test Vector 1', () => {
    schemaAsBuffer('');
});

test('Test Vector 2', () => {
    schemaAsBuffer('Zg==');
});

test('Test Vector 3', () => {
    schemaAsBuffer('Zm8=');
});

test('Test Vector 4', () => {
    schemaAsBuffer('Zm9v');
});

test('Test Vector 5', () => {
    schemaAsBuffer('Zm9vYg==');
});

test('Test Vector 6', () => {
    schemaAsBuffer('Zm9vYmE=');
});

test('Test Vector 7', () => {
    schemaAsBuffer('Zm9vYmFy');
});

test('Test Vector 8', () => {
    const schemaBuffer = schemaAsBuffer('mO4TyLWG7vjFWdKT8IJcVbZ/jwc=');
    expect(schemaBuffer.toString('hex')).toEqual('98ee13c8b586eef8c559d293f0825c55b67f8f07');
});

test('Test Vector 9', () => {
    const schemaBuffer = schemaAsBuffer('F4I4p8Vf/mS+Kxvri3FPoMcqmJ1f');
    expect(schemaBuffer.toString('hex')).toEqual('178238a7c55ffe64be2b1beb8b714fa0c72a989d5f');
});

test('Test Vector 10', () => {
    const schemaBuffer = schemaAsBuffer('UJmEdJYodqHJmd7Rtv6/OP29/jUEFw==');
    expect(schemaBuffer.toString('hex')).toEqual('50998474962876a1c999ded1b6febf38fdbdfe350417');
});

test('Test error on invalid input 1', () => {
    const invalid = '%O4TyLWG7vjFWdKT8IJcVbZ/jwc=';
    expect(() => schemaAsBuffer(invalid)).toThrow();
});

test('Test error on invalid input 2', () => {
    const invalid = 'F%I4p8Vf/mS+Kxvri3FPoMcqmJ1f';
    expect(() => schemaAsBuffer(invalid)).toThrow();
});

test('Test error on invalid input 3', () => {
    const invalid = 'UJ%EdJYodqHJmd7Rtv6/OP29/jUEFw==';
    expect(() => schemaAsBuffer(invalid)).toThrow();
});

test('Test error on invalid input 4', () => {
    const invalid = 'mO4%yLWG7vjFWdKT8IJcVbZ/jwc=';
    expect(() => schemaAsBuffer(invalid)).toThrow();
});

test('Test error on invalid input 5', () => {
    const invalid = 'UJmEdJYodqHJmd7Rtv6/OP29/jUEF%==';
    expect(() => schemaAsBuffer(invalid)).toThrow();
});

test('Test error on invalid input 6', () => {
    const invalid = 'mO4TyLWG7vjFWdKT8IJcVbZ/jw%=';
    expect(() => schemaAsBuffer(invalid)).toThrow();
});

test('Test error on invalid input 7', () => {
    const invalid = 'F4I4p8Vf/mS+Kxvri3FPoMcqmJ1%';
    expect(() => schemaAsBuffer(invalid)).toThrow();
});

test('Test error on invalid input 8', () => {
    const invalid = 'UJmEdJYodqHJmd7Rtv6/OP29/jUE%c==';
    expect(() => schemaAsBuffer(invalid)).toThrow();
});

test('Test error on invalid input 9', () => {
    const invalid = 'mO4TyLWG7vjFWdKT8IJcVbZ/j%c=';
    expect(() => schemaAsBuffer(invalid)).toThrow();
});

test('Test error on invalid input 10', () => {
    const invalid = 'F4I4p8Vf/mS+Kxvri3FPoMcqmJ%1';
    expect(() => schemaAsBuffer(invalid)).toThrow();
});

test('Test error on invalid input 11', () => {
    const invalid = 'UJmEdJYodqHJmd7Rtv6/OP29/jU%Fc==';
    expect(() => schemaAsBuffer(invalid)).toThrow();
});

test('Test error on invalid input 12', () => {
    const invalid = 'mO4TyLWG7vjFWdKT8IJcVbZ/%wc=';
    expect(() => schemaAsBuffer(invalid)).toThrow();
});

test('Test error on invalid input 13', () => {
    const invalid = 'F4I4p8Vf/mS+Kxvri3FPoMcqm%1c';
    expect(() => schemaAsBuffer(invalid)).toThrow();
});
test('Test error on invalid input 14', () => {
    const invalid = 'UJmEdJYodqHJmd7Rtv6/OP29/jUEFw=1';
    expect(() => schemaAsBuffer(invalid)).toThrow();
});

test('Test error on invalid input 15', () => {
    const invalid = 'M';
    expect(() => schemaAsBuffer(invalid)).toThrow();
});
