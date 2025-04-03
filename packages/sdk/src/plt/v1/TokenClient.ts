import { ConcordiumGRPCClient } from '../../grpc/GRPCClient.js';
import * as AccountAddress from '../../types/AccountAddress.js';
import * as TransactionHash from '../../types/TransactionHash.js';
import { TokenClient } from '../Client.js';
import { TokenId, TokenInfo, TokenModuleReference, TokenState } from '../types.js';
import { V1TokenTransfer, V1_TOKEN_MODULE_REF } from './types.js';

/**
 * Enum representing the types of errors that can occur when interacting with PLT instances through the client.
 */
export enum V1TokenClientErrorCode {
    /** Error type indicating the token ID does not match the module version expected by the client. */
    INCORRECT_MODULE_VERSION = 'INCORRECT_MODULE_VERSION',
}

/**
 * Error thrown while interacting with PLT instances through the client.
 */
export abstract class V1TokenClientError extends Error {
    public abstract readonly code: V1TokenClientErrorCode;
    private _name: string = 'V1.TokenClientError';

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
export class ModuleVersionMismatchError extends V1TokenClientError {
    public readonly code = V1TokenClientErrorCode.INCORRECT_MODULE_VERSION;

    constructor(
        public readonly expectedRef: TokenModuleReference.Type,
        foundRef: TokenModuleReference.Type
    ) {
        super(
            `Token module version mismatch. Expected v1 token (module ref ${expectedRef}), found ${foundRef} during lookup.`
        );
    }
}

export class V1TokenClient extends TokenClient {
    private constructor(
        private readonly grpc: ConcordiumGRPCClient,
        public readonly tokenInfo: TokenInfo,
    ) {
        super(grpc, tokenInfo);
        this.verify(V1_TOKEN_MODULE_REF); // Throws error if it fails
    }

    public static async fromId(grpc: ConcordiumGRPCClient, tokenId: TokenId.Type): Promise<V1TokenClient> {
        const info = await grpc.getTokenInfo(tokenId);
        return new V1TokenClient(grpc, info);
    }

    public static fromInfo(grpc: ConcordiumGRPCClient, tokenInfo: TokenInfo): V1TokenClient {
        return new V1TokenClient(grpc, tokenInfo);
    }

    public async transfer(sender: AccountAddress.Type, payload: V1TokenTransfer): Promise<TransactionHash.Type> {
        throw new Error('Not implemented...');
    }
}
