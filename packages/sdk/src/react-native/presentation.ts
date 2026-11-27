import JSONbig from 'json-bigint';

import type { IdProofInput, IdProofOutput, IdStatement } from '../id/index.js';
import { parse as parseBigInt } from '../json-bigint.js';
import { getKeyDerivationNetwork } from '../networkHelpers.js';
import type { CredentialDeploymentCommitments, CryptographicParameters } from '../types.js';
import type { VerifiablePresentation } from '../types/VerifiablePresentation.js';
import type { VerificationAuditV1Input } from '../wasm/VerifiablePresentationV1/audit-record.js';
import { fromJSON as parsePresentationV1 } from '../wasm/VerifiablePresentationV1/presentation.js';
import type {
    PresentationV1Input,
    RequestJSON,
    VerifyPresentationV1Input,
} from '../wasm/VerifiablePresentationV1/proof.js';
import type { RequestAnchorInput, JSON as VerificationRequestJSON } from '../wasm/VerifiablePresentationV1/request.js';
import type { VerifyWeb3IdCredentialSignatureInput } from '../web3-id/helpers.js';
import type { CredentialsInputs, Web3IdProofInput, Web3IdProofRequest } from '../web3-id/types.js';
import { loadBindings } from './bindings.js';
import type { NativeWorkOptions } from './nativeBridge.js';

const parse = JSONbig({ useNativeBigInt: true }).parse;

export async function getIdProof(input: IdProofInput, options?: NativeWorkOptions): Promise<IdProofOutput> {
    const native = await loadBindings();
    return parse(
        await native.createIdProof(JSONbig.stringify({ ...input, net: getKeyDerivationNetwork(input.net) }), options)
    );
}

export interface VerifyIdProofInput extends IdProofOutput {
    statement: IdStatement;
    challenge: string;
    globalContext: CryptographicParameters;
    commitments: CredentialDeploymentCommitments;
}

export async function verifyIdProof(input: VerifyIdProofInput): Promise<boolean> {
    return (await loadBindings()).verifyIdProof(JSONbig.stringify(input));
}

export async function getVerifiablePresentation(
    input: Web3IdProofInput,
    options?: NativeWorkOptions
): Promise<VerifiablePresentation> {
    const native = await loadBindings();
    const { VerifiablePresentation: Presentation } = await import('../types/VerifiablePresentation.js');
    return Presentation.fromString(await native.createWeb3IdProof(JSONbig.stringify(input), options));
}

export async function verifyWeb3IdCredentialSignature(input: VerifyWeb3IdCredentialSignatureInput): Promise<boolean> {
    return (await loadBindings()).verifyWeb3IdCredentialSignature(JSONbig.stringify(input));
}

export async function verifyPresentation(
    presentation: VerifiablePresentation,
    globalContext: CryptographicParameters,
    publicData: CredentialsInputs[]
): Promise<Web3IdProofRequest> {
    return parse(
        await (await loadBindings()).verifyPresentation(JSONbig.stringify({ presentation, globalContext, publicData }))
    );
}

export async function createPresentationV1(
    input: PresentationV1Input,
    options?: NativeWorkOptions
): Promise<VerifyPresentationV1Input['presentation']> {
    const native = await loadBindings();
    return parsePresentationV1(parseBigInt(await native.createPresentationV1(JSONbig.stringify(input), options)));
}

export async function verifyPresentationV1(input: VerifyPresentationV1Input): Promise<RequestJSON> {
    return parseBigInt(await (await loadBindings()).verifyPresentationV1(JSONbig.stringify(input)));
}

type NativeRequestAnchorInput = Omit<RequestAnchorInput, 'subjectClaims'> & {
    subjectClaims: RequestAnchorInput['subjectClaims'] | VerificationRequestJSON['subjectClaims'];
};

export async function createVerificationRequestV1Anchor(input: NativeRequestAnchorInput): Promise<Uint8Array> {
    return new Uint8Array(await (await loadBindings()).createVerificationRequestV1Anchor(JSONbig.stringify(input)));
}

export async function computeVerificationRequestV1AnchorHash(input: NativeRequestAnchorInput): Promise<Uint8Array> {
    return new Uint8Array(
        await (await loadBindings()).computeVerificationRequestV1AnchorHash(JSONbig.stringify(input))
    );
}

export async function createVerificationAuditV1Anchor(input: VerificationAuditV1Input): Promise<Uint8Array> {
    return new Uint8Array(await (await loadBindings()).createVerificationAuditV1Anchor(JSONbig.stringify(input)));
}

export async function computeVerificationAuditV1AnchorHash(input: VerificationAuditV1Input): Promise<Uint8Array> {
    return new Uint8Array(await (await loadBindings()).computeVerificationAuditV1AnchorHash(JSONbig.stringify(input)));
}
