import { HexString } from '../../types.js';
import { BlockHash } from '../../types/index.js';

export type CredentialContextLabel =
    | 'ContextString'
    | 'ResourceID'
    | 'BlockHash'
    | 'PaymentHash'
    | 'ConnectionID'
    | 'Nonce';

export type GivenContext = {
    label: CredentialContextLabel;
    context: Uint8Array | string | BlockHash.Type; // TODO: make explicit variants with unknown represented as hex string.
};

export type ZKProofV4 = {
    type: 'ConcordiumZKProofV4';
    createdAt: string; // ISO formatted datetime
    // TODO: what's going on here? why is this not a `AtomicProof[]` corresponding to the `AtomicStatement[]`
    // in the statement being proven?
    proofValue: HexString; // a serialization of the proof corresponding to the credential it's contained in.
};
