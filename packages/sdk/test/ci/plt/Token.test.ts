import { TokenModuleAccountState, TokenModuleState, TokenTransfer } from '../../../src/plt/module.js';
import { Cbor, Token, TokenAmount, TokenHolder, TokenId, TokenMetadataUrl } from '../../../src/pub/plt.ts';
import { AccountAddress, AccountInfo } from '../../../src/pub/types.js';

const ACCOUNT_1 = AccountAddress.fromBase58('4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd');
const ACCOUNT_2 = AccountAddress.fromBase58('3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB');

// Mock the gRPC client for validateTransfer tests
jest.mock('../../../src/grpc/GRPCClient.js', () => {
    return {
        ConcordiumGRPCClient: jest.fn().mockImplementation(() => ({
            getAccountInfo: jest.fn().mockResolvedValue({
                accountAddress: ACCOUNT_1,
                accountTokens: [],
            }),
        })),
    };
});

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

describe('Token.validateAmount', () => {
    it('should not throw an error when decimals match', () => {
        const token = createMockToken(8);
        const amount = TokenAmount.create(BigInt(100), 8);

        expect(() => Token.validateAmount(token, amount)).not.toThrow();
    });

    it('should throw InvalidTokenAmountError when decimals do not match', () => {
        const token = createMockToken(8);
        const amount = TokenAmount.create(BigInt(100), 6);

        expect(() => Token.validateAmount(token, amount)).toThrow(Token.InvalidTokenAmountError);
    });
});

describe('Token.validateGovernanceOperation', () => {
    it('should return true when sender is the governance account', () => {
        const governanceAddress = ACCOUNT_1;
        const moduleState: TokenModuleState = {
            name: 'Test Token',
            metadata: TokenMetadataUrl.fromString('https://example.com/metadata'),
            governanceAccount: TokenHolder.fromAccountAddress(governanceAddress),
        };

        const token = createMockToken(8, moduleState);

        expect(Token.validateGovernanceOperation(token, governanceAddress)).toBe(true);
    });

    it('should throw UnauthorizedGovernanceOperationError when sender is not the governance account', () => {
        const governanceAddress = ACCOUNT_1;
        const nonGovernanceAddress = ACCOUNT_2;

        const moduleState: TokenModuleState = {
            name: 'Test Token',
            metadata: TokenMetadataUrl.fromString('https://example.com/metadata'),
            governanceAccount: TokenHolder.fromAccountAddress(governanceAddress),
        };

        const token = createMockToken(8, moduleState);

        expect(() => Token.validateGovernanceOperation(token, nonGovernanceAddress)).toThrow(
            Token.UnauthorizedGovernanceOperationError
        );
    });
});

