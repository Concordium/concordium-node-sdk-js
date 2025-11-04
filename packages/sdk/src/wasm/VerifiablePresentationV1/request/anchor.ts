import { sha256 } from '../../../hash.js';
import { cborDecode, cborEncode } from '../../../types/cbor.js';
import { GivenContext } from '../types.js';
import { Context, Statement } from './unfilled-request.js';

const VERSION = 1;

/**
 * Data structure for CBOR-encoded verification request anchors.
 * This format is used when storing an anchor of a concordium unfilled presentation request
 * on the Concordium blockchain.
 */
type Anchor = {
    /** Type identifier for Concordium Verification Request Anchor */
    type: 'CCDVRA';
    /** Version of the anchor data format */
    version: typeof VERSION;
    /** Hash of the presentation request */
    // TODO: maybe use a specific type for sha256 hash
    hash: Uint8Array;
    /** Optional public information that can be included in the anchor */
    public?: Record<string, any>;
};

/**
 * Data structure for CBOR-encoded verification request anchors.
 * This format is used when storing an anchor of a concordium unfilled presentation request
 * on the Concordium blockchain.
 */
export type Type = Anchor;

/**
 * Creates a CBOR-encoded anchor for an unfilled verifiable presentation request.
 *
 * This function creates a standardized CBOR-encoded representation of the
 * presentation request that can be stored on the Concordium blockchain as
 * transaction data. The anchor includes a hash of the request and optional
 * public metadata.
 *
 * @param context - The context information for the request
 * @param credentialStatements - The credential statements being requested
 * @param publicInfo - Optional public information to include in the anchor
 *
 * @returns CBOR-encoded anchor data suitable for blockchain storage
 */
export function createAnchor(
    context: Context,
    credentialStatements: Statement[],
    publicInfo?: Record<string, any>
): Uint8Array {
    const hash = computeAnchorHash(context, credentialStatements);
    const data: Anchor = { type: 'CCDVRA', version: VERSION, hash, public: publicInfo };
    return cborEncode(data);
}

/**
 * Computes a hash of the presentation request context and statements.
 *
 * This hash is used to create a tamper-evident anchor that can be stored
 * on-chain to prove the request was made at a specific time and with
 * specific parameters.
 *
 * @param context - The context information for the request
 * @param credentialStatements - The credential statements being requested
 *
 * @returns SHA-256 hash of the serialized request data
 */
export function computeAnchorHash(context: Context, credentialStatements: Statement[]): Uint8Array {
    // TODO: this is a quick and dirty anchor implementation that needs to be replaced with
    // proper serialization, which is TBD.
    const sanitizedContext: Context = {
        ...context,
        given: context.given.map(
            (c) =>
                ({
                    ...c,
                    // convert any potential `Buffer` instances to raw Uint8Array to avoid discrepancies when decoding
                    context: c.context instanceof Uint8Array ? Uint8Array.from(c.context) : c.context,
                }) as GivenContext
        ),
    };
    const contextDigest = cborEncode(sanitizedContext);
    const statementsDigest = cborEncode(credentialStatements);
    return Uint8Array.from(sha256([contextDigest, statementsDigest]));
}

/**
 * Decodes a CBOR-encoded verifiable presentation request anchor.
 *
 * This function parses and validates a CBOR-encoded anchor that was previously
 * created with `createAnchor`. It ensures the anchor has the correct format
 * and contains all required fields.
 *
 * @param cbor - The CBOR-encoded anchor data to decode
 * @returns The decoded anchor data structure
 * @throws Error if the CBOR data is invalid or doesn't match expected format
 */
export function decodeAnchor(cbor: Uint8Array): Anchor {
    const value = cborDecode(cbor);
    if (typeof value !== 'object' || value === null) throw new Error('Expected a cbor encoded object');
    // required fields
    if (!('type' in value) || value.type !== 'CCDVRA') throw new Error('Expected "type" to be "CCDVRA"');
    if (!('version' in value) || value.version !== VERSION) throw new Error('Expected "version" to be 1');
    if (!('hash' in value) || !(value.hash instanceof Uint8Array))
        throw new Error('Expected "hash" to be a Uint8Array');
    // optional fields
    if ('public' in value && typeof value.public !== 'object') throw new Error('Expected "public" to be an object');
    return value as Anchor;
}
