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
import { SequenceNumber } from '../types/index.js';
import { bail } from '../util.js';
import {
    Cbor,
    CborAccountAddress,
    TokenAddAllowListOperation,
    TokenAddDenyListOperation,
    TokenAmount,
    TokenBurnOperation,
    TokenId,
    TokenInfo,
    TokenMintOperation,
    TokenModuleReference,
    TokenModuleState,
    TokenOperation,
    TokenOperationType,
    TokenPauseOperation,
    TokenRemoveAllowListOperation,
    TokenRemoveDenyListOperation,
    TokenTransfer,
    TokenTransferOperation,
    TokenUnpauseOperation,
    createTokenUpdatePayload,
} from './index.js';

/**
 * Enum representing the types of errors that can occur when interacting with PLT instances through the client.
 */
export enum TokenErrorCode {
    /** Error type indicating the token ID does not match the module version expected by the client. */
    INCORRECT_MODULE_VERSION = 'INCORRECT_MODULE_VERSION',
    /** Error type indicating the supplied token amount is not compatible with the token. */
    INVALID_TOKEN_AMOUNT = 'INVALID_TOKEN_AMOUNT',
    /** Error representing an attempt transfer funds to an account which is either not on the token allow list,
     * or is on the token deny list.
     */
    NOT_ALLOWED = 'NOT_ALLOWED',
    /** Error representing an attempt to transfer tokens from an account that does not have enough tokens to cover the
     * amount. */
    INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
    /** Error type Error indicating that supply change operation is prohibited while the token is in the paused state.
     */
    PAUSED = 'PAUSED',
    /** Error that indicates that the token does not support minting. */
    NOT_MINTABLE = 'NOT_MINTABLE',
    /** Error that indicates that the token does not support burning. */
    NOT_BURNABLE = 'NOT_BURNABLE',
    /** Error that indicates that allow list is not available for this token. */
    NO_ALLOW_LIST = 'NO_ALLOW_LIST',
    /** Error that indicates that deny list is not available for this token. */
    NO_DENY_LIST = 'NO_DENY_LIST',
    /** Error that indicates that an account has insufficient amount of token to burn. */
    INSUFFICIENT_SUPPLY = 'INSUFFICIENT_SUPPLY',
    // InsufficientSupplyError
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
 * Error type indicating that the token is paused.
 */
export class PausedError extends TokenError {
    public readonly code = TokenErrorCode.PAUSED;

    /**
     * Constructs a new PausedError.
     *
     * @param {TokenId.Type} tokenId - The ID of the token.
     */
    constructor(public readonly tokenId: TokenId.Type) {
        super(`Token ${tokenId} is paused.`);
    }
}

/**
 * Error type indicating that the token is not mintable.
 */
export class NotMintableError extends TokenError {
    public readonly code = TokenErrorCode.NOT_MINTABLE;

    /**
     * Constructs a new NotMintableError.
     *
     * @param {TokenId.Type} tokenId - The ID of the token.
     */
    constructor(public readonly tokenId: TokenId.Type) {
        super(`Token ${tokenId} is not mintable.`);
    }
}

/**
 * Error type indicating that the token is not burnable.
 */
export class NotBurnableError extends TokenError {
    public readonly code = TokenErrorCode.NOT_BURNABLE;

    /**
     * Constructs a new NotBurnableError.
     *
     * @param {TokenId.Type} tokenId - The ID of the token.
     */
    constructor(public readonly tokenId: TokenId.Type) {
        super(`Token ${tokenId} is not burnable.`);
    }
}

/**
 * Error type indicating that the token has no allow list.
 */
export class NoAllowListError extends TokenError {
    public readonly code = TokenErrorCode.NO_ALLOW_LIST;

    /**
     * Constructs a new NoAllowListError.
     *
     * @param {TokenId.Type} tokenId - The ID of the token.
     */
    constructor(public readonly tokenId: TokenId.Type) {
        super(`Token ${tokenId} does not have allow list.`);
    }
}

/**
 * Error type indicating that the token has no deny list.
 */
export class NoDenyListError extends TokenError {
    public readonly code = TokenErrorCode.NO_DENY_LIST;

