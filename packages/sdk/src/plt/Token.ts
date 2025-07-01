import { ConcordiumGRPCClient } from '../grpc/GRPCClient.js';
import {
    AccountAddress,
    AccountInfo,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionType,
    TokenUpdatePayload,
    TransactionExpiry,
    TransactionHash,
} from '../pub/types.js';
import { AccountSigner, signTransaction } from '../signHelpers.js';
import { bail } from '../util.ts';
import { Cbor, TokenAmount, TokenHolder, TokenId, TokenInfo, TokenModuleReference } from './index.js';
import {
    TokenAddAllowListOperation,
    TokenAddDenyListOperation,
    TokenBurnOperation,
    TokenMintOperation,
    TokenModuleAccountState,
    TokenModuleState,
    TokenOperation,
    TokenOperationType,
    TokenPauseOperation,
    TokenRemoveAllowListOperation,
    TokenRemoveDenyListOperation,
    TokenTransfer,
    TokenTransferOperation,
    createTokenUpdatePayload,
} from './module.js';

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
    /**
     * Error representing an attempt transfer funds to an account which is either not on the token allow list, or is on
     * the token deny list
     */
    NOT_ALLOWED = 'NOT_ALLOWED',
    /** Error representing an attempt to transfer tokens from an account that does not have enough tokens to cover the
     * amount */
    INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
    PAUSED = 'PAUSED',
}

/**
 * Error thrown while interacting with PLT instances through the client.
 */
export abstract class TokenError extends Error {
    public abstract readonly code: TokenErrorCode;
    private _name: string = 'TokenClientError';

    /**
     * Constructs a new TokenError.
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

/** Error type indicating the token ID does not match the module version expected by the client. */
export class ModuleVersionMismatchError extends TokenError {
    public readonly code = TokenErrorCode.INCORRECT_MODULE_VERSION;

    /**
     * Constructs a new ModuleVersionMismatchError.
     * @param {TokenModuleReference.Type} expectedRef - The expected module reference.
     * @param {TokenModuleReference.Type} foundRef - The found module reference.
     */
    constructor(
        public readonly expectedRef: TokenModuleReference.Type,
        public readonly foundRef: TokenModuleReference.Type
    ) {
        super(
            `Token module version mismatch. Expected token with module ref ${expectedRef}, found ${foundRef} during lookup.`
        );
    }
}

/** Error type indicating the supplied token amount is not compatible with the token. */
export class InvalidTokenAmountError extends TokenError {
    public readonly code = TokenErrorCode.INVALID_TOKEN_AMOUNT;

    /**
     * Constructs a new InvalidTokenAmountError.
     * @param {number} tokenDecimals - The number of decimals the token supports.
     * @param {TokenAmount.Type} amount - The token amount that is invalid.
     */
    constructor(
        public readonly tokenDecimals: number,
        public readonly amount: TokenAmount.Type
    ) {
        super(
            `The token amount supplied cannot be represented as an amount of the token. The amount is represented with ${amount.decimals} decimals, while the token requires ${tokenDecimals} decimals.`
        );
    }
}

/** Error type indicating an unauthorized governance operation was attempted. */
export class UnauthorizedGovernanceOperationError extends TokenError {
    public readonly code = TokenErrorCode.UNAUTHORIZED_GOVERNANCE_OPERATION;

    /**
     * Constructs a new UnauthorizedGovernanceOperationError.
     * @param {AccountAddress.Type} sender - The account address attempting the unauthorized operation.
     */
    constructor(public readonly sender: AccountAddress.Type) {
        super(`Unauthorized governance operation attempted by account: ${sender}.`);
    }
}

/**
 * Error type indicating an attempt transfer funds to/from an account which is either not on the token allow list, or is on the token deny list
 */
export class NotAllowedError extends TokenError {
    public readonly code = TokenErrorCode.NOT_ALLOWED;

