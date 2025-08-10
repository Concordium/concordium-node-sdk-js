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
            paused: false,
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
            paused: false,
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
            paused: false,
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
            .mockResolvedValueOnce(senderAccountInfo) // First call for sender
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

    it('should validate successfully for tokens with deny list when account does not have a balance', async () => {
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
            paused: false,
        };

        const token = createMockToken(decimals, moduleState, tokenId);

        // Setup sender account with sufficient balance
        const senderBalance = TokenAmount.create(BigInt(1000), decimals);

        // Create sender account info with deny list status
        const senderAccountState: TokenModuleAccountState = { denyList: false };
        const senderAccountInfo = createAccountInfo(sender, tokenId, senderBalance, senderAccountState);

        // Mock getAccountInfo to return sender on deny list
        token.grpc.getAccountInfo = jest
            .fn()
            .mockResolvedValueOnce(senderAccountInfo) // First call for balance check
            .mockResolvedValueOnce(createAccountInfo(recipient)); // second call for recipient, no token balance.

        // Create transfer payload
        const transferAmount = TokenAmount.create(BigInt(500), decimals);
        const transfer: TokenTransfer = {
            amount: transferAmount,
            recipient: TokenHolder.fromAccountAddress(recipient),
        };

        await expect(Token.validateTransfer(token, sender, transfer)).resolves.toBe(true);
    });

    it('should throw NotAllowedError for tokens with allow list when account does not have a balance', async () => {
        const sender = ACCOUNT_1;
        const recipient = ACCOUNT_2;
        const tokenId = TokenId.fromString('3f1bfce9');
        const decimals = 8;

        // Setup token with deny list enabled
        const moduleState: TokenModuleState = {
            name: 'Test Token',
            metadata: TokenMetadataUrl.fromString('https://example.com/metadata'),
            governanceAccount: TokenHolder.fromAccountAddress(sender),
            allowList: true,
            paused: false,
        };

        const token = createMockToken(decimals, moduleState, tokenId);

        // Setup sender account with sufficient balance
        const senderBalance = TokenAmount.create(BigInt(1000), decimals);

        // Create sender account info with deny list status
        const senderAccountState: TokenModuleAccountState = { allowList: true };
        const senderAccountInfo = createAccountInfo(sender, tokenId, senderBalance, senderAccountState);

        // Mock getAccountInfo to return sender on deny list
        token.grpc.getAccountInfo = jest
            .fn()
            .mockResolvedValueOnce(senderAccountInfo) // First call for balance check
            .mockResolvedValueOnce(createAccountInfo(recipient)); // second call for recipient, no token balance.

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
            paused: false,
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
            .mockResolvedValueOnce(senderAccountInfo) // First call for sender
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
            paused: false,
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

    it('should throw PausedError when the token is paused', async () => {
        const sender = ACCOUNT_1;
        const recipient = ACCOUNT_2;
        const tokenId = TokenId.fromString('3f1bfce9');
        const decimals = 8;

        // Setup token with token paused state `true`
        const moduleState: TokenModuleState = {
            name: 'Test Token',
            metadata: TokenMetadataUrl.fromString('https://example.com/metadata'),
            paused: true,
            governanceAccount: TokenHolder.fromAccountAddress(sender),
        };

        const token = createMockToken(decimals, moduleState, tokenId);

        // Setup sender account with sufficient balance
        const senderBalance = TokenAmount.create(BigInt(1000), decimals);
        const senderAccountInfo = createAccountInfo(sender, tokenId, senderBalance);
        const recipientAccountInfo = createAccountInfo(recipient, tokenId, undefined);

        // Mock getAccountInfo
        token.grpc.getAccountInfo = jest
            .fn()
            .mockResolvedValueOnce(senderAccountInfo) // First call for sender
            .mockResolvedValueOnce(recipientAccountInfo); // second call for recipient

        // Create transfer payload
        const transferAmount = TokenAmount.create(BigInt(500), decimals);
        const transfer: TokenTransfer = {
            amount: transferAmount,
            recipient: TokenHolder.fromAccountAddress(recipient),
        };

        // Should throw UnsupportedOperationError
        await expect(Token.validateTransfer(token, sender, transfer)).rejects.toThrow(Token.PausedError);
    });
});

describe('Token.validateMint', () => {
    it('should throw NotMintableError when the token is not mintable', async () => {
        const sender = ACCOUNT_1;
        const tokenId = TokenId.fromString('3f1bfce9');
        const decimals = 8;

        // Setup non mintable token
        const moduleState: TokenModuleState = {
            name: 'Test Token',
            metadata: TokenMetadataUrl.fromString('https://example.com/metadata'),
            mintable: false,
            governanceAccount: TokenHolder.fromAccountAddress(sender),
        };

        const token = createMockToken(decimals, moduleState, tokenId);
        const amount = TokenAmount.create(BigInt(1000), decimals);


        await expect(Token.validateMint(token, amount)).rejects.toThrow(Token.NotMintableError);
    });
});

