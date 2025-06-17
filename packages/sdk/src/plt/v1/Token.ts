import { ConcordiumGRPCClient } from '../../grpc/GRPCClient.js';
import { AccountAddress, AccountInfo, TransactionHash } from '../../pub/types.js';
import { AccountSigner } from '../../signHelpers.js';
import { TransactionExpiry } from '../../types/index.js';
import { Token as GenericToken, holderTransaction, scaleAmount, validateAmount } from '../Token.js';
import { Cbor, TokenAmount, TokenId, TokenInfo } from '../index.js';
import {
    TokenHolderOperation,
    TokenModuleAccountState,
    TokenModuleState,
    TokenOperationType,
    TokenTransfer,
    createTokenHolderPayload,
} from './types.js';

/**
 * Enum representing the types of errors that can occur when interacting with PLT instances through the client.
 */
export enum TokenErrorCode {
    /**
     * Error representing an attempt transfer funds to an account which is either not on the token allow list, or is on
     * the token deny list
     */
    NOT_ALLOWED = 'NOT_ALLOWED',
    /** Error representing an attempt to transfer tokens from an account that does not have enough tokens to cover the
     * amount */
    INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
}

/**
 * Abstract class representing an error thrown while interacting with PLT instances through the client.
 */
export abstract class TokenError extends Error {
    public abstract readonly code: TokenErrorCode;
    private _name: string = 'V1.TokenError';

    /**
     * Constructs a new V1TokenError.
     * @param {string} message - The error message.
     */
    constructor(message: string) {
        super(message);
    }

    /**
     * Gets the name of the error, including its code.
     * @returns {string} The name of the error.
     */
    public override get name(): string {
        return `${this._name}.${this.code}`;
    }
}

/**
 * Error type indicating an attempt transfer funds to/from an account which is either not on the token allow list, or is on the token deny list
 */
export class NotAllowedError extends TokenError {
    public readonly code = TokenErrorCode.NOT_ALLOWED;

    /**
     * Constructs a new NotAllowedError.
     * @param {AccountAddress.Type} receiver - The account address of the receiver.
     */
    constructor(public readonly receiver: AccountAddress.Type) {
        super(
            `Transfering funds from or to the account specified is currently not allowed (${receiver}) because of the allow/deny list.`
        );
    }
}

/**
 * Error type indicating insufficient funds for a transaction.
 */
export class InsufficientFundsError extends TokenError {
    public readonly code = TokenErrorCode.INSUFFICIENT_FUNDS;

    /**
     * Constructs a new InsufficientFundsError.
     *
     * @param {AccountAddress.Type} sender - The account address of the sender.
     * @param {TokenAmount.Type} requiredAmount - The amount of tokens required for the transaction.
     */
    constructor(
        public readonly sender: AccountAddress.Type,
        public readonly requiredAmount: TokenAmount.Type
    ) {
        super(`Insufficient funds: Sender ${sender} requires at least ${requiredAmount} tokens.`);
    }
}

/**
 * Class representing a V1 token.
 */
class Token extends GenericToken {
    // We add a nominal type here to ensure that similar tokens from other module versions cannot be passed without
    // extending.
    #nominal = true;

    /**
     * Constructs a new V1Token.
     *
     * @param {ConcordiumGRPCClient} grpc - The gRPC client for interacting with the Concordium network.
     * @param {TokenInfo} info - Information about the token.
     */
    public constructor(
        public readonly grpc: ConcordiumGRPCClient,
        public readonly info: TokenInfo
    ) {
        super(grpc, info);
        // TODO: add verification which checks if the token is a v1 plt implementation.
    }
}

export type Type = Token;

/**
 * Creates a V1Token instance from a token ID.
 *
 * @param {ConcordiumGRPCClient} grpc - The gRPC client for interacting with the Concordium network.
 * @param {TokenId.Type} tokenId - The ID of the token.
 *
 * @returns {Promise<Token>} A promise that resolves to a V1Token instance.
 */
export async function fromId(grpc: ConcordiumGRPCClient, tokenId: TokenId.Type): Promise<Token> {
    const info = await grpc.getTokenInfo(tokenId);
    return new Token(grpc, info);
}

/**
 * Creates a V1Token instance from token information.
 *
 * @param {ConcordiumGRPCClient} grpc - The gRPC client for interacting with the Concordium network.
 * @param {TokenInfo} tokenInfo - Information about the token.
 *
 * @returns {Token} A V1Token instance.
 */
export function fromInfo(grpc: ConcordiumGRPCClient, tokenInfo: TokenInfo): Token {
    return new Token(grpc, tokenInfo);
}

export type BalanceOfResponse = TokenAmount.Type | undefined;

/**
 * Retrieves the balance of a token for a given account.
 *
 * @param {Token} token - The token to check the balance of.
 * @param {AccountInfo} accountInfo - The account to check the balance for.
 *
 * @returns {BalanceOfResponse} The balance of the token for the account.
 */
export function balanceOf(token: Token, accountInfo: AccountInfo): BalanceOfResponse;
/**
 * Retrieves the balance of a token for a given account.
 *
 * @param {Token} token - The token to check the balance of.
 * @param {AccountAddress.Type} accountAddress - The account to check the balance for.
 *
 * @returns {Promise<BalanceOfResponse>} The balance of the token for the account.
 */
