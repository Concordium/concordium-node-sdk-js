import { EncodedTokenModuleEvent, TransactionEventTag } from '../types.js';
import { TokenOperationType } from './TokenOperation.js';
import { Cbor, TokenHolder, TokenId } from './index.js';

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
 * The structure of any list update event for a PLT.
 */
export type TokenListUpdateEventDetails = {
    /** The target of the list update. */
    target: TokenHolder.Type;
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
 * A union of all token module events.
 */
export type TokenModuleEvent =
    | TokenAddAllowListEvent
    | TokenAddDenyListEvent
    | TokenRemoveAllowListEvent
    | TokenRemoveDenyListEvent
    | TokenPauseEvent
    | TokenUnpauseEvent;

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
    switch (event.type) {
        case TokenOperationType.AddAllowList:
        case TokenOperationType.RemoveAllowList:
        case TokenOperationType.AddDenyList:
        case TokenOperationType.RemoveDenyList:
            return { ...event, type: event.type, details: Cbor.decode(event.details, 'TokenListUpdateEventDetails') };
        case TokenOperationType.Pause:
        case TokenOperationType.Unpause:
            return { ...event, type: event.type, details: Cbor.decode(event.details, 'TokenPauseEventDetails') };
        default:
            throw new Error(`Cannot parse event as token module event: ${event.type}`);
    }
}
