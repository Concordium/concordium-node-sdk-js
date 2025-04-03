import * as AccountAddress from '../../types/AccountAddress.js';
import { TokenAmount, TokenModuleReference } from "../types.js"

/**
 * The structure of a PLT V1 token transfer
 */
export type V1TokenTransfer = {
    /** The amount to transfer */
    amount: TokenAmount.Type,
    /** The recipient of the transfer */
    recipient: AccountAddress.Type,
    /** An optional memo for the transfer. A string will be cbor encoded, while raw bytes are included in the
     * transaction as is. */
    memo?: string | ArrayBuffer,
}

export const V1_TOKEN_MODULE_REF = TokenModuleReference.fromHexString('0EA8121FDC427C9B23AE5E26CFEA3E8CBB544C84AA0C82DB26A85949CE1706C3'); // TODO: get the correct module reference...