export async function balanceOf(token: Token, accountAddress: AccountAddress.Type): Promise<BalanceOfResponse>;
/**
 * Retrieves the balance of a token for a given account.
 *
 * @param {Token} token - The token to check the balance of.
 * @param {AccountInfo | AccountAddress.Type} account - The account to check the balance for.
 *
 * @returns {Promise<BalanceOfResponse> | BalanceOfResponse} The balance of the token for the account.
 */
export function balanceOf(
    token: Token,
    account: AccountInfo | AccountAddress.Type
): Promise<BalanceOfResponse> | BalanceOfResponse {
    if (!AccountAddress.instanceOf(account)) {
        return account.accountTokens.find((t) => t.id.value === token.info.id.value)?.state.balance;
    }

    return token.grpc.getAccountInfo(account).then((accInfo) => {
        return accInfo.accountTokens.find((t) => t.id.value === token.info.id.value)?.state.balance;
    });
}

/**
 * Validates a token transfer.
 *
 * @param {Token} token - The token to transfer.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {TokenTransfer | [TokenTransfer]} payload - The transfer payload.
 *
 * @returns {Promise<true>} A promise that resolves to true if the transfer is valid.
 * @throws {InvalidTokenAmountError} If any token amount is not compatible with the token.
 * @throws {InsufficientFundsError} If the sender does not have enough tokens.
 * @throws {NotAllowedError} If a receiver is not allowed to receive tokens.
 */
export async function validateTransfer(
    token: Token,
    sender: AccountAddress.Type,
    payload: TokenTransfer | [TokenTransfer]
): Promise<true> {
    const payloads = [payload].flat();

    // Validate all amounts
    payloads.forEach((p) => validateAmount(token, p.amount));
    const { decimals } = token.info.state;

    // Check the sender balance.
    const senderBalance = (await balanceOf(token, sender)) ?? TokenAmount.zero(decimals); // We fall back to zero, as the `token` has already been validated at this point.
    const payloadTotal = payloads.reduce(
        (acc, { amount }) => acc.add(TokenAmount.toDecimal(amount)),
        TokenAmount.toDecimal(TokenAmount.zero(decimals))
    );
    if (TokenAmount.toDecimal(senderBalance).lt(payloadTotal)) {
        throw new InsufficientFundsError(sender, TokenAmount.fromDecimal(payloadTotal, decimals));
    }

    const moduleState = Cbor.decode(token.info.state.moduleState) as TokenModuleState;
    if (!moduleState.allowList && !moduleState.denyList) {
        // If the token neither has a deny list nor allow list, we can skip the check.
        return true;
    }

    // Check that sender and all receivers are NOT on the deny list (if present), or that they are included in the allow list (if present).
    const senderPromise = token.grpc.getAccountInfo(sender);
    const receiverPromises = payloads.map((p) => token.grpc.getAccountInfo(p.recipient));
    const accounts = await Promise.all([senderPromise, ...receiverPromises]);
    accounts.forEach((r) => {
        const accToken = r.accountTokens.find((t) => t.id.value === token.info.id.value)?.state;
        if (accToken?.moduleState === undefined) {
            return;
        }
        const moduleState = Cbor.decode(accToken.moduleState) as TokenModuleAccountState;
        if (moduleState.memberDenyList || moduleState.memberAllowList === false) {
            throw new NotAllowedError(r.accountAddress);
        }
    });

    return true;
}

type TransferOtions = {
    /** Whether to automatically scale a token amount to the correct number of decimals as the token */
    autoScale?: boolean;
    /** Whether to validate the payload executing it */
    validate?: boolean;
};

/**
 * Transfers tokens from the sender to the specified recipients.
 *
 * @param {Token} token - The token to transfer.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {TokenTransfer | [TokenTransfer]} payload - The transfer payload.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TransactionExpiry.Type} [expiry=TransactionExpiry.futureMinutes(5)] - The expiry time for the transaction.
 * @param {TransferOtions} [opts={ autoScale: true, validate: true }] - Options for the transfer.
 *
 * @returns {Promise<TransactionHash.Type>} A promise that resolves to the transaction hash.
 * @throws {InvalidTokenAmountError} If any token amount is not compatible with the token.
 * @throws {InsufficientFundsError} If the sender does not have enough tokens.
 * @throws {NotAllowedError} If a receiver is not allowed to receive tokens.
 */
export async function transfer(
    token: Token,
    sender: AccountAddress.Type,
    payload: TokenTransfer | [TokenTransfer],
    signer: AccountSigner,
    expiry: TransactionExpiry.Type = TransactionExpiry.futureMinutes(5),
    opts: TransferOtions = { autoScale: true, validate: true }
): Promise<TransactionHash.Type> {
    if (opts.validate) {
        await validateTransfer(token, sender, payload);
    }

    const ops: TokenHolderOperation[] = [payload].flat().map((p) => {
        const amount = opts.autoScale ? scaleAmount(token, p.amount) : p.amount;
        return {
            [TokenOperationType.Transfer]: { ...p, amount },
        };
    });
    const encoded = createTokenHolderPayload(token.info.id, ops);

    return holderTransaction(token, sender, encoded, signer, expiry);
}