    /**
     * Constructs a new NotAllowedError.
     * @param {TokenHolder.Type} receiver - The account address of the receiver.
     */
    constructor(public readonly receiver: TokenHolder.Type) {
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
 * Error type indicating that the token is paused.
 */
export class TokenPausedError extends TokenError {
    public readonly code = TokenErrorCode.PAUSED;

    /**
     * Constructs a new TokenPausedError.
     *
     * @param {TokenId.Type} tokenId - The ID of the token.
     */
    constructor(public readonly tokenId: TokenId.Type) {
        super(`Token ${tokenId} is paused.`);
    }
}

/**
 * Class representing a token.
 */
class Token {
    /**
     * Constructs a new Token.
     * @param {ConcordiumGRPCClient} grpc - The gRPC client for interacting with the Concordium network.
     * @param {TokenInfo} info - Information about the token.
     */
    public constructor(
        public readonly grpc: ConcordiumGRPCClient,
        public readonly info: TokenInfo
    ) {}
}

export type Type = Token;

/**
 * Creates a Token instance from a token ID.
 * @param {ConcordiumGRPCClient} grpc - The gRPC client for interacting with the Concordium network.
 * @param {TokenId.Type} tokenId - The ID of the token.
 * @returns {Promise<Token>} A promise that resolves to a Token instance.
 */
export async function fromId(grpc: ConcordiumGRPCClient, tokenId: TokenId.Type): Promise<Token> {
    const info = await grpc.getTokenInfo(tokenId);
    return new Token(grpc, info);
}

/**
 * Creates a Token instance from token information.
 * @param {ConcordiumGRPCClient} grpc - The gRPC client for interacting with the Concordium network.
 * @param {TokenInfo} tokenInfo - Information about the token.
 * @returns {Token} A Token instance.
 */
export function fromInfo(grpc: ConcordiumGRPCClient, tokenInfo: TokenInfo): Token {
    return new Token(grpc, tokenInfo);
}

/**
 * Validates if the given token amount is compatible with the token.
 *
 * @param {Token} token - The token to validate against.
 * @param {TokenAmount.Type} amount - The amount to validate.

 * @returns {true} If the amount is valid within the context of the token.
 * @throws {InvalidTokenAmountError} If the token amount is not compatible with the token.
 */
export function validateAmount(token: Token, amount: TokenAmount.Type): true {
    if (amount.decimals === token.info.state.decimals) {
        return true;
    }
    throw new InvalidTokenAmountError(token.info.state.decimals, amount);
}

/**
 * Scales a token amount with fewer decimals to the token's decimal representation.
 *
 * @param {Token} token - The token to scale the amount for.
 * @param {TokenAmount.Type} amount - The amount to scale.
 * @returns {TokenAmount.Type} The scaled token amount.
 * @throws {InvalidTokenAmountError} If the token amount is not compatible with the token.
 */
export function scaleAmount(token: Token, amount: TokenAmount.Type): TokenAmount.Type {
    if (amount.decimals === token.info.state.decimals) {
        return amount;
    }
    if (amount.decimals > token.info.state.decimals) {
        throw new InvalidTokenAmountError(token.info.state.decimals, amount);
    }

    return TokenAmount.create(
        amount.value * 10n ** BigInt(token.info.state.decimals - amount.decimals),
        token.info.state.decimals
    );
}

/**
 * Initiates a transaction for a given token.
 *
 * This function creates and sends a transaction of type `TokenUpdate` for the specified token.
 *
 * @param {Token} token - The token for which the transaction is being performed.
 * @param {AccountAddress.Type} sender - The account address initiating the transaction.
 * @param {TokenUpdatePayload} payload - The transaction payload.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TransactionExpiry.Type} [expiry=TransactionExpiry.futureMinutes(5)] - The expiry time for the transaction.
 *
 * @returns {Promise<TransactionHash.Type>} A promise that resolves to the transaction hash.
 */
export async function sendRaw(
    token: Token,
    sender: AccountAddress.Type,
    payload: TokenUpdatePayload,
    signer: AccountSigner,
    expiry: TransactionExpiry.Type = TransactionExpiry.futureMinutes(5)
): Promise<TransactionHash.Type> {
    const { nonce } = await token.grpc.getNextAccountNonce(sender);
    const header: AccountTransactionHeader = {
        expiry,
        nonce: nonce,
        sender,
    };
    const transaction: AccountTransaction = {
        type: AccountTransactionType.TokenUpdate,
        payload,
        header,
    };
    const signature = await signTransaction(transaction, signer);
    return token.grpc.sendAccountTransaction(transaction, signature);
}

/**
 * The response type for the `balanceOf` function.
 */
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

    return token.grpc.getAccountInfo(account).then((accInfo) => balanceOf(token, accInfo));
}

/**
 * Checks if a token is paused.
 *
 * @param {Token} token - The token to check.
 *
 * @returns {boolean} True if the token is paused, false otherwise.
 */
export function isPaused(token: Token): boolean {
    const state = Cbor.decode(token.info.state.moduleState, 'TokenModuleState');
    return state.paused;
}

/**
 * Validates a token transfer.
 *
 * @param {Token} token - The token to transfer.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {TokenTransfer | TokenTransfer[]} payload - The transfer payload.
 *
 * @returns {Promise<true>} A promise that resolves to true if the transfer is valid.
 * @throws {InvalidTokenAmountError} If any token amount is not compatible with the token.
 * @throws {InsufficientFundsError} If the sender does not have enough tokens.
 * @throws {NotAllowedError} If the sender or receiver is not allowed to send/receive tokens.
 */
export async function validateTransfer(
    token: Token,
    sender: AccountAddress.Type,
    payload: TokenTransfer | TokenTransfer[]
): Promise<true> {
    isPaused(token) && bail(new TokenPausedError(token.info.id));

    const payloads = [payload].flat();

    // Validate all amounts
    payloads.forEach((p) => validateAmount(token, p.amount));

    const { decimals } = token.info.state;
    const senderInfo = await token.grpc.getAccountInfo(sender);

    // Check the sender balance.
    const senderBalance = balanceOf(token, senderInfo) ?? TokenAmount.zero(decimals); // We fall back to zero, as the `token` has already been validated at this point.
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
    const receiverInfos = await Promise.all(payloads.map((p) => token.grpc.getAccountInfo(p.recipient.address)));
    const accounts = [senderInfo, ...receiverInfos];
    accounts.forEach((r) => {
        const accToken = r.accountTokens.find((t) => t.id.value === token.info.id.value)?.state;
        if (accToken?.moduleState === undefined)
            throw new NotAllowedError(TokenHolder.fromAccountAddress(r.accountAddress));

        const accountModuleState = Cbor.decode(accToken.moduleState) as TokenModuleAccountState;
        if (moduleState.allowList && !accountModuleState.allowList)
            throw new NotAllowedError(TokenHolder.fromAccountAddress(r.accountAddress));
        if (moduleState.denyList && accountModuleState.denyList)
            throw new NotAllowedError(TokenHolder.fromAccountAddress(r.accountAddress));
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
 * @param {TokenTransfer | TokenTransfer[]} payload - The transfer payload.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TransactionExpiry.Type} [expiry=TransactionExpiry.futureMinutes(5)] - The expiry time for the transaction.
 * @param {TransferOtions} [opts={ autoScale: true, validate: true }] - Options for the transfer.
 *
 * @returns {Promise<TransactionHash.Type>} A promise that resolves to the transaction hash.
 * @throws {InvalidTokenAmountError} If `opts.validate` and any token amount is not compatible with the token.
 * @throws {InsufficientFundsError} If `opts.validate` and the sender does not have enough tokens.
 * @throws {NotAllowedError} If `opts.validate` and a sender or receiver is not allowed to send/receive tokens.
 */
export async function transfer(
    token: Token,
    sender: AccountAddress.Type,
    payload: TokenTransfer | TokenTransfer[],
    signer: AccountSigner,
    expiry: TransactionExpiry.Type = TransactionExpiry.futureMinutes(5),
    { autoScale = true, validate = true }: TransferOtions = {}
): Promise<TransactionHash.Type> {
    let transfers: TokenTransfer[] = [payload].flat();
    if (autoScale) {
        transfers = transfers.map((p) => ({ ...p, amount: scaleAmount(token, p.amount) }));
    }

    if (validate) {
        await validateTransfer(token, sender, transfers);
    }

    const ops: TokenTransferOperation[] = transfers.map((p) => ({ [TokenOperationType.Transfer]: p }));
    const encoded = createTokenUpdatePayload(token.info.id, ops);
    return sendRaw(token, sender, encoded, signer, expiry);
}

/**
 * Validates that the sender is authorized to perform governance operations on the token.
 *
 * @param {Token} token - The token to validate governance operations for.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 *
 * @returns {true} If the sender is authorized.
 * @throws {UnauthorizedGovernanceOperationError} If the sender is not the governance account of the token.
 */
export function validateGovernanceOperation(token: Token, sender: AccountAddress.Type): true {
    const { governanceAccount } = Cbor.decode(token.info.state.moduleState) as TokenModuleState;
    if (!AccountAddress.equals(sender, governanceAccount.address)) {
        throw new UnauthorizedGovernanceOperationError(sender);
    }

    return true;
}

type SupplyUpdateOptions = {
    /** Whether to automatically scale a token amount to the correct number of decimals as the token */
    autoScale?: boolean;
    /** Whether to validate the payload executing it */
    validate?: boolean;
};

/**
 * Mints a specified amount of tokens.
 *
 * @param {Token} token - The token to mint.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {TokenAmount.Type | TokenAmount.Type[]} amounts - The amount(s) of tokens to mint.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TransactionExpiry.Type} [expiry=TransactionExpiry.futureMinutes(5)] - The expiry time for the transaction.
 * @param {SupplyUpdateOptions} [opts={ autoScale: true, validate: true }] - Options for supply update operations.
 *
 * @returns A promise that resolves to the transaction hash.
 * @throws {InvalidTokenAmountError} If `opts.validate` and the token amount is not compatible with the token.
 * @throws {UnauthorizedGovernanceOperationError} If `opts.validate` and the sender is not the token issuer.
 */
export async function mint(
    token: Token,
    sender: AccountAddress.Type,
    amounts: TokenAmount.Type | TokenAmount.Type[],
    signer: AccountSigner,
    expiry: TransactionExpiry.Type = TransactionExpiry.futureMinutes(5),
    { autoScale = true, validate = true }: SupplyUpdateOptions = {}
): Promise<TransactionHash.Type> {
    let amountsList = [amounts].flat();
    if (autoScale) {
        amountsList = amountsList.map((amount) => scaleAmount(token, amount));
    }

    if (validate) {
        isPaused(token) && bail(new TokenPausedError(token.info.id));
        validateGovernanceOperation(token, sender);
        amountsList.forEach((amount) => validateAmount(token, amount));
    }

    const ops: TokenMintOperation[] = amountsList.map((amount) => ({
        [TokenOperationType.Mint]: { amount },
    }));
    return sendOperations(token, sender, ops, signer, expiry);
}

/**
 * Burns a specified amount of tokens.
 *
 * @param {Token} token - The token to burn.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {TokenAmount.Type | TokenAmount.Type[]} amounts - The amount(s) of tokens to burn.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TransactionExpiry.Type} [expiry=TransactionExpiry.futureMinutes(5)] - The expiry time for the transaction.
 * @param {SupplyUpdateOptions} [opts={ autoScale: true, validate: true }] - Options for supply update operations.
 *
 * @returns A promise that resolves to the transaction hash.
 * @throws {InvalidTokenAmountError} If `opts.validate` and the token amount is not compatible with the token.
 * @throws {UnauthorizedGovernanceOperationError} If `opts.validate` and the sender is not the token issuer.
 */
export async function burn(
    token: Token,
    sender: AccountAddress.Type,
    amounts: TokenAmount.Type | TokenAmount.Type[],
    signer: AccountSigner,
    expiry: TransactionExpiry.Type = TransactionExpiry.futureMinutes(5),
    { autoScale = true, validate = true }: SupplyUpdateOptions = {}
): Promise<TransactionHash.Type> {
    let amountsList = [amounts].flat();
    if (autoScale) {
        amountsList = amountsList.map((amount) => scaleAmount(token, amount));
    }

    if (validate) {
        isPaused(token) && bail(new TokenPausedError(token.info.id));
        validateGovernanceOperation(token, sender);
        amountsList.forEach((amount) => validateAmount(token, amount));
    }

    const ops: TokenBurnOperation[] = amountsList.map((amount) => ({
        [TokenOperationType.Burn]: { amount },
    }));
    return sendOperations(token, sender, ops, signer, expiry);
}

type UpdateListOptions = {
    /** Whether to validate the payload executing it */
    validate?: boolean;
};

/**
 * Adds an account to the allow list of a token.
 *
 * @param {Token} token - The token for which to add the list entry.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {TokenHolder.Type | TokenHolder.Type[]} targets - The account address(es) to be added to the list.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TransactionExpiry.Type} [expiry=TransactionExpiry.futureMinutes(5)] - The expiry time for the transaction.
 * @param {UpdateListOptions} [opts={ validate: true }] - Options for updating the allow/deny list.
 *
 * @returns A promise that resolves to the transaction hash.
 * @throws {UnauthorizedGovernanceOperationError} If `opts.validate` and the sender is not the token issuer.
 */
export async function addAllowList(
    token: Token,
    sender: AccountAddress.Type,
    targets: TokenHolder.Type | TokenHolder.Type[],
    signer: AccountSigner,
    expiry: TransactionExpiry.Type = TransactionExpiry.futureMinutes(5),
    { validate = true }: UpdateListOptions = {}
): Promise<TransactionHash.Type> {
    if (validate) {
        validateGovernanceOperation(token, sender);
    }

    const ops: TokenAddAllowListOperation[] = [targets]
        .flat()
        .map((target) => ({ [TokenOperationType.AddAllowList]: { target } }));
    return sendOperations(token, sender, ops, signer, expiry);
}

/**
 * Removes an account from the allow list of a token.
 *
 * @param {Token} token - The token for which to add the list entry.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {TokenHolder.Type | TokenHolder.Type[]} targets - The account address(es) to be added to the list.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TransactionExpiry.Type} [expiry=TransactionExpiry.futureMinutes(5)] - The expiry time for the transaction.
 * @param {UpdateListOptions} [opts={ validate: true }] - Options for updating the allow/deny list.
 *
 * @returns A promise that resolves to the transaction hash.
 * @throws {UnauthorizedGovernanceOperationError} If `opts.validate` and the sender is not the token issuer.
 */
export async function removeAllowList(
    token: Token,
    sender: AccountAddress.Type,
    targets: TokenHolder.Type | TokenHolder.Type[],
    signer: AccountSigner,
    expiry: TransactionExpiry.Type = TransactionExpiry.futureMinutes(5),
    { validate = true }: UpdateListOptions = {}
): Promise<TransactionHash.Type> {
    if (validate) {
        validateGovernanceOperation(token, sender);
    }

    const ops: TokenRemoveAllowListOperation[] = [targets]
        .flat()
        .map((target) => ({ [TokenOperationType.RemoveAllowList]: { target } }));
    return sendOperations(token, sender, ops, signer, expiry);
}

/**
 * Adds an account to the deny list of a token.
 *
 * @param {Token} token - The token for which to add the list entry.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {TokenHolder.Type | TokenHolder.Type[]} targets - The account address(es) to be added to the list.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TransactionExpiry.Type} [expiry=TransactionExpiry.futureMinutes(5)] - The expiry time for the transaction.
 * @param {UpdateListOptions} [opts={ validate: true }] - Options for updating the allow/deny list.
 *
 * @returns A promise that resolves to the transaction hash.
 * @throws {UnauthorizedGovernanceOperationError} If `opts.validate` and the sender is not the token issuer.
 */
export async function addDenyList(
    token: Token,
    sender: AccountAddress.Type,
    targets: TokenHolder.Type | TokenHolder.Type[],
    signer: AccountSigner,
    expiry: TransactionExpiry.Type = TransactionExpiry.futureMinutes(5),
    { validate = true }: UpdateListOptions = {}
): Promise<TransactionHash.Type> {
    if (validate) {
        validateGovernanceOperation(token, sender);
    }

    const ops: TokenAddDenyListOperation[] = [targets]
        .flat()
        .map((target) => ({ [TokenOperationType.AddDenyList]: { target } }));
    return sendOperations(token, sender, ops, signer, expiry);
}

/**
 * Removes an account from the deny list of a token.
 *
 * @param {Token} token - The token for which to add the list entry.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {TokenHolder.Type | TokenHolder.Type[]} targets - The account address(es) to be added to the list.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TransactionExpiry.Type} [expiry=TransactionExpiry.futureMinutes(5)] - The expiry time for the transaction.
 * @param {UpdateListOptions} [opts={ validate: true }] - Options for updating the allow/deny list.
 *
 * @returns A promise that resolves to the transaction hash.
 * @throws {UnauthorizedGovernanceOperationError} If `opts.validate` and the sender is not the token issuer.
 */
export async function removeDenyList(
    token: Token,
    sender: AccountAddress.Type,
    targets: TokenHolder.Type | TokenHolder.Type[],
    signer: AccountSigner,
    expiry: TransactionExpiry.Type = TransactionExpiry.futureMinutes(5),
    { validate = true }: UpdateListOptions = {}
): Promise<TransactionHash.Type> {
    if (validate) {
        validateGovernanceOperation(token, sender);
    }

    const ops: TokenRemoveDenyListOperation[] = [targets]
        .flat()
        .map((target) => ({ [TokenOperationType.RemoveDenyList]: { target } }));
    return sendOperations(token, sender, ops, signer, expiry);
}

/**
 * Options to be passed to the {@linkcode pause} function.
 */
export type PauseOptions = {
    /** Whether to validate the payload executing it */
    validate?: boolean;
};

/**
 * Pauses or unpauses execution of "mint", "burn", and "transfer" operations for the token.
 *
 * @param {Token} token - The token to pause/unpause.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {boolean} pause - Whether to pause or unpause the token.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TransactionExpiry.Type} [expiry=TransactionExpiry.futureMinutes(5)] - The expiry time for the transaction.
 * @param {PauseOptions} [opts={ validate: true }] - Options for the pause operation.
 *
 * @returns A promise that resolves to the transaction hash.
 * @throws {UnauthorizedGovernanceOperationError} If `opts.validate` and the sender is not the token issuer.
 */
export async function pause(
    token: Token,
    sender: AccountAddress.Type,
    pause: boolean,
    signer: AccountSigner,
    expiry: TransactionExpiry.Type = TransactionExpiry.futureMinutes(5),
    { validate = true }: PauseOptions = {}
): Promise<TransactionHash.Type> {
    if (validate) {
        validateGovernanceOperation(token, sender);
    }

    const operation: TokenPauseOperation = { [TokenOperationType.Pause]: pause };
    return sendOperations(token, sender, [operation], signer, expiry);
}

/**
 * Executes a batch of governance operations on a token.
 *
 * @param {Token} token - The token on which to perform the operations.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {TokenOperation[]} operations - An array of governance operations to execute.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TransactionExpiry.Type} [expiry=TransactionExpiry.futureMinutes(5)] - The expiry time for the transaction.
 *
 * @returns A promise that resolves to the transaction hash.
 */
export async function sendOperations(
    token: Token,
    sender: AccountAddress.Type,
    operations: TokenOperation[],
    signer: AccountSigner,
    expiry: TransactionExpiry.Type = TransactionExpiry.futureMinutes(5)
): Promise<TransactionHash.Type> {
    const payload = createTokenUpdatePayload(token.info.id, operations);
    return sendRaw(token, sender, payload, signer, expiry);
}
