import { ConcordiumGRPCClient } from '../grpc/GRPCClient.js';
import { TokenId, TokenInfo, TokenModuleReference } from './types.js';

/**
 * Enum representing the types of errors that can occur when interacting with PLT instances through the client.
 */
export enum TokenClientErrorCode {
    /** Error type indicating the token ID does not match the module version expected by the client. */
    INCORRECT_MODULE_VERSION = 'INCORRECT_MODULE_VERSION',
}

/**
 * Error thrown while interacting with PLT instances through the client.
 */
export abstract class TokenClientError extends Error {
    public abstract readonly code: TokenClientErrorCode;
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
export class ModuleVersionMismatchError extends TokenClientError {
    public readonly code = TokenClientErrorCode.INCORRECT_MODULE_VERSION;

    constructor(
        public readonly expectedRef: TokenModuleReference.Type,
        foundRef: TokenModuleReference.Type
    ) {
        super(
            `Token module version mismatch. Expected token with module ref ${expectedRef}, found ${foundRef} during lookup.`
        );
    }
}

export class TokenClient {
    // The constructor needs to be public for the static functions to be able to return subclass instances.
    protected constructor(
        private readonly grpc: ConcordiumGRPCClient,
        public readonly tokenInfo: TokenInfo,
    ) {}

    /**
     * Verifies the token state by checking if the module reference of the token
     * matches the expected module reference of the client. If there is a mismatch,
     * a ModuleVersionMismatchError is thrown.
     *
     * @param {TokenModuleReference.Type} expected - The expected module reference to compare against.
     * @returns {Promise<void>} A promise that resolves if the module references match.
     * @throws {ModuleVersionMismatchError} If the module reference of the token does not match
     * the expected module reference.
     */
    public async verify(expected: TokenModuleReference.Type): Promise<void> {
        if (this.tokenInfo.state.moduleRef !== expected) {
            throw new ModuleVersionMismatchError(expected, this.tokenInfo.state.moduleRef);
        }
    }
}
