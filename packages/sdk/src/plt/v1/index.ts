import { V1TokenClient } from './TokenClient.js';
import { type V1TokenTransfer, V1_TOKEN_MODULE_REF } from './types.js';

export namespace V1 {
    export type Transfer = V1TokenTransfer;
    export class TokenClient extends V1TokenClient {}
    export const TOKEN_MODULE_REF = V1_TOKEN_MODULE_REF;
}