    /**
     * Constructs a new NoDenyListError.
     *
     * @param {TokenId.Type} tokenId - The ID of the token.
     */
    constructor(public readonly tokenId: TokenId.Type) {
        super(`Token ${tokenId} does not have deny list.`);
    }
}

/**
 * Error type indicating insufficient supply for the burning.
 */
export class InsufficientSupplyError extends TokenError {
    public readonly code = TokenErrorCode.INSUFFICIENT_SUPPLY;

    /**
     * Constructs a new InsufficientSupplyError.
     *
     * @param {AccountAddress.Type} sender - The account address of the sender.
     * @param {TokenAmount.Type} requiredAmount - The amount of tokens required for the burn.
     */
    constructor(
        public readonly sender: AccountAddress.Type,
        public readonly requiredAmount: TokenAmount.Type
    ) {
        super(`Insufficient supply: Sender ${sender} requires at least ${requiredAmount} tokens for the burn.`);
    }
}

/**
 * Class representing a token.
 */
class Token {
    /** The parsed module state of the token. */
    private _info: TokenInfo;
    private _moduleState: TokenModuleState;

    /**
     * Constructs a new Token.
     * @param {ConcordiumGRPCClient} grpc - The gRPC client for interacting with the Concordium network.
     * @param {TokenInfo} info - Information about the token.
     */
    public constructor(
        public readonly grpc: ConcordiumGRPCClient,
        info: TokenInfo
    ) {
        this._info = info;
        this._moduleState = Cbor.decode(info.state.moduleState, 'TokenModuleState');
    }

    public get info(): TokenInfo {
        return this._info;
    }
    public get moduleState(): TokenModuleState {
        return this._moduleState;
    }

