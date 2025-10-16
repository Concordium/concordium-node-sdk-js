// TODO: remove any eslint disable once fully implemented

/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    AttributeKey,
    ConcordiumGRPCClient,
    CryptographicParameters,
    DataBlob,
    HexString,
    Network,
    TransactionHash,
    TransactionKindString,
    TransactionStatusEnum,
    TransactionSummaryType,
    VerifiablePresentationRequestV1,
    isKnown,
    sha256,
} from '../../index.js';
import { ConcordiumWeakLinkingProofV1 } from '../../types/VerifiablePresentation.js';
import { bail } from '../../util.js';
import {
    AtomicStatementV2,
    CommitmentInput,
    CredentialRequestStatement,
    CredentialsInputs,
    DIDString,
    IdentityCommitmentInput,
    IdentityCredentialRequestStatement,
    createAccountDID,
    isAccountCredentialRequestStatement,
    isIdentityCredentialRequestStatement,
} from '../../web3-id/index.js';
import { Web3IdProofRequest, getVerifiablePresentation } from '../web3Id.js';
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
export function createContext(requestContext: Request.Context, filledRequestedContext: GivenContext[]): Context {
    // First we validate that the requested context is filled in `filledRequestedContext`.
    if (requestContext.requested.length !== filledRequestedContext.length)
        throw new Error('Mismatch between amount of requested context and filled context');
    requestContext.requested.every(
        (requestedLabel) =>
            filledRequestedContext.some((requestedData) => requestedData.label === requestedLabel) ||
            bail(`No data for requested context ${requestedLabel} found`)
    );
    return { type: 'ConcordiumContextInformationV1', given: requestContext.given, requested: filledRequestedContext };
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

function createIdentityCredentialStub(
    { id, statement }: IdentityCredentialRequestStatement,
    ipIndex: number
): IdentityBasedCredential {
    const network = id.split(':')[1] as Network;
    const proof: ZKProofV4 = {
        type: 'ConcordiumZKProofV4',
        createdAt: new Date().toISOString(),
        proofValue: '0102'.repeat(32),
    };
    const credentialSubject: IdentityBasedCredential['credentialSubject'] = {
        statement: statement,
        id: '123456'.repeat(8),
    };
    return {
        type: ['VerifiableCredential', 'ConcordiumVerifiableCredentialV1', 'ConcordiumIDBasedCredential'],
        proof,
        issuer: `ccd:${network.toLowerCase()}:idp:${ipIndex}`,
        credentialSubject,
    };
}

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

export async function createFromAnchor(
    grpc: ConcordiumGRPCClient,
    presentationRequest: VerifiablePresentationRequestV1.Type,
    requestStatements: CredentialRequestStatement[],
    inputs: CommitmentInput[],
    additionalContext: GivenContext[],
    globalContext: CryptographicParameters
): Promise<VerifiablePresentationV1> {
    const transaction = await grpc.getBlockItemStatus(presentationRequest.transactionRef);
    if (transaction.status !== TransactionStatusEnum.Finalized) {
        throw new Error('anchor reference not finalized');
    }
    const { summary, blockHash } = transaction.outcome;
    if (
        !isKnown(summary) ||
        summary.type !== TransactionSummaryType.AccountTransaction ||
        summary.transactionType !== TransactionKindString.RegisterData
    ) {
        throw new Error('Unexpected transaction type found for anchor reference');
    }
    const expectedAnchor = VerifiablePresentationRequestV1.computeAnchor(
        presentationRequest.context,
        presentationRequest.credentialStatements
    );
    if ((new DataBlob(expectedAnchor).toJSON(), summary.dataRegistered.data)) {
        throw new Error('presentation anchor verification failed.');
    }

    const blockContext: GivenContext = { label: 'BlockHash', context: blockHash };
    const proofContext = createContext(presentationRequest.context, [...additionalContext, blockContext]);
    return create(requestStatements, inputs, proofContext, globalContext);
}

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
    const idStatements: [number, IdentityCredentialRequestStatement][] = [];
    const compatibleStatements: Exclude<CredentialRequestStatement, IdentityCredentialRequestStatement>[] = [];
    requestStatements.forEach((s, i) => {
        if (isIdentityCredentialRequestStatement(s)) idStatements.push([i, s]);
        else compatibleStatements.push(s);
    });

    // correspondingly, filter out the the inputs for identity credentials
    const idInputs = inputs.filter((ci) => ci.type === 'identityCredentials') as IdentityCommitmentInput[];
    const compatibleInputs = inputs.filter((ci) => ci.type !== 'identityCredentials');

    if (idStatements.length !== idInputs.length) throw new Error('Mismatch between provided statements and inputs');

    const challenge = sha256([Buffer.from(JSON.stringify([compatibleStatements, proofContext]))]).toString('hex');
    const request: Web3IdProofRequest = { challenge, credentialStatements: compatibleStatements };

    const { verifiableCredential, proof } = getVerifiablePresentation({
        commitmentInputs: compatibleInputs,
        globalContext,
        request,
    });
    // Map the output to match the format of the V1 protocol.
    const compatibleCredentials: Credential[] = verifiableCredential.map<Credential>((c, i) => {
        const { proof, ...credentialSubject } = c.credentialSubject;
        const { created, type: _type, ...proofValues } = proof;
        const type = isAccountCredentialRequestStatement(compatibleStatements[i])
            ? 'ConcordiumAccountBasedCredential'
            : 'ConcordiumWeb3BasedCredential';
        return {
            proof: { createdAt: created, type: 'ConcordiumZKProofV4', proofValue: JSON.stringify(proofValues) },
            issuer: c.issuer,
            type: ['VerifiableCredential', 'ConcordiumVerifiableCredentialV1', type] as any,
            credentialSubject,
        };
    });
    // and add stubbed ID credentials in
    const idCredentials: [number, IdentityBasedCredential][] = idStatements.map(([originalIndex, statement], i) => [
        originalIndex,
        createIdentityCredentialStub(statement, idInputs[i].context.ipInfo.ipIdentity),
    ]);

    const credentials: Credential[] = [];
    let compatibleCounter = 0;
    for (let i = 0; i < requestStatements.length; i += 1) {
        const idCred = idCredentials.find((entry) => entry[0] === i);
        if (idCred !== undefined) {
            credentials.push(idCred[1]);
        } else {
            credentials.push(compatibleCredentials[compatibleCounter]);
            compatibleCounter += 1;
        }
    }

    return new VerifiablePresentationV1(proofContext, credentials, proof);
}

export function fromJSON(json: VerifiablePresentationV1): VerifiablePresentationV1 {
    return new VerifiablePresentationV1(json.presentationContext, json.verifiableCredential, json.proof);
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
