import { TokenUpdatePayload } from '../types.js';
import * as AccountAddress from '../types/AccountAddress.js';
import * as TokenMetadataUrl from './TokenMetadataUrl.js';
import { Cbor, CborMemo, EncodedTokenModuleEvent, TokenAmount, TokenHolder, TokenId } from './index.js';

/**
 * Enum representing the types of token operations.
 */
export enum TokenOperationType {
    Transfer = 'transfer',
    Mint = 'mint',
    Burn = 'burn',
    AddAllowList = 'addAllowList',
    RemoveAllowList = 'removeAllowList',
    AddDenyList = 'addDenyList',
    RemoveDenyList = 'removeDenyList',
}

export type Memo = CborMemo.Type | Uint8Array;

/**
 * The structure of a PLT transfer.
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
type TokenOperationGen<Type extends TokenOperationType, T extends Object> = {
    [K in Type]: T;
};

/**
 * Represents a token transfer operation.
 */
export type TokenTransferOperation = TokenOperationGen<TokenOperationType.Transfer, TokenTransfer>;

/**
 * The structure of a PLT mint/burn operation.
 */
export type TokenSupplyUpdate = {
    /** The amount to mint/burn. */
    amount: TokenAmount.Type;
};

/**
 * Represents a token mint operation.
 */
export type TokenMintOperation = TokenOperationGen<TokenOperationType.Mint, TokenSupplyUpdate>;

/**
 * Represents a token burn operation.
 */
export type TokenBurnOperation = TokenOperationGen<TokenOperationType.Burn, TokenSupplyUpdate>;

/**
 * The structure of any list update operation for a PLT.
 */
export type TokenListUpdate = {
    /** The target of the list update. */
    target: AccountAddress.Type;
};

/**
 * Represents an operation to add an account to the allow list.
 */
export type TokenAddAllowListOperation = TokenOperationGen<TokenOperationType.AddAllowList, TokenListUpdate>;

/**
 * Represents an operation to remove an account from the allow list.
 */
export type TokenRemoveAllowListOperation = TokenOperationGen<TokenOperationType.RemoveAllowList, TokenListUpdate>;

/**
 * Represents an operation to add an account to the deny list.
 */
export type TokenAddDenyListOperation = TokenOperationGen<TokenOperationType.AddDenyList, TokenListUpdate>;

/**
 * Represents an operation to remove an account from the deny list.
 */
export type TokenRemoveDenyListOperation = TokenOperationGen<TokenOperationType.RemoveDenyList, TokenListUpdate>;

/**
 * Union type representing all possible operations for a token.
 */
export type TokenOperation =
    | TokenTransferOperation
    | TokenMintOperation
    | TokenBurnOperation
    | TokenAddAllowListOperation
    | TokenRemoveAllowListOperation
    | TokenAddDenyListOperation
    | TokenRemoveDenyListOperation;

/**
 * Creates a payload for token operations.
 * This function encodes the provided token operation(s) into a CBOR format.
 *
 * @param tokenId - The unique identifier of the token for which the operation(s) is being performed.
 * @param operations - A single token operation or an array of token operations.
 *
 * @returns The encoded token governance payload.
 */
export function createTokenPayload(tokenId: TokenId.Type, operations: TokenOperation | TokenOperation[]): TokenUpdatePayload {
    const ops = [operations].flat();
    return {
        tokenId: tokenId,
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
    metadata: TokenMetadataUrl.Type;
    /** The governance account for the token. */
    governanceAccount: AccountAddress.Type;
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
 * The account state represents account-specific information that is maintained by the Token
 * Module, and is returned as part of a `GetAccountInfo` query. It does not include state that is
 * managed by the Token Kernel, such as the token identifier and account balance.
 *
 * All fields are optional, and can be omitted if the module implementation does not support them.
 * The structure supports additional fields for future extensibility. Non-standard fields (i.e. any
 * fields that are not defined by a standard, and are specific to the module implementation) may
 * be included, and their tags should be prefixed with an underscore ("_") to distinguish them
 * as such.
 */
export type TokenModuleAccountState = {
    /** Whether the account is on the allow list. */
    allowList?: boolean;
    /** Whether the account is on the deny list. */
    denyList?: boolean;
    /** Any additional state information depending on the module implementation. */
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
    metadata: TokenMetadataUrl.Type;
    /** The governance account for the token. */
    governanceAccount: AccountAddress.Type;
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
 * The structure of any list update event for a PLT.
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
 * A union of all token module events.
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
 * Parses a token module event, decoding the details from CBOR format. If the desired outcome is to be able to handle
 * arbitrary token events, it's recommended to use {@link Cbor.decode} instead.
 *
 * @param event - The token module event to parse.
 * @returns The parsed token module event with decoded details.
 * @throws {Error} If the event cannot be parsed as a token module event.
 *
 * @example
 * try {
 *   const parsedEvent = parseModuleEvent(encodedEvent);
 *   switch (parsedEvent.type) {
 *     // typed details are now available, e.g.:
 *     case TokenOperationType.AddAllowList: console.log(parsedEvent.details.target);
 *     ...
 *   }
 * } catch (error) {
 *   // Fall back to using Cbor.decode
 *   const decodedDetails = Cbor.decode(encodedEvent.details);
 *   switch (encodedEvent.type) {
 *     // do something with the decoded details
 *   }
 * }
 */
export function parseModuleEvent(event: EncodedTokenModuleEvent): TokenModuleEvent {
    if (!EVENT_TYPES.includes(event.type as TokenOperationType)) {
        throw new Error(`Cannot parse event as token module event: ${event.type}`);
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
