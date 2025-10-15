import { CryptographicParameters, HexString } from '../../index.js';
import { ConcordiumWeakLinkingProofV1, DIDString } from '../../types/VerifiablePresentation.ts';
import {
    AccountCredentialStatement,
    CommitmentInput,
    CredentialsInputs,
    IdentityCredentialStatement,
    Web3IdCredentialStatement,
} from '../../web3-id/index.js';
import * as Request from './request.js';
import { GivenContext, ZKProofV4 } from './types.ts';

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

export type IdentityBasedCredential = {
    type: ['VerifiableCredential', 'ConcordiumVerifiableCredentialV1', 'ConcordiumIDBasedCredential'];
    // The person this statement is about
    credentialSubject: {
        // The identity disclosure information also acts as ephemeral ID
        id: HexString;
        // Statements (should match request)
        statements: IdentityCredentialStatement[];
    };
    // The zero-knowledge proof for attestation.
    proof: ZKProofV4;
    // Issuer of the orignal ID credential
    issuer: DIDString;
};

export type AccountBasedCredential = {
    type: ['VerifiableCredential', 'ConcordiumVerifiableCredentialV1', 'ConcordiumAccountBasedCredential'];
    // The person this statement is about
    credentialSubject: {
        // The id is the account credential identifier
        id: DIDString;
        // Statements (should match request)
        statements: AccountCredentialStatement[];
    };
    // The zero-knowledge proof for attestation.
    proof: ZKProofV4;
    // The issuer of the ID credential used to open the account credential.
    issuer: DIDString;
};

export type Web3BasedCredential = {
    type: ['VerifiableCredential', 'ConcordiumVerifiableCredentialV1', 'ConcordiumWeb3BasedCredential'];
    // The person this statement is about
    credentialSubject: {
        // The id is the account credential identifier
        id: DIDString;
        // Statements (should match request)
        statements: Web3IdCredentialStatement[];
    };
    // The zero-knowledge proof for attestation.
    proof: ZKProofV4;
    // The issuer of the ID credential used to open the account credential.
    issuer: DIDString;
};

export type Credential = IdentityBasedCredential | AccountBasedCredential | Web3BasedCredential;

// In essence, this is more or less an opaque type and should never be handled directly. As such
// this should match the serialization of the corresponding type in concordium-base
class VerifiablePresentationV1 {
    type = ['VerifiablePresentation', 'ConcordiumVerifiablePresentationV1'];

    constructor(
        public readonly presentationContext: Context,
        public readonly verifiableCredential: Credential[],
        // only present if the verifiable credential includes an account based credential
        public readonly proof?: ConcordiumWeakLinkingProofV1
    ) {}
}

export type Type = VerifiablePresentationV1;

export function create(
    request: Request.Type,
    input: CommitmentInput,
    context: Context,
    cryptographicParameters: CryptographicParameters
): VerifiablePresentationV1 {
    // NOTE: this calls into concordium-base bindings to generate the proof
    throw new Error('not implemented');
}

export function verify(
    presentation: VerifiablePresentationV1,
    request: Request.Type,
    cryptographicParameters: CryptographicParameters,
    publicData: CredentialsInputs[]
): true | Error {
    // NOTE: this calls into concordium-base bindings to verify the proof
    throw new Error('not implemented');
}
