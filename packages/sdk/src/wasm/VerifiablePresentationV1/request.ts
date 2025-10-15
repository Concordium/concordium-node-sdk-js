import { TransactionHash } from '../../types/index.js';
import { CredentialStatement } from '../../web3-id/types.js';
import { CredentialContextLabel, GivenContext } from './types.ts';

// NOTE: renamed from ContextInformation
export type Context = {
    type: 'ConcordiumContextInformationV1';
    given: GivenContext[];
    requested: CredentialContextLabel[];
};

export function computeAnchor(context: Context, credentialStatements: CredentialStatement[]): Uint8Array {
    // NOTE: this calls into concordium-base bindings to compute the presentation anchor.
    throw new Error('not implemented');
}

// TODO: Should match the w3c spec for a verifiable presentation request and the corresponding
// serde impmlementation in concordium-base
export type JSON = void;

class VerifiablePresentationRequestV1 {
    type = 'ConcordiumVPRequestV1';

    constructor(
        public readonly context: Context,
        public readonly credentialStatements: CredentialStatement[],
        public readonly transactionRef: TransactionHash.Type // renamed from requestTX
    ) {}

    public toJSON(): JSON {
        throw new Error('not implemented');
    }
}

export type Type = VerifiablePresentationRequestV1;

export function fromJSON(json: JSON): VerifiablePresentationRequestV1 {
    throw new Error('not implemented');
}

export function create(
    context: Context,
    credentialStatements: CredentialStatement[],
    transactionRef: TransactionHash.Type
): VerifiablePresentationRequestV1 {
    return new VerifiablePresentationRequestV1(context, credentialStatements, transactionRef);
}
