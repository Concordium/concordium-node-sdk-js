import { HexString } from '../../types.js';
import { BlockHash } from '../../types/index.js';

export type CredentialContextLabel =
    | 'ContextString'
    | 'ResourceID'
    | 'BlockHash'
    | 'PaymentHash'
    | 'ConnectionID'
    | 'Nonce';

type GivenContextGen<L extends string, C> = {
    label: L;
    context: C; // TODO: make explicit variants with unknown represented as hex string.
};

type GivenContextContextString = GivenContextGen<'ContextString', string>;
type GivenContextResourceID = GivenContextGen<'ResourceID', string>;
type GivenContextBlockHash = GivenContextGen<'BlockHash', BlockHash.Type>;
type GivenContextPaymentHash = GivenContextGen<'PaymentHash', Uint8Array>; // TODO: what's this hash?
type GivenContextConnectionID = GivenContextGen<'ConnectionID', string>;
type GivenContextNonce = GivenContextGen<'Nonce', Uint8Array>; // TODO: we should probably enforce some specific length here, e.g. sha256.

export type GivenContext =
    | GivenContextContextString
    | GivenContextResourceID
    | GivenContextBlockHash
    | GivenContextPaymentHash
    | GivenContextConnectionID
    | GivenContextNonce;

export type ZKProofV4 = {
    type: 'ConcordiumZKProofV4';
    createdAt: string; // ISO formatted datetime
    // TODO: what's going on here? why is this not a `AtomicProof[]` corresponding to the `AtomicStatement[]`
    // in the statement being proven?
    proofValue: HexString; // a serialization of the proof corresponding to the credential it's contained in.
};
