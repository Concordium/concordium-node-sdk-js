import { cborDecode } from '../types/cbor.js';
import { CborAccountAddress, TokenAmount } from './index.js';
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
 * Represents a token module reject reason (found when decoding) unknown to the SDK.
 */
export type UnknownTokenRejectReason = Omit<EncodedTokenModuleRejectReason, 'details'> & {
    /** Additional details about the rejection. */
    details: unknown;
};

/**
 * The details of an "addressNotFound": an account address was not valid.
 */
export type AddressNotFoundDetails = {
    /** The index in the list of operations of the failing operation. */
    index: number;
    /** The address that could not be resolved. */
    address: CborAccountAddress.Type;
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
    address?: CborAccountAddress.Type;
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

function parseAddressNotFound(decoded: unknown): AddressNotFoundDetails {
    if (typeof decoded !== 'object' || decoded === null) {
        throw new Error(`Invalid reason details: ${JSON.stringify(decoded)}. Expected an object.`);
    }
    // required
    if (!('index' in decoded) || typeof decoded.index !== 'number') {
        throw new Error(`Invalid reason details: ${JSON.stringify(decoded)}. Expected 'index' to be a number`);
    }
    // required
    if (!('address' in decoded) || !CborAccountAddress.instanceOf(decoded.address)) {
        throw new Error(
            `Invalid reason details: ${JSON.stringify(decoded)}. Expected 'address' to be a CborAccountAddress`
        );
    }

    return decoded as AddressNotFoundDetails;
}

function parseMintWouldOverflow(decoded: unknown): MintWouldOverflowDetails {
    if (typeof decoded !== 'object' || decoded === null) {
        throw new Error(`Invalid reason details: ${JSON.stringify(decoded)}. Expected an object.`);
    }
    // required
    if (!('index' in decoded) || typeof decoded.index !== 'number') {
        throw new Error(`Invalid reason details: ${JSON.stringify(decoded)}. Expected 'index' to be a number`);
    }
    // required
    if (!('requestedAmount' in decoded) || !TokenAmount.instanceOf(decoded.requestedAmount)) {
        throw new Error(
            `Invalid reason details: ${JSON.stringify(decoded)}. Expected 'requestedAmount' to be a TokenAmount`
        );
    }
    // required
    if (!('currentSupply' in decoded) || !TokenAmount.instanceOf(decoded.currentSupply)) {
        throw new Error(
            `Invalid reason details: ${JSON.stringify(decoded)}. Expected 'currentSupply' to be a TokenAmount`
        );
    }
    // required
    if (!('maxRepresentableAmount' in decoded) || !TokenAmount.instanceOf(decoded.maxRepresentableAmount)) {
        throw new Error(
            `Invalid reason details: ${JSON.stringify(decoded)}. Expected 'maxRepresentableAmount' to be a TokenAmount`
        );
    }
    return decoded as MintWouldOverflowDetails;
}

function parseTokenBalanceInsufficient(decoded: unknown): TokenBalanceInsufficientDetails {
    if (typeof decoded !== 'object' || decoded === null) {
        throw new Error(`Invalid reason details: ${JSON.stringify(decoded)}. Expected an object.`);
    }
    // required
    if (!('index' in decoded) || typeof decoded.index !== 'number') {
        throw new Error(`Invalid reason details: ${JSON.stringify(decoded)}. Expected 'index' to be a number`);
    }
    // required
    if (!('availableBalance' in decoded) || !TokenAmount.instanceOf(decoded.availableBalance)) {
        throw new Error(
            `Invalid reason details: ${JSON.stringify(decoded)}. Expected 'availableBalance' to be a TokenAmount`
        );
    }
    // required
    if (!('requiredBalance' in decoded) || !TokenAmount.instanceOf(decoded.requiredBalance)) {
        throw new Error(
            `Invalid reason details: ${JSON.stringify(decoded)}. Expected 'requiredBalance' to be a TokenAmount`
        );
    }
    return decoded as TokenBalanceInsufficientDetails;
}

function parseDeserializationFailure(decoded: unknown): DeserializationFailureDetails {
    if (typeof decoded !== 'object' || decoded === null) {
        throw new Error(`Invalid reason details: ${JSON.stringify(decoded)}. Expected an object.`);
    }
    // optional
    if ('cause' in decoded && typeof decoded.cause !== 'string') {
        throw new Error(
            `Invalid reason details: ${JSON.stringify(decoded)}. Expected 'cause' to be a string if present`
        );
    }
    return decoded as DeserializationFailureDetails;
}

function parseUnsupportedOperation(decoded: unknown): UnsupportedOperationDetails {
    if (typeof decoded !== 'object' || decoded === null) {
        throw new Error(`Invalid reason details: ${JSON.stringify(decoded)}. Expected an object.`);
    }
    // required
    if (!('index' in decoded) || typeof decoded.index !== 'number') {
        throw new Error(`Invalid reason details: ${JSON.stringify(decoded)}. Expected 'index' to be a number`);
    }
    // required
    if (!('operationType' in decoded) || typeof decoded.operationType !== 'string') {
        throw new Error(`Invalid reason details: ${JSON.stringify(decoded)}. Expected 'operationType' to be a string`);
    }
    // optional
    if ('reason' in decoded && typeof decoded.reason !== 'string') {
        throw new Error(
            `Invalid reason details: ${JSON.stringify(decoded)}. Expected 'reason' to be a string if present`
        );
    }
    return decoded as UnsupportedOperationDetails;
}

function parseOperationNotPermitted(decoded: unknown): OperationNotPermittedDetails {
    if (typeof decoded !== 'object' || decoded === null) {
        throw new Error(`Invalid reason details: ${JSON.stringify(decoded)}. Expected an object.`);
    }
    // required
    if (!('index' in decoded) || typeof decoded.index !== 'number') {
        throw new Error(`Invalid reason details: ${JSON.stringify(decoded)}. Expected 'index' to be a number`);
    }
    // optional
    if ('address' in decoded && !CborAccountAddress.instanceOf(decoded.address)) {
        throw new Error(
            `Invalid reason details: ${JSON.stringify(decoded)}. Expected 'address' to be a CborAccountAddress if present`
        );
    }
    // optional
    if ('reason' in decoded && typeof decoded.reason !== 'string') {
        throw new Error(
            `Invalid reason details: ${JSON.stringify(decoded)}. Expected 'reason' to be a string if present`
        );
    }
    return decoded as OperationNotPermittedDetails;
}

/**
 * Parses a token module reject reason, decoding the details from CBOR format.
 *
 * @param rejectReason - The token module reject reason to parse.
 * @returns The parsed token module reject reason with decoded details.
 *
 * @example
 * const parsedReason = parseTokenModuleRejectReason(encodedReason);
 * switch (parsedReason.type) {
 *   // typed details are now available, e.g.:
 *   case TokenRejectReasonType.MintWouldOverflow: console.log(parsedReason.requestedAmount);
 *   ...
 *   default: console.warn('Unknown reject reason:', parsedReason);
 * }
 */
export function parseTokenModuleRejectReason(
    rejectReason: EncodedTokenModuleRejectReason
): TokenModuleRejectReason | UnknownTokenRejectReason {
    const decoded = cborDecode(rejectReason.details.bytes);
    switch (rejectReason.type) {
        case TokenRejectReasonType.AddressNotFound:
            return { ...rejectReason, type: rejectReason.type, details: parseAddressNotFound(decoded) };
        case TokenRejectReasonType.MintWouldOverflow:
            return { ...rejectReason, type: rejectReason.type, details: parseMintWouldOverflow(decoded) };
        case TokenRejectReasonType.TokenBalanceInsufficient:
            return { ...rejectReason, type: rejectReason.type, details: parseTokenBalanceInsufficient(decoded) };
        case TokenRejectReasonType.DeserializationFailure:
            return { ...rejectReason, type: rejectReason.type, details: parseDeserializationFailure(decoded) };
        case TokenRejectReasonType.UnsupportedOperation:
            return { ...rejectReason, type: rejectReason.type, details: parseUnsupportedOperation(decoded) };
        case TokenRejectReasonType.OperationNotPermitted:
            return { ...rejectReason, type: rejectReason.type, details: parseOperationNotPermitted(decoded) };
        default:
            return { ...rejectReason, details: decoded };
    }
}
