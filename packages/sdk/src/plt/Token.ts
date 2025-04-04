import { ConcordiumGRPCClient } from '../grpc/GRPCClient.js';
import { TokenId, TokenInfo, TokenModuleReference } from './types.js';

/**
 * Enum representing the types of errors that can occur when interacting with PLT instances through the client.
 */
export enum TokenErrorCode {
    /** Error type indicating the token ID does not match the module version expected by the client. */
    INCORRECT_MODULE_VERSION = 'INCORRECT_MODULE_VERSION',
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
 * @param {TokenModuleReference.Type} expected - The expected module reference to compare against.
 * @throws {ModuleVersionMismatchError} If the module reference of the token does not match
 * the expected module reference.
 */
export function verify(token: Token, expected: TokenModuleReference.Type): void {
    if (token.info.state.moduleRef !== expected) {
        throw new ModuleVersionMismatchError(expected, token.info.state.moduleRef);
    }
}
