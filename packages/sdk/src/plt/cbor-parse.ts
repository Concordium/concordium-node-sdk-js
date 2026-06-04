/**
 * Internal CBOR detail parsers shared between TokenOperation and MetaUpdateOperation decoders.
 * Not part of the public SDK surface — import directly from this module, not through the barrel.
 */
import * as CborAccountAddress from './CborAccountAddress.js';
import * as CborMemo from './CborMemo.js';
import * as TokenAmount from './TokenAmount.js';
import type { TokenListUpdate, TokenSupplyUpdate, TokenTransfer } from './TokenOperation.js';

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
