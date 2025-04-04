import { ConcordiumGRPCClient } from '../grpc/GRPCClient.js';
import { AccountAddress, TransactionHash } from '../types.js';
import { TokenAmount, TokenId, TokenInfo, TokenModuleReference } from './types.js';

/**
 * Enum representing the types of errors that can occur when interacting with PLT instances through the client.
 */
export enum TokenErrorCode {
    /** Error type indicating the token ID does not match the module version expected by the client. */
    INCORRECT_MODULE_VERSION = 'INCORRECT_MODULE_VERSION',
    /** Error type indicating the supplied token amount is not compatible with the token. */
    INVALID_TOKEN_AMOUNT = 'INVALID_TOKEN_AMOUNT',
    /** Error type indicating an unauthorized governance operation was attempted. */
    UNAUTHORIZED_GOVERNANCE_OPERATION = 'UNAUTHORIZED_GOVERNANCE_OPERATION',
}

/**
 * Error thrown while interacting with PLT instances through the client.
 */
export abstract class TokenError extends Error {
    public abstract readonly code: TokenErrorCode;
    private _name: string = 'TokenClientError';

    /**
     * @param {string} message - The error message.
     */
    constructor(message: string) {
        super(message);
    }

    public override get name() {
        return `${this._name}.${this.code}`;
    }
}

/** Error type indicating the token ID does not match the module version expected by the client. */
export class ModuleVersionMismatchError extends TokenError {
    public readonly code = TokenErrorCode.INCORRECT_MODULE_VERSION;

    constructor(
        public readonly expectedRef: TokenModuleReference.Type,
        foundRef: TokenModuleReference.Type
    ) {
        super(
            `Token module version mismatch. Expected token with module ref ${expectedRef}, found ${foundRef} during lookup.`
        );
    }
}

/** Error type indicating the supplied token amount is not compatible with the token. */
export class InvalidTokenAmountError extends TokenError {
    public readonly code = TokenErrorCode.INVALID_TOKEN_AMOUNT;

    constructor(
        public readonly tokenDecimals: number,
        public readonly amount: TokenAmount.Type
    ) {
        super(
            `The token amount supplied cannot be represented as an amount of the token. The amount is represented with ${amount.decimals}, while the token only allows amounts up to ${tokenDecimals}.`
        );
    }
}

/** Error type indicating an unauthorized governance operation was attempted. */
export class UnauthorizedGovernanceOperationError extends TokenError {
    public readonly code = TokenErrorCode.UNAUTHORIZED_GOVERNANCE_OPERATION;

    constructor(public readonly sender: AccountAddress.Type) {
        super(`Unauthorized governance operation attempted by account: ${sender}.`);
    }
}

export class Token {
    public constructor(
        public readonly grpc: ConcordiumGRPCClient,
        public readonly info: TokenInfo
    ) {}
}

export type Type = Token;

export async function fromId(grpc: ConcordiumGRPCClient, tokenId: TokenId.Type): Promise<Token> {
    const info = await grpc.getTokenInfo(tokenId);
    return new Token(grpc, info);
}

export function fromInfo(grpc: ConcordiumGRPCClient, tokenInfo: TokenInfo): Token {
    return new Token(grpc, tokenInfo);
}

/**
 * Verifies the token state by checking if the module reference of the token
 * matches the expected module reference of the client. If there is a mismatch,
 * a ModuleVersionMismatchError is thrown.
 *
 * @param {Token} token - The token to verify.
 * @param {TokenModuleReference.Type} expected - The expected module reference to compare against.
 * @throws {ModuleVersionMismatchError} If the module reference of the token does not match
 * the expected module reference.
 */
export function verify(token: Token, expected: TokenModuleReference.Type): void {
    if (token.info.state.moduleRef !== expected) {
        throw new ModuleVersionMismatchError(expected, token.info.state.moduleRef);
    }
}

/**
 * Validates if the given token amount is compatible with the token.
 *
 * @param {Token} token - The token to validate against.
 * @param {TokenAmount.Type} amount - The amount to validate.
 * @throws {InvalidTokenAmountError} If the token amount is not compatible with the token.
 */
export function validateAmount(token: Token, amount: TokenAmount.Type): void {
    if (amount.decimals > token.info.state.decimals) {
        throw new InvalidTokenAmountError(token.info.state.decimals, amount);
    }
}

export function holderTransaction(
    token: Token,
    sender: AccountAddress.Type,
    operations: [Uint8Array]
): Promise<TransactionHash.Type> {
    throw new Error('Not implemented...');
}

/**
 * Initiates a governance transaction for a given token.
 *
 * @param {Token} token - The token for which the governance transaction is being performed.
 * @param {AccountAddress.Type} sender - The account address initiating the transaction.
 * @param {[Uint8Array]} operations - The operations to be performed in the transaction.
 * @returns {Promise<TransactionHash.Type>} A promise that resolves to the transaction hash.
 * @throws {UnauthorizedGovernanceOperationError} If the sender is not the token issuer.
 */
export function governanceTransaction(
    token: Token,
    sender: AccountAddress.Type,
    operations: [Uint8Array]
): Promise<TransactionHash.Type> {
    // Check if the sender is the token issuer
    if (sender !== token.info.state.issuer) {
        throw new UnauthorizedGovernanceOperationError(sender);
    }

    // Implement the governance transaction logic here
    throw new Error('Not implemented...');
}
