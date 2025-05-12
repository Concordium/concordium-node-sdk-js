import { TokenGovernancePayload, TokenHolderPayload } from '../../index.js';
import * as AccountAddress from '../../types/AccountAddress.js';
import { Cbor, CborMemo, TokenModuleEvent as EncodedModuleEvent, TokenAmount, TokenHolder, TokenId } from '../index.js';

/**
 * Enum representing the types of token operations.
 */
export enum TokenOperationType {
    Transfer = 'transfer',
    Mint = 'mint',
    Burn = 'burn',
    AddAllowList = 'add-allow-list',
    RemoveAllowList = 'remove-allow-list',
    AddDenyList = 'add-deny-list',
    RemoveDenyList = 'remove-deny-list',
}

export type Memo = CborMemo.Type | Uint8Array;

/**
 * The structure of a PLT V1 token transfer.
 */
export type TokenTransfer = {
    /** The amount to transfer. */
    amount: TokenAmount.Type;
    /** The recipient of the transfer. */
    recipient: AccountAddress.Type;
    /** An optional memo for the transfer. A string will be CBOR encoded, while raw bytes are included in the
     * transaction as is. */
    memo?: Memo;
};

/**
 * Generic type for a token operation.
 * @template TokenOperationType - The type of the token operation.
 * @template T - The specific operation details.
 */
type TokenOperation<Type extends TokenOperationType, T extends Object> = {
    [K in Type]: T;
};

/**
 * Represents a token transfer operation.
 */
export type TokenTransferOperation = TokenOperation<TokenOperationType.Transfer, TokenTransfer>;

/**
 * Represents a holder operation, currently only supporting transfer operations.
 */
export type TokenHolderOperation = TokenTransferOperation;

/**
 * Creates a payload for token holder operations.
 * This function encodes the provided token holder operation(s) into a CBOR format.
 *
 * @param tokenSymbol - The symbol of the token for which the governance operation is being performed.
 * @param operations - A single token holder operation or an array of token holder operations.
 *
 * @returns The encoded token holder payload.
 */
export function createTokenHolderPayload(
    tokenSymbol: TokenId.Type,
    operations: TokenHolderOperation | TokenHolderOperation[]
): TokenHolderPayload {
    const ops = [operations].flat();
    return {
        tokenSymbol,
        operations: Cbor.encode(ops),
    };
}

/**
 * The structure of a PLT V1 token mint/burn operation.
 */
export type TokenSupplyUpdate = {
    /** The amount to mint/burn. */
    amount: TokenAmount.Type;
};

/**
 * Represents a token mint operation.
 */
export type TokenMintOperation = TokenOperation<TokenOperationType.Mint, TokenSupplyUpdate>;

/**
 * Represents a token burn operation.
 */
export type TokenBurnOperation = TokenOperation<TokenOperationType.Burn, TokenSupplyUpdate>;

/**
 * The structure of any list update operation for a PLT V1 token .
 */
export type TokenListUpdate = {
    /** The target of the list update. */
    target: AccountAddress.Type;
};

/**
 * Represents an operation to add an account to the allow list.
 */
export type TokenAddAllowListOperation = TokenOperation<TokenOperationType.AddAllowList, TokenListUpdate>;

/**
 * Represents an operation to remove an account from the allow list.
 */
export type TokenRemoveAllowListOperation = TokenOperation<TokenOperationType.RemoveAllowList, TokenListUpdate>;

/**
 * Represents an operation to add an account to the deny list.
 */
export type TokenAddDenyListOperation = TokenOperation<TokenOperationType.AddDenyList, TokenListUpdate>;

/**
 * Represents an operation to remove an account from the deny list.
 */
export type TokenRemoveDenyListOperation = TokenOperation<TokenOperationType.RemoveDenyList, TokenListUpdate>;

/**
 * Union type representing all possible governance operations for a token.
 */
export type TokenGovernanceOperation =
    | TokenMintOperation
    | TokenBurnOperation
    | TokenAddAllowListOperation
    | TokenRemoveAllowListOperation
    | TokenAddDenyListOperation
    | TokenRemoveDenyListOperation;

/**
 * Creates a payload for token governance operations.
 * This function encodes the provided token governance operation(s) into a CBOR format.
 *
 * @param tokenSymbol - The symbol of the token for which the governance operation is being performed.
 * @param operations - A single token governance operation or an array of token governance operations.
 *
 * @returns The encoded token governance payload.
 */
export function createTokenGovernancePayload(
    tokenSymbol: TokenId.Type,
    operations: TokenGovernanceOperation | TokenGovernanceOperation[]
): TokenGovernancePayload {
    const ops = [operations].flat();
    return {
        tokenSymbol,
        operations: Cbor.encode(ops),
    };
}