describe('Token.validateTransfer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should validate transfer when sender has sufficient funds and no restrictions', async () => {
        const sender = ACCOUNT_1;
        const recipient = ACCOUNT_2;
        const tokenId = TokenId.fromString('3f1bfce9');
        const decimals = 8;

        // Setup token with no allow/deny lists
        const moduleState: TokenModuleState = {
            name: 'Test Token',
            metadata: TokenMetadataUrl.fromString('https://example.com/metadata'),
            governanceAccount: TokenHolder.fromAccountAddress(sender),
            allowList: false,
            denyList: false,
        };

        const token = createMockToken(decimals, moduleState, tokenId);

        // Setup sender account with sufficient balance
        const senderBalance = TokenAmount.create(BigInt(1000), decimals);
        const senderAccountInfo = createAccountInfo(sender, tokenId, senderBalance);

        // Mock getAccountInfo to return proper account info
        token.grpc.getAccountInfo = jest.fn().mockResolvedValue(senderAccountInfo);

        // Create transfer payload
        const transferAmount = TokenAmount.create(BigInt(500), decimals);
        const transfer: TokenTransfer = {
            amount: transferAmount,
            recipient: TokenHolder.fromAccountAddress(recipient),
        };

        // Should validate successfully
        await expect(Token.validateTransfer(token, sender, transfer)).resolves.toBe(true);

        // Verify getAccountInfo was called correctly
        expect(token.grpc.getAccountInfo).toHaveBeenCalledWith(sender);
    });

    it('should throw InsufficientFundsError when sender has insufficient balance', async () => {
        const sender = ACCOUNT_1;
        const recipient = ACCOUNT_2;
        const tokenId = TokenId.fromString('3f1bfce9');
        const decimals = 8;

        const moduleState: TokenModuleState = {
            name: 'Test Token',
            metadata: TokenMetadataUrl.fromString('https://example.com/metadata'),
            governanceAccount: TokenHolder.fromAccountAddress(sender),
        };

        const token = createMockToken(decimals, moduleState, tokenId);

        // Setup sender account with insufficient balance
        const senderBalance = TokenAmount.create(BigInt(100), decimals);
        const senderAccountInfo = createAccountInfo(sender, tokenId, senderBalance);

        // Mock getAccountInfo to return proper account info
        token.grpc.getAccountInfo = jest.fn().mockResolvedValue(senderAccountInfo);

        // Create transfer payload with amount larger than balance
        const transferAmount = TokenAmount.create(BigInt(500), decimals);
        const transfer: TokenTransfer = {
            amount: transferAmount,
            recipient: TokenHolder.fromAccountAddress(recipient),
        };

        // Should throw InsufficientFundsError
        await expect(Token.validateTransfer(token, sender, transfer)).rejects.toThrow(Token.InsufficientFundsError);
    });

    it('should throw NotAllowedError when account is on deny list', async () => {
        const sender = ACCOUNT_1;
        const recipient = ACCOUNT_2;
        const tokenId = TokenId.fromString('3f1bfce9');
        const decimals = 8;

        // Setup token with deny list enabled
        const moduleState: TokenModuleState = {
            name: 'Test Token',
            metadata: TokenMetadataUrl.fromString('https://example.com/metadata'),
            governanceAccount: TokenHolder.fromAccountAddress(sender),
            denyList: true,
        };

        const token = createMockToken(decimals, moduleState, tokenId);

        // Setup sender account with sufficient balance
        const senderBalance = TokenAmount.create(BigInt(1000), decimals);

        // Create sender account info with deny list status
        const senderAccountState: TokenModuleAccountState = { denyList: true };
        const senderAccountInfo = createAccountInfo(sender, tokenId, senderBalance, senderAccountState);

        // Mock getAccountInfo to return sender on deny list
        token.grpc.getAccountInfo = jest
            .fn()
            .mockResolvedValueOnce(senderAccountInfo) // First call for balance check
            .mockResolvedValueOnce(createAccountInfo(recipient, tokenId)); // second call for recipient

        // Create transfer payload
        const transferAmount = TokenAmount.create(BigInt(500), decimals);
        const transfer: TokenTransfer = {
            amount: transferAmount,
            recipient: TokenHolder.fromAccountAddress(recipient),
        };

        // Should throw NotAllowedError
        await expect(Token.validateTransfer(token, sender, transfer)).rejects.toThrow(Token.NotAllowedError);
    });

    it('should throw NotAllowedError when account is not on allow list', async () => {
        const sender = ACCOUNT_1;
        const recipient = ACCOUNT_2;
        const tokenId = TokenId.fromString('3f1bfce9');
        const decimals = 8;

        // Setup token with allow list enabled
        const moduleState: TokenModuleState = {
            name: 'Test Token',
            metadata: TokenMetadataUrl.fromString('https://example.com/metadata'),
            governanceAccount: TokenHolder.fromAccountAddress(sender),
            allowList: true,
        };

        const token = createMockToken(decimals, moduleState, tokenId);

        // Setup sender account with sufficient balance
        const senderBalance = TokenAmount.create(BigInt(1000), decimals);

        // Create sender account info with allow list status set to true
        const senderAccountState: TokenModuleAccountState = { allowList: true };
        const senderAccountInfo = createAccountInfo(sender, tokenId, senderBalance, senderAccountState);

        // Create recipient account info with allow list status set to true
        const recipientAccountState: TokenModuleAccountState = { allowList: false };
        const recipientAccountInfo = createAccountInfo(recipient, tokenId, undefined, recipientAccountState);

        // Mock getAccountInfo to return sender not on allow list
        token.grpc.getAccountInfo = jest
            .fn()
            .mockResolvedValueOnce(senderAccountInfo) // First call for balance check
            .mockResolvedValueOnce(recipientAccountInfo); // second call for recipient

        // Create transfer payload
        const transferAmount = TokenAmount.create(BigInt(500), decimals);
        const transfer: TokenTransfer = {
            amount: transferAmount,
            recipient: TokenHolder.fromAccountAddress(recipient),
        };

        // Should throw NotAllowedError
        await expect(Token.validateTransfer(token, sender, transfer)).rejects.toThrow(Token.NotAllowedError);
    });

    it('should validate batch transfers when total amount is within balance', async () => {
        const sender = ACCOUNT_1;
        const recipient1 = ACCOUNT_2;
        const recipient2 = AccountAddress.fromBase58('3JLFF6RGoKNL8V8ycvuwXU3ZCNRKh78ytdr92pTb5GADnjeDnx');
        const tokenId = TokenId.fromString('3f1bfce9');
        const decimals = 8;

        const moduleState: TokenModuleState = {
            name: 'Test Token',
            metadata: TokenMetadataUrl.fromString('https://example.com/metadata'),
            governanceAccount: TokenHolder.fromAccountAddress(sender),
        };

        const token = createMockToken(decimals, moduleState, tokenId);

        // Setup sender account with sufficient balance
        const senderBalance = TokenAmount.create(BigInt(1000), decimals);
        const senderAccountInfo = createAccountInfo(sender, tokenId, senderBalance);

        // Mock getAccountInfo
        token.grpc.getAccountInfo = jest
            .fn()
            .mockResolvedValueOnce(senderAccountInfo) // For sender validation
            .mockResolvedValueOnce(createAccountInfo(recipient1, tokenId)) // For recipient1 validation
            .mockResolvedValueOnce(createAccountInfo(recipient2, tokenId)); // For recipient2 validation

        // Create batch transfer payload
        const transfers: TokenTransfer[] = [
            {
                amount: TokenAmount.create(BigInt(300), decimals),
                recipient: TokenHolder.fromAccountAddress(recipient1),
            },
            {
                amount: TokenAmount.create(BigInt(400), decimals),
                recipient: TokenHolder.fromAccountAddress(recipient2),
            },
        ];

        // Should validate successfully
        await expect(Token.validateTransfer(token, sender, transfers)).resolves.toBe(true);
    });
});

// Helper functions to create test data

function createMockToken(
    decimals: number,
    moduleState: TokenModuleState = {
        name: 'Test Token',
        metadata: TokenMetadataUrl.fromString('https://example.com/metadata'),
        governanceAccount: TokenHolder.fromAccountAddress(ACCOUNT_1),
    },
    tokenId: TokenId.Type = TokenId.fromString('3f1bfce9')
): Token.Type {
    return {
        info: {
            id: tokenId,
            state: {
                decimals,
                moduleState: moduleState === undefined ? undefined : Cbor.encode(moduleState),
            },
        },
        grpc: {
            getAccountInfo: jest.fn(),
        },
    } as unknown as Token.Type;
}

function createAccountInfo(
    accountAddress: AccountAddress.Type,
    tokenId: TokenId.Type,
    balance?: TokenAmount.Type,
    moduleState?: TokenModuleAccountState
): AccountInfo {
    return {
        accountAddress,
        accountTokens: [
            {
                id: tokenId,
                state: {
                    balance,
                    moduleState: moduleState ? Cbor.encode(moduleState) : undefined,
                },
            },
        ],
    } as AccountInfo;
}