describe('Token.validateBurn', () => {
    it('should throw NotBurnableError when the token is not burnable', async () => {
        const sender = ACCOUNT_1;
        const tokenId = TokenId.fromString('3f1bfce9');
        const decimals = 8;

        // Setup non burnable token
        const moduleState: TokenModuleState = {
            name: 'Test Token',
            metadata: TokenMetadataUrl.fromString('https://example.com/metadata'),
            burnable: false,
            governanceAccount: TokenHolder.fromAccountAddress(sender),
        };

        const token = createMockToken(decimals, moduleState, tokenId);
        const amount = TokenAmount.create(BigInt(1000), decimals);


        await expect(Token.validateBurn(token, amount, sender)).rejects.toThrow(Token.NotBurnableError);
    });
});

describe('Token.validateAllowListUpdate', () => {
    it('should throw NoAllowListError when the token has no allow list', async () => {
        const sender = ACCOUNT_1;
        const tokenId = TokenId.fromString('3f1bfce9');
        const decimals = 8;

        const moduleState: TokenModuleState = {
            name: 'Test Token',
            metadata: TokenMetadataUrl.fromString('https://example.com/metadata'),
            allowList: false,
            governanceAccount: TokenHolder.fromAccountAddress(sender),
        };

        const token = createMockToken(decimals, moduleState, tokenId);

        await expect(Token.validateAllowListUpdate(token)).rejects.toThrow(Token.NoAllowListError);
    });
});

describe('Token.validateDenyListUpdate', () => {
    it('should throw NoDenyListError when the token has no deny list', async () => {
        const sender = ACCOUNT_1;
        const tokenId = TokenId.fromString('3f1bfce9');
        const decimals = 8;

        const moduleState: TokenModuleState = {
            name: 'Test Token',
            metadata: TokenMetadataUrl.fromString('https://example.com/metadata'),
            denyList: false,
            governanceAccount: TokenHolder.fromAccountAddress(sender),
        };

        const token = createMockToken(decimals, moduleState, tokenId);

        await expect(Token.validateDenyListUpdate(token)).rejects.toThrow(Token.NoDenyListError);
    });
});

describe('Token update supply operation', () => {
    it('should throw PausedError when trying to mint/burn tokens while token is paused', async () => {
        const governanceAddress = ACCOUNT_1;
        const tokenId = TokenId.fromString('3f1bfce9');
        const decimals = 8;
        const signer = undefined as any;

        // Setup token with paused state true
        const moduleState: TokenModuleState = {
            name: 'Test Token',
            metadata: TokenMetadataUrl.fromString('https://example.com/metadata'),
            paused: true,
            governanceAccount: TokenHolder.fromAccountAddress(governanceAddress),
        };

        const token = createMockToken(decimals, moduleState, tokenId);
        const amount = TokenAmount.create(BigInt(1000), decimals);

        // Should throw PausedError
        await expect(
            Token.mint(token, governanceAddress, amount, signer, undefined, { validate: true })
        ).rejects.toThrow(Token.PausedError);
        await expect(
            Token.burn(token, governanceAddress, amount, signer, undefined, { validate: true })
        ).rejects.toThrow(Token.PausedError);
    });
});

// Helper functions to create test data

function createMockToken(
    decimals: number,
    moduleState: TokenModuleState = {
        name: 'Test Token',
        metadata: TokenMetadataUrl.fromString('https://example.com/metadata'),
        paused: false,
        governanceAccount: TokenHolder.fromAccountAddress(ACCOUNT_1),
    },
    tokenId: TokenId.Type = TokenId.fromString('3f1bfce9')
): Token.Type {
    const mockToken = {
        _info: {
            id: tokenId,
            state: {
                decimals,
                moduleState: moduleState === undefined ? undefined : Cbor.encode(moduleState),
            },
        },
        grpc: {
            getAccountInfo: jest.fn(),
        },
        moduleState,
        update: async () => mockToken,
    };

    return mockToken as unknown as Token.Type;
}

function createAccountInfo(
    accountAddress: AccountAddress.Type,
    tokenId?: TokenId.Type,
    balance?: TokenAmount.Type,
    moduleState?: TokenModuleAccountState
): AccountInfo {
    const accountTokens = tokenId
        ? [{ id: tokenId, state: { balance, moduleState: moduleState ? Cbor.encode(moduleState) : undefined } }]
        : [];
    return { accountAddress, accountTokens } as AccountInfo;
}