/**
 * The Token Module state represents global state information that is maintained by the Token Module,
 * and is returned as part of a `GetTokenInfo` query. It does not include state that is managed by
 * the Token Kernel, such as the token identifier, global supply and governance account. It also
 * does not (typically) include account-specific state, which is returned as part of
 * `GetAccountInfo` instead.
 *
 * The "name" and "metadata" fields are required. Other fields are optional, and can be omitted if
 * the module implementation does not support them. The structure supports additional fields for
 * future extensibility. Non-standard fields (i.e. any fields that are not defined by a standard,
 * and are specific to the module implementation) may be included, and their tags should be
 * prefixed with an underscore ("_") to distinguish them as such.
 */
export type TokenModuleState = {
    /** The name of the token. */
    name: string;
    /** A URL pointing to the metadata of the token. */
    metadata: string; // TODO: will change to url object containing url and checksum
    /** Whether the token supports an allow list */
    allowList?: boolean;
    /** Whether the token supports an deny list */
    denyList?: boolean;
    /** Whether the token is mintable */
    mintable?: boolean;
    /** Whether the token is burnable */
    burnable?: boolean;
    /** Any additional state information depending on the module implementation */
    [key: string]: unknown;
};

/**
 * These parameters are passed to the token module to initialize the token.
 * The token initialization update will also include the ticker symbol, initial account,
 * number of decimals, and a reference to the token module implementation.
 */
export type TokenInitializationParameters = {
    /** The name of the token. */
    name: string;
    /** A URL pointing to the metadata of the token. */
    metadata: string; // TODO: will change to url object containing url and checksum
    /** Whether the token supports an allow list */
    allowList?: boolean;
    /** Whether the token supports an deny list */
    denyList?: boolean;
    /** Whether the token is mintable */
    mintable?: boolean;
    /** Whether the token is burnable */
    burnable?: boolean;
};

type GenericTokenModuleEvent<E extends TokenOperationType, T extends Object> = {
    /** The type of the event. */
    type: E;
    /** The details of the event. */
    details: T;
};

/**
 * The structure of any list update event for a PLT V1 token.
 */
export type TokenListUpdateEventDetails = {
    /** The target of the list update. */
    target: TokenHolder;
};

/**
 * An event occuring as the result of an "add-allow-list" operation.
 */
export type TokenAddAllowListEvent = GenericTokenModuleEvent<
    TokenOperationType.AddAllowList,
    TokenListUpdateEventDetails
>;
/**
 * An event occuring as the result of an "add-deny-list" operation.
 */
export type TokenAddDenyListEvent = GenericTokenModuleEvent<
    TokenOperationType.AddDenyList,
    TokenListUpdateEventDetails
>;
/**
 * An event occuring as the result of an "remove-allow-list" operation.
 */
export type TokenRemoveAllowListEvent = GenericTokenModuleEvent<
    TokenOperationType.RemoveAllowList,
    TokenListUpdateEventDetails
>;
/**
 * An event occuring as the result of an "remove-deny-list" operation.
 */
export type TokenRemoveDenyListEvent = GenericTokenModuleEvent<
    TokenOperationType.RemoveDenyList,
    TokenListUpdateEventDetails
>;

/**
 * A union of all V1 token module events.
 */
export type TokenModuleEvent =
    | TokenAddAllowListEvent
    | TokenAddDenyListEvent
    | TokenRemoveAllowListEvent
    | TokenRemoveDenyListEvent;

const EVENT_TYPES = [
    TokenOperationType.AddAllowList,
    TokenOperationType.RemoveAllowList,
    TokenOperationType.AddDenyList,
    TokenOperationType.RemoveDenyList,
];

/**
 * Parses a token module event, decoding the details from CBOR format.
 *
 * @param event - The token module event to parse.
 * @returns The parsed token module event with decoded details.
 * @throws {Error} If the event cannot be parsed as a V1 token module event.
 */
export function parseModuleEvent(event: EncodedModuleEvent): TokenModuleEvent {
    if (!EVENT_TYPES.includes(event.type as TokenOperationType)) {
        throw new Error(`Cannot parse event as V1 token module event: ${event.type}`);
    }

    const decoded = Cbor.decode(event.details);
    if (typeof decoded !== 'object' || decoded === null) {
        throw new Error(`Invalid event details: ${JSON.stringify(decoded)}. Expected an object.`);
    }
    if (!('target' in decoded) || !AccountAddress.instanceOf(decoded.target)) {
        throw new Error(`Invalid event details: ${JSON.stringify(decoded)}. Expected 'target' to be an AccountAddress`);
    }

    const details: TokenListUpdateEventDetails = { target: { tag: 'account', address: decoded.target } };
    return {
        ...event,
        details,
    } as TokenModuleEvent;
}
