/**
 * Internal CBOR detail parsers shared between TokenOperation and Operation decoders.
 * Not part of the public SDK surface — import directly from this module, not through the barrel.
 */
import * as CborAccountAddress from './CborAccountAddress.js';
import * as CborMemo from './CborMemo.js';
import * as TokenAmount from './TokenAmount.js';
import { TokenOperationType } from './TokenOperation.js';
import type {
    TokenListUpdate,
    TokenMetadataUrlDetails,
    TokenOperation,
    TokenSupplyUpdate,
    TokenTransfer,
    TokenUpdateAdminRolesDetails,
    UnknownTokenOperation,
} from './TokenOperation.js';

export function parseTransfer(details: unknown): TokenTransfer {
    if (typeof details !== 'object' || details === null)
        throw new Error(`Invalid transfer details: ${JSON.stringify(details)}. Expected an object.`);

    const value = details as Record<string, unknown>;
    if (!TokenAmount.instanceOf(value.amount))
        throw new Error(`Invalid transfer details: ${JSON.stringify(details)}. Expected 'amount' to be a TokenAmount`);
    if (!CborAccountAddress.instanceOf(value.recipient))
        throw new Error(
            `Invalid transfer details: ${JSON.stringify(details)}. Expected 'recipient' to be a TokenHolder`
        );
    if (value.memo !== undefined && !(value.memo instanceof Uint8Array || CborMemo.instanceOf(value.memo)))
        throw new Error(
            `Invalid transfer details: ${JSON.stringify(details)}. Expected 'memo' to be Uint8Array | CborMemo`
        );

    return {
        amount: value.amount,
        recipient: value.recipient,
        memo: value.memo,
    };
}

export function parseSupplyUpdate(details: unknown): TokenSupplyUpdate {
    if (typeof details !== 'object' || details === null) {
        throw new Error(`Invalid supply update details: ${JSON.stringify(details)}. Expected an object.`);
    }

    const value = details as Record<string, unknown>;
    if (!TokenAmount.instanceOf(value.amount))
        throw new Error(
            `Invalid supply update details: ${JSON.stringify(details)}. Expected 'amount' to be a TokenAmount`
        );

    return {
        amount: value.amount,
    };
}

export function parseListUpdate(details: unknown): TokenListUpdate {
    if (typeof details !== 'object' || details === null)
        throw new Error(`Invalid list update details: ${JSON.stringify(details)}. Expected an object.`);

    const value = details as Record<string, unknown>;
    if (!CborAccountAddress.instanceOf(value.target))
        throw new Error(
            `Invalid list update details: ${JSON.stringify(details)}. Expected 'target' to be a TokenHolder`
        );

    return {
        target: value.target,
    };
}

export function parseEmpty(details: unknown): {} {
    if (typeof details !== 'object' || details === null || Object.keys(details as object).length !== 0)
        throw new Error(`Invalid operation details: ${JSON.stringify(details)}. Expected empty object {}`);
    return details;
}

/** Validate known metadata update fields, ignoring extras used by initialization/events. */
export function parseMetadataUpdate(details: unknown): TokenMetadataUrlDetails {
    if (typeof details !== 'object' || details === null) throw new Error('Invalid metadata update details');
    const value = details as Record<string, unknown>;
    if (typeof value.url !== 'string') throw new Error('Invalid metadata update URL');
    if (
        value.checksumSha256 !== undefined &&
        (!(value.checksumSha256 instanceof Uint8Array) || value.checksumSha256.length !== 32)
    )
        throw new Error('Invalid metadata update checksum');
    return { url: value.url, ...(value.checksumSha256 === undefined ? {} : { checksumSha256: value.checksumSha256 }) };
}

export function parseAdminRoles(details: unknown): TokenUpdateAdminRolesDetails {
    if (typeof details !== 'object' || details === null) throw new Error('Invalid admin roles details');
    const value = details as Record<string, unknown>;
    if (
        !CborAccountAddress.instanceOf(value.account) ||
        !Array.isArray(value.roles) ||
        !value.roles.every((role) => typeof role === 'string')
    )
        throw new Error('Invalid admin roles details');
    return value as TokenUpdateAdminRolesDetails;
}

/**
 * Decode a single token operation from CBOR. Throws on invalid shapes, only returns Unknown variant when the key is unrecognized.
 */
export function parseTokenOperation(decoded: unknown): TokenOperation | UnknownTokenOperation {
    if (typeof decoded !== 'object' || decoded === null)
        throw new Error(`Invalid token operation: ${JSON.stringify(decoded)}. Expected an object.`);

    const keys = Object.keys(decoded);
    if (keys.length !== 1)
        throw new Error(
            `Invalid token operation: ${JSON.stringify(decoded)}. Expected an object with a single key identifying the operation type.`
        );

    const type = keys[0];
    const details = (decoded as Record<string, unknown>)[type];
    switch (type) {
        case TokenOperationType.Transfer:
            return { [type]: parseTransfer(details) };
        case TokenOperationType.Mint:
            return { [type]: parseSupplyUpdate(details) };
        case TokenOperationType.Burn:
            return { [type]: parseSupplyUpdate(details) };
        case TokenOperationType.AddAllowList:
            return { [type]: parseListUpdate(details) };
        case TokenOperationType.RemoveAllowList:
            return { [type]: parseListUpdate(details) };
        case TokenOperationType.AddDenyList:
            return { [type]: parseListUpdate(details) };
        case TokenOperationType.RemoveDenyList:
            return { [type]: parseListUpdate(details) };
        case TokenOperationType.Pause:
            return { [type]: parseEmpty(details) };
        case TokenOperationType.Unpause:
            return { [type]: parseEmpty(details) };
        case TokenOperationType.UpdateMetadata:
            return { [type]: parseMetadataUpdate(details) };
        case TokenOperationType.AssignAdminRoles:
        case TokenOperationType.RevokeAdminRoles:
            return { [type]: parseAdminRoles(details) };
        default:
            return decoded as UnknownTokenOperation;
    }
}
