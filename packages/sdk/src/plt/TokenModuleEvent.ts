import { EncodedTokenModuleEvent, TransactionEventTag } from '../types.js';
import { cborDecode } from '../types/cbor.js';
import { TokenOperationType, TokenUpdateAdminRolesDetails } from './TokenOperation.js';
import { CborAccountAddress, TokenId, TokenMetadataUrl } from './index.js';

type GenTokenModuleEvent<E extends TokenOperationType, T extends Object> = {
    /** The tag of the event. */
    tag: TransactionEventTag.TokenModuleEvent;
    /** The ID of the token. */
    tokenId: TokenId.Type;
    /** The type of the event. */
    type: E;
    /** The details of the event. */
    details: T;
};

/**
 * Represents a token module event (found when decoding) unknown to the SDK.
 */
export type UnknownTokenModuleEvent = {
    /** The tag of the event. */
    tag: TransactionEventTag.TokenModuleEvent;
    /** The ID of the token. */
    tokenId: TokenId.Type;
    /** The type of the event. */
    type: string;
    /** The details of the event. */
    details: unknown;
};

/**
 * The structure of any list update event for a PLT.
 */
export type TokenListUpdateEventDetails = {
    /** The target of the list update. */
    target: CborAccountAddress.Type;
};

/**
 * The structure of a pause event for a PLT.
 */
export type TokenPauseEventDetails = {};

export type TokenEventDetails = TokenListUpdateEventDetails | TokenPauseEventDetails;

/**
 * An event occuring as the result of an "addAllowList" operation.
 */
export type TokenAddAllowListEvent = GenTokenModuleEvent<TokenOperationType.AddAllowList, TokenListUpdateEventDetails>;
/**
 * An event occuring as the result of an "addDenyList" operation.
 */
export type TokenAddDenyListEvent = GenTokenModuleEvent<TokenOperationType.AddDenyList, TokenListUpdateEventDetails>;
/**
 * An event occuring as the result of an "removeAllowList" operation.
 */
export type TokenRemoveAllowListEvent = GenTokenModuleEvent<
    TokenOperationType.RemoveAllowList,
    TokenListUpdateEventDetails
>;
/**
 * An event occuring as the result of an "removeDenyList" operation.
 */
export type TokenRemoveDenyListEvent = GenTokenModuleEvent<
    TokenOperationType.RemoveDenyList,
    TokenListUpdateEventDetails
>;

/**
 * An event occuring as the result of a "pause" operation, describing whether execution
 * of the associated token operations are paused or not.
 */
export type TokenPauseEvent = GenTokenModuleEvent<TokenOperationType.Pause, TokenPauseEventDetails>;

/**
 * An event occuring as the result of a "pause" operation, describing whether execution
 * of the associated token operations are paused or not.
 */
export type TokenUnpauseEvent = GenTokenModuleEvent<TokenOperationType.Unpause, TokenPauseEventDetails>;

/**
 * An event occuring as the result of "updateMetadata" operation, describing the new metadata URL of the token.
 */
export type TokenUpdateMetadataEvent = GenTokenModuleEvent<TokenOperationType.UpdateMetadata, TokenMetadataUrl.Type>;

/**
 * An event occuring as the result of an "assignAdminRoles" operation, describing the target of the role assignment.
 */
export type TokenAssignAdminRolesEvent = GenTokenModuleEvent<
    TokenOperationType.AssignAdminRoles,
    TokenUpdateAdminRolesDetails
>;

/**
 * An event occuring as the result of a "revokeAdminRoles" operation, describing the target of the role revocation.
 */
export type TokenRevokeAdminRolesEvent = GenTokenModuleEvent<
    TokenOperationType.RevokeAdminRoles,
    TokenUpdateAdminRolesDetails
>;

/**
 * A union of all token module events.
 */
export type TokenModuleEvent =
    | TokenAddAllowListEvent
    | TokenAddDenyListEvent
    | TokenRemoveAllowListEvent
    | TokenRemoveDenyListEvent
    | TokenPauseEvent
    | TokenUnpauseEvent
    | TokenUpdateMetadataEvent
    | TokenAssignAdminRolesEvent
    | TokenRevokeAdminRolesEvent;

function parseTokenListUpdateEventDetails(decoded: unknown): TokenListUpdateEventDetails {
    if (typeof decoded !== 'object' || decoded === null) {
        throw new Error(`Invalid event details: ${JSON.stringify(decoded)}. Expected an object.`);
    }
    if (!('target' in decoded && CborAccountAddress.instanceOf(decoded.target))) {
        throw new Error(`Invalid event details: ${JSON.stringify(decoded)}. Expected 'target' to be a TokenHolder`);
    }

    return decoded as TokenListUpdateEventDetails;
}

function parseTokenPauseEventDetails(decoded: unknown): TokenPauseEventDetails {
    if (typeof decoded !== 'object' || decoded === null) {
        throw new Error(`Invalid event details: ${JSON.stringify(decoded)}. Expected an object.`);
    }

    return decoded as TokenPauseEventDetails;
}

function parseTokenUpdateAdminRolesEventDetails(decoded: unknown): TokenUpdateAdminRolesDetails {
    if (typeof decoded !== 'object' || decoded === null) {
        throw new Error(`Invalid event details: ${JSON.stringify(decoded)}. Expected an object.`);
    }

    if (!('account' in decoded && CborAccountAddress.instanceOf(decoded.account))) {
        throw new Error(`Invalid event details: ${JSON.stringify(decoded)}. Expected 'account'`);
    }

    return decoded as TokenUpdateAdminRolesDetails;
}

/**
 * Parses a token module event, decoding the details from CBOR format.
 *
 * @param event - The token module event to parse.
 * @returns The parsed token module event with decoded details.
 *
 * @example
 * const parsedEvent = parseTokenModuleEvent(encodedEvent);
 * switch (parsedEvent.type) {
 *   // typed details are now available, e.g.:
 *   case TokenOperationType.AddAllowList: console.log(parsedEvent.details.target);
 *   ...
 *   default: console.warn('Unknown event encountered:', parsedEvent);
 * }
 */
export function parseTokenModuleEvent(event: EncodedTokenModuleEvent): TokenModuleEvent | UnknownTokenModuleEvent {
    const decoded = cborDecode(event.details.bytes);
    switch (event.type) {
        case TokenOperationType.AddAllowList:
        case TokenOperationType.RemoveAllowList:
        case TokenOperationType.AddDenyList:
        case TokenOperationType.RemoveDenyList:
            return { ...event, type: event.type, details: parseTokenListUpdateEventDetails(decoded) };
        case TokenOperationType.Pause:
        case TokenOperationType.Unpause:
            return { ...event, type: event.type, details: parseTokenPauseEventDetails(decoded) };
        case TokenOperationType.UpdateMetadata:
            return { ...event, type: event.type, details: TokenMetadataUrl.fromCBORValue(decoded) };
        case TokenOperationType.AssignAdminRoles:
        case TokenOperationType.RevokeAdminRoles:
            return { ...event, type: event.type, details: parseTokenUpdateAdminRolesEventDetails(decoded) };
        default:
            return { ...event, details: decoded };
    }
}
