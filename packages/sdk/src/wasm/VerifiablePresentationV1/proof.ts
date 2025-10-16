// TODO: remove any eslint disable once fully implemented

/* eslint-disable @typescript-eslint/no-unused-vars */
import { AttributeKey, CryptographicParameters, HexString, sha256 } from '../../index.js';
import { ConcordiumWeakLinkingProofV1, DIDString } from '../../types/VerifiablePresentation.js';
import { bail } from '../../util.js';
import {
    AtomicStatementV2,
    CommitmentInput,
    CredentialRequestStatement,
    CredentialsInputs,
    IdentityCredentialRequestStatement,
    Web3IdProofRequest,
} from '../../web3-id/index.js';
import { getVerifiablePresentation } from '../web3Id.js';
import * as Request from './request.js';
import { GivenContext, ZKProofV4 } from './types.js';

// Context for the proof part.
// NOTE: renamed from FilledContextInformation
export type Context = {
    type: 'ConcordiumContextInformationV1';
    given: GivenContext[];
    requested: GivenContext[];
};

// Fails if not given the full amount of requested context.
export function createContext(context: Request.Context, filledRequestedContext: GivenContext[]): Context {
    // First we validate that the requested context is filled in `filledRequestedContext`.
    context.requested.forEach(
        (requestedLabel) =>
            filledRequestedContext.some((requestedData) => requestedData.label === requestedLabel) ??
            bail(`No data for requested context ${requestedLabel} found`)
    );
    return { type: 'ConcordiumContextInformationV1', given: context.given, requested: filledRequestedContext };
}

export type IdentityBasedCredential = {
    type: ['VerifiableCredential', 'ConcordiumVerifiableCredentialV1', 'ConcordiumIDBasedCredential'];
    // The person this statement is about
    credentialSubject: {
        // The identity disclosure information also acts as ephemeral ID
        id: HexString;
        // Statements (should match request)
        statement: AtomicStatementV2<AttributeKey>[];
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
        statement: AtomicStatementV2<AttributeKey>[];
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
        statement: AtomicStatementV2<string>[];
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
    private readonly type = ['VerifiablePresentation', 'ConcordiumVerifiablePresentationV1'];

    constructor(
        public readonly presentationContext: Context,
        public readonly verifiableCredential: Credential[],
        // only present if the verifiable credential includes an account based credential
        public readonly proof?: ConcordiumWeakLinkingProofV1
    ) {}
}

export type Type = VerifiablePresentationV1;

// TODO: this entire function should call a function in @concordium/rust-bindings to create the verifiable
// presentation from the function arguments. For now, we hack something together from the old protocol which
// means filtering and mapping the input/output.
export function create(
    requestStatements: CredentialRequestStatement[],
    inputs: CommitmentInput[],
    proofContext: Context,
    globalContext: CryptographicParameters
): VerifiablePresentationV1 {
    // first we filter out the id statements, as they're not compatible with the current implementation
    // in concordium-base
    const idStatements: IdentityCredentialRequestStatement[] = [];
    const compatibleStatements: Exclude<CredentialRequestStatement, IdentityCredentialRequestStatement>[] = [];
    requestStatements.forEach((s) => {
        if (s.tag === 'id') idStatements.push(s);
        else compatibleStatements.push(s);
    });

    // correspondingly, filter out the the inputs for identity credentials
    const commitmentInputs = inputs.filter((ci) => ci.type !== 'identityCredentials');
    const challenge = sha256([Buffer.from(JSON.stringify([compatibleStatements, proofContext]))]).toString('hex');
    const request: Web3IdProofRequest = { challenge, credentialStatements: compatibleStatements };

    const { verifiableCredential, proof } = getVerifiablePresentation({
        commitmentInputs,
        globalContext,
        request,
    });
    // Map the output to match the format of the V1 protocol.
    const credentials: Credential[] = verifiableCredential.map<Credential>((c) => {
        const { proof, ...credentialSubject } = c.credentialSubject;
        const { created, type: _type, ...proofValues } = proof;
        return {
            proof: { createdAt: created, type: 'ConcordiumZKProofV4', proofValue: JSON.stringify(proofValues) },
            issuer: c.issuer,
            // NOTE: obviously, this is not the correct type def., but it's a hack anyway so we don't care.
            type: ['VerifiableCredential', 'ConcordiumVerifiableCredentialV1', '...'] as any,
            credentialSubject,
        };
    });
    return new VerifiablePresentationV1(proofContext, credentials, proof);
}

// TODO: for now this just returns true, but this should be replaced with call to the coresponding function in
// @concordium/rust-bindings that verifies the presentation in the context of the request.
export function verify(
    presentation: VerifiablePresentationV1,
    request: Request.Type,
    cryptographicParameters: CryptographicParameters,
    publicData: CredentialsInputs[]
): true | Error {
    return true;
}
