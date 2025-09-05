import { TokenAmount, TokenHolder } from './index.js';
import { EncodedTokenModuleRejectReason } from './types.js';

export enum TokenRejectReasonType {
    AddressNotFound = 'addressNotFound',
    TokenBalanceInsufficient = 'tokenBalanceInsufficient',
    DeserializationFailure = 'deserializationFailure',
    UnsupportedOperation = 'unsupportedOperation',
    OperationNotPermitted = 'operationNotPermitted',
    MintWouldOverflow = 'mintWouldOverflow',
}

type RejectReasonGen<T extends TokenRejectReasonType, D> = Omit<EncodedTokenModuleRejectReason, 'type' | 'details'> & {
    /** The type of rejection. */
    type: T;
    /** Additional details about the rejection. */
    details: D;
};

/**
 * The details of an "addressNotFound": an account address was not valid.
 */
export type AddressNotFoundDetails = {
    /** The index in the list of operations of the failing operation. */
    index: number;
    /** The address that could not be resolved. */
    address: TokenHolder.Type;
};

/**
 * An account address was not valid.
 */
export type AddressNotFoundRejectReason = RejectReasonGen<
    TokenRejectReasonType.AddressNotFound,
    AddressNotFoundDetails
>;

/**
 * Details for a reject reason where the account's token balance is insufficient
 * for the attempted operation.
 *
 * See CIS-7: reject-reasons/tokenBalanceInsufficient
 */
export type TokenBalanceInsufficientDetails = {
    /** The index in the list of operations of the failing operation. */
    index: number;
    /** The available balance for the sender at the time of the operation. */
    availableBalance: TokenAmount.Type;
    /** The minimum required balance to perform the operation. */
    requiredBalance: TokenAmount.Type;
};

/** Typed reject reason for "tokenBalanceInsufficient". */
export type TokenBalanceInsufficientRejectReason = RejectReasonGen<
    TokenRejectReasonType.TokenBalanceInsufficient,
    TokenBalanceInsufficientDetails
>;

/**
 * Details for a reject reason where the operation payload could not be deserialized.
 *
 * See CIS-7: reject-reasons/deserializationFailure
 */
export type DeserializationFailureDetails = {
    /** Text description of the failure mode. */
    cause?: string;
};

/** Typed reject reason for "deserializationFailure". */
export type DeserializationFailureRejectReason = RejectReasonGen<
    TokenRejectReasonType.DeserializationFailure,
    DeserializationFailureDetails
>;

/**
 * Details for a reject reason where the specified operation is not supported by the module.
 *
 * See CIS-7: reject-reasons/unsupportedOperation
 */
export type UnsupportedOperationDetails = {
    /** The index in the list of operations of the failing operation. */
    index: number;
    /** The type of operation that was not supported. */
    operationType: string;
    /** The reason why the operation was not supported. */
    reason?: string;
};

/** Typed reject reason for "unsupportedOperation". */
export type UnsupportedOperationRejectReason = RejectReasonGen<
    TokenRejectReasonType.UnsupportedOperation,
    UnsupportedOperationDetails
>;

/**
 * Details for a reject reason where the operation is recognized but not permitted
 * under the current state or policy (e.g., paused, allow/deny list).
 *
 * See CIS-7: reject-reasons/operationNotPermitted
 */
export type OperationNotPermittedDetails = {
    /** The index in the list of operations of the failing operation. */
    index: number;
    /** (Optionally) the address that does not have the necessary permissions to perform the operation. */
    address?: TokenHolder.Type;
    /** The reason why the operation is not permitted. */
    reason?: string;
};

/** Typed reject reason for "operationNotPermitted". */
export type OperationNotPermittedRejectReason = RejectReasonGen<
    TokenRejectReasonType.OperationNotPermitted,
    OperationNotPermittedDetails
>;

/**
 * Details for a reject reason where minting would overflow supply constraints.
 *
 * See CIS-7: reject-reasons/mintWouldOverflow
 */
export type MintWouldOverflowDetails = {
    /** The index in the list of operations of the failing operation. */
    index: number;
    /** The requested amount to mint. */
    requestedAmount: TokenAmount.Type;
    /** The current supply of the token. */
    currentSupply: TokenAmount.Type;
    /** The maximum representable token amount. */
    maxRepresentableAmount: TokenAmount.Type;
};

/** Typed reject reason for "mintWouldOverflow". */
export type MintWouldOverflowRejectReason = RejectReasonGen<
    TokenRejectReasonType.MintWouldOverflow,
    MintWouldOverflowDetails
>;

/**
 * Union of all token module reject reasons defined by CIS-7,
 * with strongly-typed details per reason.
 *
 * @see https://proposals.concordium.com/CIS/cis-7.html#reject-reasons
 */
export type TokenModuleRejectReason =
    | AddressNotFoundRejectReason
    | TokenBalanceInsufficientRejectReason
    | DeserializationFailureRejectReason
    | UnsupportedOperationRejectReason
    | OperationNotPermittedRejectReason
    | MintWouldOverflowRejectReason;
