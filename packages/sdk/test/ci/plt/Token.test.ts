import { Token, TokenAmount } from '../../../src/pub/plt.ts';

// Assuming TokenAmount utilities location

describe('Token.scaleAmount', () => {
    it('should scale token amount correctly when decimals are compatible', () => {
        let token: Token.Type = {
            info: {
                state: {
                    decimals: 18,
                },
            },
        } as Token.Type;

        let amount = TokenAmount.create(BigInt(10), 8);
        let scaledAmount = Token.scaleAmount(token, amount);

        expect(scaledAmount.value).toBe(BigInt(10 * 10 ** 10)); // 10^(18-8)
        expect(scaledAmount.decimals).toBe(18);

        amount = TokenAmount.create(BigInt(10), 0);
        scaledAmount = Token.scaleAmount(token, amount);

        expect(scaledAmount.value).toBe(BigInt(10 * 10 ** 18)); // 10^(18-0)
        expect(scaledAmount.decimals).toBe(18);
    });

    it('should throw an error for incompatible token amount decimals', () => {
        const token: Token.Type = {
            info: {
                state: {
                    decimals: 18,
                },
            },
        } as Token.Type;
        const amount = TokenAmount.create(BigInt(10), 19);
        expect(() => Token.scaleAmount(token, amount)).toThrow(Token.InvalidTokenAmountError);
    });

    it('should return the same amount when decimals already match the token', () => {
        const token: Token.Type = {
            info: {
                state: {
                    decimals: 8,
                },
            },
        } as Token.Type;

        const amount = TokenAmount.create(BigInt(10), 8);
        const scaledAmount = Token.scaleAmount(token, amount);

        expect(scaledAmount).toBe(amount);
    });
});
