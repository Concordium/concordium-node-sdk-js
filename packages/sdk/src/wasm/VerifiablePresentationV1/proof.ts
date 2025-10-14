import * as Request from './request.js';
import { AccountCredDID, GivenContext, IdCredentialStatement, IdentityProviderDID } from './shared.js';

// Context for the proof part.
// NOTE: renamed from FilledContextInformation
export type Context = {
    type: 'ConcordiumContextInformationV1';
    given: GivenContext[];
    requested: GivenContext[];
};

// Fails if not given the full amount of requested context.
export function createContext(context: Request.Context, requestedContextData: GivenContext[]): Context {
    throw new Error('not implemented');
}

type ConcordiumZKProofV4 = {
    type: 'ConcordiumZKProofV4';
    createdAt: Date; // Explicit type, JSON: ISO format
    proofValue: Uint8Array; // Explicit type, JSON: hex encoding of proof + aux data
};

type WeakLinkingProofV1 = {
    type: 'ConcordiumWeakLinkingProofV1';
    created: Date;
    proofValue: Uint8Array[];
};

type IDCredPubEncryption = Uint8Array; // right??

type IDBasedCredential = {
    type: ['VerifiableCredential', 'ConcordiumVerifiableCredentialV1', 'ConcordiumIDBasedCredential'];
    // The person this statement is about
    credentialSubject: {
        // The identity disclosure information also acts as ephemeral ID
        id: IDCredPubEncryption;
        // Statements (should match request)
        statements: IdCredentialStatement[];
    };
    // The zero-knowledge proof for attestation.
    proof: ConcordiumZKProofV4;
    // Issuer of the orignal ID credential
    issuer: IdentityProviderDID;
};

type AccountBasedCredential = {
    type: ['VerifiableCredential', 'ConcordiumVerifiableCredentialV1', 'ConcordiumAccountBaseCredential'];
    // The person this statement is about
    credentialSubject: {
        // The id is the account credential identifier
        id: AccountCredDID;
        // Statements (should match request)
        statements: IdCredentialStatement[];
    };
    // The zero-knowledge proof for attestation.
    proof: ConcordiumZKProofV4;
    // The issuer of the ID credential used to open the account credential.
    issuer: IdentityProviderDID;
};

type VerifiableCredential = IDBasedCredential | AccountBasedCredential;

// TODO: Should match the w3c spec for a verifiable presentation
type JSON = void;

class VerifiablePresentationV1 {
    type = ['VerifiablePresentation', 'ConcordiumVerifiablePresentationV1'];

    constructor(
        public readonly presentationContext: Context,
        public readonly verifiableCredential: VerifiableCredential[],
        public readonly proof?: WeakLinkingProofV1
    ) {}

    public toJSON(): JSON {}
}

export type Type = VerifiablePresentationV1;

// TODO: what's the input here?
export function create(request: Request.Type): VerifiablePresentationV1 {
    // NOTE: this calls into concordium-base bindings to generate the proof
    throw new Error('not implemented');
}

export function fromJSON(json: JSON): VerifiablePresentationV1 {
    throw new Error('not implemented');
}

// TODO: what's the input/output here?
export function verify(request: Request.Type): unknown {
    // NOTE: this calls into concordium-base bindings to verify the proof
    throw new Error('not implemented');
}