    /**
     * Mutates this instance with fresh info and keeps fields in sync.
     * Returns `this` for ergonomic chaining / capturing a reference if desired.
     */
    public async update(): Promise<this> {
        const next = await this.grpc.getTokenInfo(this._info.id);
        this._info = next;
        this._moduleState = Cbor.decode(next.state.moduleState, 'TokenModuleState');
        return this;
    }
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
 * @param {TokenUpdateMetadata} [metadata={ expiry: TransactionExpiry.futureMinutes(5) }] - The metadata for the token update.
 *
 * @returns {Promise<TransactionHash.Type>} A promise that resolves to the transaction hash.
 */
export async function sendRaw(
    token: Token,
    sender: AccountAddress.Type,
    payload: TokenUpdatePayload,
    signer: AccountSigner,
    { expiry = TransactionExpiry.futureMinutes(5), nonce }: TokenUpdateMetadata = {}
): Promise<TransactionHash.Type> {
    const { nonce: nextNonce } = nonce ? { nonce } : await token.grpc.getNextAccountNonce(sender);
    const header: AccountTransactionHeader = {
        expiry,
        nonce: nextNonce,
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
 * @throws {PausedError} If the token is paused.
 */
export async function validateTransfer(
    token: Token,
    sender: AccountAddress.Type,
    payload: TokenTransfer | TokenTransfer[]
): Promise<true> {
    await token.update();
    token.moduleState.paused && bail(new PausedError(token.info.id));

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

    if (!token.moduleState.allowList && !token.moduleState.denyList) {
        // If the token neither has a deny list nor allow list, we can skip the check.
        return true;
    }

    // Check that sender and all receivers are NOT on the deny list (if present), or that they are included in the allow list (if present).
    const receiverInfos = await Promise.all(payloads.map((p) => token.grpc.getAccountInfo(p.recipient.address)));
    const accounts = [senderInfo, ...receiverInfos];
    accounts.forEach((r) => {
        const accountToken = r.accountTokens.find((t) => t.id.value === token.info.id.value)?.state;
        const accountModuleState =
            accountToken?.moduleState === undefined
                ? undefined
                : Cbor.decode(accountToken.moduleState, 'TokenModuleAccountState');

        if (token.moduleState.denyList && accountModuleState?.denyList) throw new NotAllowedError(r.accountAddress);
        if (token.moduleState.allowList && !accountModuleState?.allowList) throw new NotAllowedError(r.accountAddress);
    });

    return true;
}

/**
 * Validates a token mint.
 *
 * @param {Token} token - The token to mint.
 * @param {TokenAmount.Type | TokenAmount.Type[]} amounts - The amounts of tokens to mint.
 *
 * @returns {Promise<true>} A promise that resolves to true if the minting is valid.
 * @throws {InvalidTokenAmountError} If any token amount is not compatible with the token.
 * @throws {PausedError} If the token is paused.
 * @throws {NotMintableError} If the the token if not mintable.
 */
export async function validateMint(token: Token, amounts: TokenAmount.Type | TokenAmount.Type[]): Promise<true> {
    const amountsList = [amounts].flat();
    await token.update();
    token.moduleState.paused && bail(new PausedError(token.info.id));
    !token.moduleState.mintable && bail(new NotMintableError(token.info.id));
    amountsList.forEach((amount) => validateAmount(token, amount));
    return true;
}

/**
 * Validates a token burn.
 *
 * @param {Token} token - The token to burn.
 * @param {TokenAmount.Type | TokenAmount.Type[]} amounts - The amounts of tokens to burn.
 *
 * @returns {Promise<true>} A promise that resolves to true if the burning is valid.
 * @throws {InvalidTokenAmountError} If any token amount is not compatible with the token.
 * @throws {PausedError} If the token is paused.
 * @throws {NotBurnableError} If the the token if not burnable.
 * @throws {InsufficientSupplyError} If the sender has insufficent amount of tokens for the burn.
 */
export async function validateBurn(
    token: Token,
    amounts: TokenAmount.Type | TokenAmount.Type[],
    sender: AccountAddress.Type | AccountInfo
): Promise<true> {
    const amountsList = [amounts].flat();
    await token.update();
    token.moduleState.paused && bail(new PausedError(token.info.id));
    !token.moduleState.burnable && bail(new NotBurnableError(token.info.id));
    amountsList.forEach((amount) => validateAmount(token, amount));

    const { decimals } = token.info.state;

    let senderBalance: BalanceOfResponse;
    let senderAdderss: AccountAddress.Type;

    if (AccountAddress.instanceOf(sender)) {
        senderAdderss = sender;
        senderBalance = await balanceOf(token, sender);
    } else {
        senderAdderss = sender.accountAddress;
        senderBalance = balanceOf(token, sender);
    }

    const burnableAmount = senderBalance ?? TokenAmount.zero(decimals);
    const payloadTotal = amountsList.reduce(
        (acc, amount) => acc.add(TokenAmount.toDecimal(amount)),
        TokenAmount.toDecimal(TokenAmount.zero(decimals))
    );
    if (TokenAmount.toDecimal(burnableAmount).lt(payloadTotal)) {
        throw new InsufficientSupplyError(senderAdderss, TokenAmount.fromDecimal(payloadTotal, decimals));
    }
    return true;
}

/**
 * Validates a token allow list update.
 *
 * @param {Token} token - The token that's allow list is to be updated.
 *
 * @returns {Promise<true>} A promise that resolves to true if the token's allow list can be updated.
 * @throws {NoAllowListError} If the token does not have an allow list.
 */
export async function validateAllowListUpdate(token: Token): Promise<true> {
    await token.update();
    !token.moduleState.allowList && bail(new NoAllowListError(token.info.id));
    return true;
}

/**
 * Validates a token deny list update.
 *
 * @param {Token} token - The token that's deny list is to be updated.
 *
 * @returns {Promise<true>} A promise that resolves to true if the token's deny list can be updated.
 * @throws {NoDenyListError} If the token does not have a deny list.
 */
export async function validateDenyListUpdate(token: Token): Promise<true> {
    await token.update();
    !token.moduleState.denyList && bail(new NoDenyListError(token.info.id));
    return true;
}

export type TokenUpdateMetadata = {
    /**
     * The expiry time for the transaction.
     */
    expiry?: TransactionExpiry.Type;
    /**
     * The the sender account "nonce" for to use for the transaction. If not specified, the
     * nonce will be queried from the node used for the transaction.
     */
    nonce?: SequenceNumber.Type;
};

type TransferOtions = {
    /** Whether to automatically scale a token amount to the correct number of decimals as the token */
    autoScale?: boolean;
    /** Whether to validate the operation client side against the latest finalized state (necessary state will be fetched) before submitting it */
    validate?: boolean;
};

export type TransferInput = Omit<TokenTransfer, 'recipient'> & {
    /** The recipient of the transfer. */
    recipient: AccountAddress.Type;
};

/**
 * Transfers tokens from the sender to the specified recipients.
 *
 * @param {Token} token - The token to transfer.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {TransferInput | TransferInput[]} payload - The transfer payload.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TokenUpdateMetadata} [metadata={ expiry: TransactionExpiry.futureMinutes(5) }] - The metadata for the token update.
 * @param {TransferOtions} [opts={ autoScale: true, validate: false }] - Options for the transfer.
 *
 * @returns {Promise<TransactionHash.Type>} A promise that resolves to the transaction hash.
 * @throws {InvalidTokenAmountError} If `opts.validate` and any token amount is not compatible with the token.
 * @throws {InsufficientFundsError} If `opts.validate` and the sender does not have enough tokens.
 * @throws {NotAllowedError} If `opts.validate` and a sender or receiver is not allowed to send/receive tokens.
 * @throws {PausedError} If `opts.validate` and the token is paused.
 */
export async function transfer(
    token: Token,
    sender: AccountAddress.Type,
    payload: TransferInput | TransferInput[],
    signer: AccountSigner,
    metadata?: TokenUpdateMetadata,
    { autoScale = true, validate = false }: TransferOtions = {}
): Promise<TransactionHash.Type> {
    let transfers: TokenTransfer[] = [payload].flat().map((p) => ({
        ...p,
        recipient: CborAccountAddress.fromAccountAddress(p.recipient),
        amount: autoScale ? scaleAmount(token, p.amount) : p.amount,
    }));

    if (validate) {
        await validateTransfer(token, sender, transfers);
    }

    const ops: TokenTransferOperation[] = transfers.map((p) => ({ [TokenOperationType.Transfer]: p }));
    return sendOperations(token, sender, ops, signer, metadata);
}

type SupplyUpdateOptions = {
    /** Whether to automatically scale a token amount to the correct number of decimals as the token */
    autoScale?: boolean;
    /** Whether to validate the operation client side against the latest finalized state (necessary state will be fetched) before submitting it */
    validate?: boolean;
};

/**
 * Mints a specified amount of tokens.
 *
 * @param {Token} token - The token to mint.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {TokenAmount.Type | TokenAmount.Type[]} amounts - The amount(s) of tokens to mint.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TokenUpdateMetadata} [metadata={ expiry: TransactionExpiry.futureMinutes(5) }] - The metadata for the token update.
 * @param {SupplyUpdateOptions} [opts={ autoScale: true, validate: false }] - Options for supply update operations.
 *
 * @returns A promise that resolves to the transaction hash.
 * @throws {InvalidTokenAmountError} If `opts.validate` and the token amount is not compatible with the token.
 * @throws {PausedError} If `opts.validate` and the token is paused.
 * @throws {NotMintableError} If `opts.validate` and the token is not mintable.
 */
export async function mint(
    token: Token,
    sender: AccountAddress.Type,
    amounts: TokenAmount.Type | TokenAmount.Type[],
    signer: AccountSigner,
    metadata?: TokenUpdateMetadata,
    { autoScale = true, validate = false }: SupplyUpdateOptions = {}
): Promise<TransactionHash.Type> {
    let amountsList = [amounts].flat();
    if (autoScale) {
        amountsList = amountsList.map((amount) => scaleAmount(token, amount));
    }

    if (validate) {
        await validateMint(token, amountsList);
    }

    const ops: TokenMintOperation[] = amountsList.map((amount) => ({
        [TokenOperationType.Mint]: { amount },
    }));
    return sendOperations(token, sender, ops, signer, metadata);
}

/**
 * Burns a specified amount of tokens.
 *
 * @param {Token} token - The token to burn.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {TokenAmount.Type | TokenAmount.Type[]} amounts - The amount(s) of tokens to burn.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TokenUpdateMetadata} [metadata={ expiry: TransactionExpiry.futureMinutes(5) }] - The metadata for the token update.
 * @param {SupplyUpdateOptions} [opts={ autoScale: true, validate: false }] - Options for supply update operations.
 *
 * @returns A promise that resolves to the transaction hash.
 * @throws {InvalidTokenAmountError} If `opts.validate` and the token amount is not compatible with the token.
 * @throws {PausedError} If `opts.validate` and the token is paused.
 * @throws {NotBurnableError} If `opts.validate` and the token is not burnable.
 * @throws {InsufficientSupplyError} If `opts.validate` and the sender has insufficent amount of tokens for the burn.
 */
export async function burn(
    token: Token,
    sender: AccountAddress.Type,
    amounts: TokenAmount.Type | TokenAmount.Type[],
    signer: AccountSigner,
    metadata?: TokenUpdateMetadata,
    { autoScale = true, validate = false }: SupplyUpdateOptions = {}
): Promise<TransactionHash.Type> {
    let amountsList = [amounts].flat();
    if (autoScale) {
        amountsList = amountsList.map((amount) => scaleAmount(token, amount));
    }

    if (validate) {
        await validateBurn(token, amountsList, sender);
    }

    const ops: TokenBurnOperation[] = amountsList.map((amount) => ({
        [TokenOperationType.Burn]: { amount },
    }));
    return sendOperations(token, sender, ops, signer, metadata);
}

type UpdateListOptions = {
    /** Whether to validate the operation client side against the latest finalized state (necessary state will be fetched) before submitting it */
    validate?: boolean;
};

/**
 * Adds an account to the allow list of a token.
 *
 * @param {Token} token - The token for which to add the list entry.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {AccountAddress.Type | AccountAddress.Type[]} targets - The account address(es) to be added to the list.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TokenUpdateMetadata} [metadata={ expiry: TransactionExpiry.futureMinutes(5) }] - The metadata for the token update.
 * @param {UpdateListOptions} [opts={ validate: false }] - Options for updating the allow/deny list.
 *
 * @returns A promise that resolves to the transaction hash.
 * @throws {NoAllowListError} If `opts.validate` and the token does not have allow list.
 */
export async function addAllowList(
    token: Token,
    sender: AccountAddress.Type,
    targets: AccountAddress.Type | AccountAddress.Type[],
    signer: AccountSigner,
    metadata?: TokenUpdateMetadata,
    { validate = false }: UpdateListOptions = {}
): Promise<TransactionHash.Type> {
    if (validate) {
        await validateAllowListUpdate(token);
    }

    const ops: TokenAddAllowListOperation[] = [targets].flat().map((target) => ({
        [TokenOperationType.AddAllowList]: { target: CborAccountAddress.fromAccountAddress(target) },
    }));
    return sendOperations(token, sender, ops, signer, metadata);
}

/**
 * Removes an account from the allow list of a token.
 *
 * @param {Token} token - The token for which to add the list entry.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {AccountAddress.Type | AccountAddress.Type[]} targets - The account address(es) to be added to the list.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TokenUpdateMetadata} [metadata={ expiry: TransactionExpiry.futureMinutes(5) }] - The metadata for the token update.
 * @param {UpdateListOptions} [opts={ validate: false }] - Options for updating the allow/deny list.
 *
 * @returns A promise that resolves to the transaction hash.
 * @throws {NoAllowListError} If `opts.validate` and the token does not have allow list.
 */
export async function removeAllowList(
    token: Token,
    sender: AccountAddress.Type,
    targets: AccountAddress.Type | AccountAddress.Type[],
    signer: AccountSigner,
    metadata?: TokenUpdateMetadata,
    { validate = false }: UpdateListOptions = {}
): Promise<TransactionHash.Type> {
    if (validate) {
        await validateAllowListUpdate(token);
    }

    const ops: TokenRemoveAllowListOperation[] = [targets].flat().map((target) => ({
        [TokenOperationType.RemoveAllowList]: { target: CborAccountAddress.fromAccountAddress(target) },
    }));
    return sendOperations(token, sender, ops, signer, metadata);
}

/**
 * Adds an account to the deny list of a token.
 *
 * @param {Token} token - The token for which to add the list entry.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {AccountAddress.Type | AccountAddress.Type[]} targets - The account address(es) to be added to the list.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TokenUpdateMetadata} [metadata={ expiry: TransactionExpiry.futureMinutes(5) }] - The metadata for the token update.
 * @param {UpdateListOptions} [opts={ validate: false }] - Options for updating the allow/deny list.
 *
 * @returns A promise that resolves to the transaction hash.
 * @throws {NoDenyListError} If `opts.validate` and the token does not have deny list.
 */
export async function addDenyList(
    token: Token,
    sender: AccountAddress.Type,
    targets: AccountAddress.Type | AccountAddress.Type[],
    signer: AccountSigner,
    metadata?: TokenUpdateMetadata,
    { validate = false }: UpdateListOptions = {}
): Promise<TransactionHash.Type> {
    if (validate) {
        await validateDenyListUpdate(token);
    }

    const ops: TokenAddDenyListOperation[] = [targets].flat().map((target) => ({
        [TokenOperationType.AddDenyList]: { target: CborAccountAddress.fromAccountAddress(target) },
    }));
    return sendOperations(token, sender, ops, signer, metadata);
}

/**
 * Removes an account from the deny list of a token.
 *
 * @param {Token} token - The token for which to add the list entry.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {AccountAddress.Type | AccountAddress.Type[]} targets - The account address(es) to be added to the list.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TokenUpdateMetadata} [metadata={ expiry: TransactionExpiry.futureMinutes(5) }] - The metadata for the token update.
 * @param {UpdateListOptions} [opts={ validate: false }] - Options for updating the allow/deny list.
 *
 * @returns A promise that resolves to the transaction hash.
 * @throws {NoDenyListError} If `opts.validate` and the token does not have deny list.
 */
export async function removeDenyList(
    token: Token,
    sender: AccountAddress.Type,
    targets: AccountAddress.Type | AccountAddress.Type[],
    signer: AccountSigner,
    metadata?: TokenUpdateMetadata,
    { validate = false }: UpdateListOptions = {}
): Promise<TransactionHash.Type> {
    if (validate) {
        await validateDenyListUpdate(token);
    }

    const ops: TokenRemoveDenyListOperation[] = [targets].flat().map((target) => ({
        [TokenOperationType.RemoveDenyList]: { target: CborAccountAddress.fromAccountAddress(target) },
    }));
    return sendOperations(token, sender, ops, signer, metadata);
}

/**
 * Suspends execution of any operation involving balance changes for the token.
 *
 * @param {Token} token - The token to pause/unpause.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TokenUpdateMetadata} [metadata={ expiry: TransactionExpiry.futureMinutes(5) }] - The metadata for the token update.
 *
 * @returns A promise that resolves to the transaction hash.
 */
export async function pause(
    token: Token,
    sender: AccountAddress.Type,
    signer: AccountSigner,
    metadata?: TokenUpdateMetadata
): Promise<TransactionHash.Type> {
    const operation: TokenPauseOperation = { [TokenOperationType.Pause]: {} };
    return sendOperations(token, sender, [operation], signer, metadata);
}

/**
 * Resumes execution of any operation involving balance changes for the token.
 *
 * @param {Token} token - The token to pause/unpause.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TokenUpdateMetadata} [metadata={ expiry: TransactionExpiry.futureMinutes(5) }] - The metadata for the token update.
 *
 * @returns A promise that resolves to the transaction hash.
 */
export async function unpause(
    token: Token,
    sender: AccountAddress.Type,
    signer: AccountSigner,
    metadata?: TokenUpdateMetadata
): Promise<TransactionHash.Type> {
    const operation: TokenUnpauseOperation = { [TokenOperationType.Unpause]: {} };
    return sendOperations(token, sender, [operation], signer, metadata);
}

/**
 * Executes a batch of operations on a token.
 *
 * @param {Token} token - The token on which to perform the operations.
 * @param {AccountAddress.Type} sender - The account address of the sender.
 * @param {TokenOperation[]} operations - An array of governance operations to execute.
 * @param {AccountSigner} signer - The signer responsible for signing the transaction.
 * @param {TokenUpdateMetadata} [metadata={ expiry: TransactionExpiry.futureMinutes(5) }] - The metadata for the token update.
 *
 * @returns A promise that resolves to the transaction hash.
 */
export async function sendOperations(
    token: Token,
    sender: AccountAddress.Type,
    operations: TokenOperation[],
    signer: AccountSigner,
    metadata?: TokenUpdateMetadata
): Promise<TransactionHash.Type> {
    const payload = createTokenUpdatePayload(token.info.id, operations);
    return sendRaw(token, sender, payload, signer, metadata);
}
