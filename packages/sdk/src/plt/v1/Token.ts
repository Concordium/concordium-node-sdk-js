import { ConcordiumGRPCClient } from '../../grpc/GRPCClient.js';
import { AccountAddress, AccountInfo, TransactionHash } from '../../pub/types.js';
import { AccountSigner } from '../../signHelpers.js';
import { TransactionExpiry } from '../../types/index.js';
import { bail } from '../../util.js';
import { Token as GenericToken, holderTransaction, validateAmount, verify } from '../Token.js';
import { TokenAmount, TokenId, TokenInfo } from '../index.js';
import {
    TOKEN_MODULE_REF,
    TokenHolderOperation,
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
 * Error type indicating an unauthorized governance operation was attempted.
 */
export class NotAllowedError extends TokenError {
    public readonly code = TokenErrorCode.NOT_ALLOWED;

    /**
     * Constructs a new NotAllowedError.
     * @param {AccountAddress.Type} receiver - The account address of the receiver.
     */
    constructor(public readonly receiver: AccountAddress.Type) {
        super(`Transfering funds to the receiver account specified is currently not allowed (${receiver}).`);
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
        verify(this, TOKEN_MODULE_REF); // Throws error if it fails
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
        return account.accountTokens.find((t) => t.id.symbol === token.info.id.symbol)?.state.balance;
    }

    return token.grpc.getAccountInfo(account).then((accInfo) => {
        return accInfo.accountTokens.find((t) => t.id.symbol === token.info.id.symbol)?.state.balance;
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

    // Check the sender balance.
    const senderBalance = (await balanceOf(token, sender)) ?? TokenAmount.zero(); // We fall back to zero, as the `token` has already been validated at this point.
    const payloadTotal = payloads.reduce(
        (acc, { amount }) => acc.add(TokenAmount.toDecimal(amount)),
        TokenAmount.toDecimal(TokenAmount.zero())
    );
    if (TokenAmount.toDecimal(senderBalance).lt(payloadTotal)) {
        throw new InsufficientFundsError(sender, TokenAmount.fromDecimal(payloadTotal, token.info.state.decimals));
    }

    // Check that all receivers are NOT on the deny list (if present), or that they are included in the allow list (if present).
    const receiverPromises = payloads.map((p) => token.grpc.getAccountInfo(p.recipient));
    const receivers = await Promise.all(receiverPromises);
    receivers.forEach((r) => {
        const accToken =
            r.accountTokens.find((t) => t.id.symbol === token.info.id.symbol) ??
            bail(new NotAllowedError(r.accountAddress));
        if (accToken.state.memberDenyList || accToken.state.memberAllowList === false) {
            throw new NotAllowedError(r.accountAddress);
        }
    });

    return true;
}

/**
 * Transfers tokens from the sender to the specified recipients.
 *
 * @param {Token} token - The token to transfer.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {TokenTransfer | [TokenTransfer]} payload - The transfer payload.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TransactionExpiry.Type} [expiry=TransactionExpiry.futureMinutes(5)] - The expiry time for the transaction.
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
    expiry: TransactionExpiry.Type = TransactionExpiry.futureMinutes(5)
): Promise<TransactionHash.Type> {
    await validateTransfer(token, sender, payload);

    const ops: TokenHolderOperation[] = [payload].flat().map((p) => ({ [TokenOperationType.Transfer]: p }));
    const encoded = createTokenHolderPayload(token.info.id, ops);

    return holderTransaction(token, sender, encoded, signer, expiry);
}
