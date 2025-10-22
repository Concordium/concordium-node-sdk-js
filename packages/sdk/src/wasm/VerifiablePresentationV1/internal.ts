import { Buffer } from 'buffer/index.js';

import { BlockHash } from '../../types/index.js';
import { CredentialContextLabel, GivenContext } from './types.js';

/**
 * JSON representation of given context information.
 * All context data is serialized to strings for transport and storage.
 */
export type GivenContextJSON = {
    /** The label identifying the type of context */
    label: CredentialContextLabel | string;
    /** The context data serialized as a string */
    context: string;
};

/**
 * Serializes given context information to its JSON representation.
 *
 * This function handles the conversion of different context types to their
 * string representations for JSON serialization. Binary data is converted
 * to hex strings, while other data types are handled appropriately.
 *
 * @param context - The context information to serialize
 * @returns The JSON representation of the context
 */
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

/**
 * Deserializes given context information from its JSON representation.
 *
 * This function handles the conversion of JSON string representations back
 * to their proper types. Hex strings are converted back to Uint8Arrays,
 * and other types are handled appropriately.
 *
 * @param context - The JSON representation to deserialize
 * @returns The deserialized context information
 */
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
