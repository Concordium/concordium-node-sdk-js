import { Buffer } from 'buffer/index.js';

import { BlockHash, TransactionHash } from '../../types/index.js';
import { CredentialContextLabel, GivenContext } from './types.js';

export type GivenContextJSON = {
    label: CredentialContextLabel | string;
    context: string;
};

export function givenContextToJSON(context: GivenContext): GivenContextJSON {
    switch (context.label) {
        case 'Nonce':
        case 'PaymentHash':
            return { ...context, context: new Buffer(context.context as Uint8Array).toString('hex') };
        case 'BlockHash':
            return { ...context, context: context.context.toJSON() };
        case 'ConnectionID':
        case 'ResourceID':
        case 'ContextString':
        default:
            return context;
    }
}

export function givenContextFromJSON(context: GivenContextJSON): GivenContext {
    switch (context.label) {
        case 'Nonce':
        case 'PaymentHash':
            return { label: 'Nonce', context: new Uint8Array(Buffer.from(context.context, 'hex')) };
        case 'BlockHash':
            return { label: 'BlockHash', context: BlockHash.fromJSON(context.context) };
        case 'ConnectionID':
        case 'ResourceID':
        case 'ContextString':
        default:
            return context as GivenContext;
    }
}
