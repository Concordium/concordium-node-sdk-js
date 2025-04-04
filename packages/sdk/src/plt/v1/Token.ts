import { ConcordiumGRPCClient } from '../../grpc/GRPCClient.js';
import { AccountAddress, TransactionHash } from '../../types.js';
import { Token, verify } from '../Token.js';
import { TokenId, TokenInfo } from '../types.js';
import { V1TokenTransfer, V1_TOKEN_MODULE_REF } from './types.js';

/**
 * Enum representing the types of errors that can occur when interacting with PLT instances through the client.
 */
export enum V1TokenErrorCode {
    /**
     * Error representing an attempt transfer funds to an account which is either not on the token allow list, or is on
     * the token deny list
     */
    NOT_ALLOWED = 'NOT_ALLOWED',
}

/**
 * Error thrown while interacting with PLT instances through the client.
 */
export abstract class V1TokenError extends Error {
    public abstract readonly code: V1TokenErrorCode;
    private _name: string = 'V1.TokenError';

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

class V1Token extends Token {
    // To enable the type checker to distiguish tokens from different modules
    private __type = 'V1.Token';

    public constructor(
        public readonly grpc: ConcordiumGRPCClient,
        public readonly info: TokenInfo
    ) {
        super(grpc, info);
        verify(this, V1_TOKEN_MODULE_REF); // Throws error if it fails
    }
}

export type Type = V1Token;

export async function fromId(grpc: ConcordiumGRPCClient, tokenId: TokenId.Type): Promise<V1Token> {
    const info = await grpc.getTokenInfo(tokenId);
    return new V1Token(grpc, info);
}

export function fromInfo(grpc: ConcordiumGRPCClient, tokenInfo: TokenInfo): V1Token {
    return new V1Token(grpc, tokenInfo);
}

export async function transfer(
    token: V1Token,
    sender: AccountAddress.Type,
    payload: V1TokenTransfer | [V1TokenTransfer]
): Promise<TransactionHash.Type> {
    throw new Error('Not implemented...');
}
