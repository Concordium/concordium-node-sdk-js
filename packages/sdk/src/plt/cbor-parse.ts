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
    if (!('amount' in details) || !TokenAmount.instanceOf(details.amount))
        throw new Error(`Invalid transfer details: ${JSON.stringify(details)}. Expected 'amount' to be a TokenAmount`);
    if (!('recipient' in details) || !CborAccountAddress.instanceOf(details.recipient))
        throw new Error(
            `Invalid transfer details: ${JSON.stringify(details)}. Expected 'recipient' to be a TokenHolder`
        );
    if ('memo' in details && !(details.memo instanceof Uint8Array || CborMemo.instanceOf(details.memo)))
        throw new Error(
            `Invalid transfer details: ${JSON.stringify(details)}. Expected 'memo' to be Uint8Array | CborMemo`
        );
    return details as TokenTransfer;
}

export function parseSupplyUpdate(details: unknown): TokenSupplyUpdate {
    if (typeof details !== 'object' || details === null) {
        throw new Error(`Invalid supply update details: ${JSON.stringify(details)}. Expected an object.`);
    }
    if (!('amount' in details) || !TokenAmount.instanceOf(details.amount))
        throw new Error(
            `Invalid supply update details: ${JSON.stringify(details)}. Expected 'amount' to be a TokenAmount`
        );
    return details as TokenSupplyUpdate;
}

export function parseListUpdate(details: unknown): TokenListUpdate {
    if (typeof details !== 'object' || details === null)
        throw new Error(`Invalid list update details: ${JSON.stringify(details)}. Expected an object.`);
    if (!('target' in details) || !CborAccountAddress.instanceOf(details.target))
        throw new Error(
            `Invalid list update details: ${JSON.stringify(details)}. Expected 'target' to be a TokenHolder`
        );
    return details as TokenListUpdate;
}

export function parseEmpty(details: unknown): {} {
    if (typeof details !== 'object' || details === null || Object.keys(details as object).length !== 0)
        throw new Error(`Invalid operation details: ${JSON.stringify(details)}. Expected empty object {}`);
    return details;
}
