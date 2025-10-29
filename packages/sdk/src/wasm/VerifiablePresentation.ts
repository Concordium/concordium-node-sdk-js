import * as wasm from '@concordium/rust-bindings/wallet';
import { stringify } from 'json-bigint';

import { CryptographicParameters } from '../types.ts';
import { CommitmentInput, CredentialsInputs, VerifiablePresentation } from '../types/VerifiablePresentation.ts';
import { VerifyWeb3IdCredentialSignatureInput } from '../web3-id/helpers.ts';
import { AtomicStatementV2, DIDString } from '../web3-id/types.ts';

/**
 * Verifies that the given signature is correct for the given values/randomness/holder/issuerPublicKey/issuerContract
 */
export function verifyWeb3IdCredentialSignature(input: VerifyWeb3IdCredentialSignatureInput): boolean {
    // Use json-bigint stringify to ensure we can handle bigints
    return wasm.verifyWeb3IdCredentialSignature(stringify(input));
}

export type RequestStatement<AttributeKey = string> = {
    id: DIDString;
    statement: AtomicStatementV2<AttributeKey>[];
    /** The type field is present iff the request is for a verifiable credential */
    type?: string[];
};

export function isVerifiableCredentialRequestStatement(statement: RequestStatement): boolean {
    return Boolean(statement.type);
}

/**
 * Describes a proof request which is at the core of computing the corresponding proof.
 */
export type Web3IdProofRequest = {
    /** The challenge of the proof */
    challenge: string;
    /** The statements paired with the credential IDs to prove them for */
    credentialStatements: RequestStatement[];
};

/**
 * The input to {@linkcode getVerifiablePresentation}
 */
export type Web3IdProofInput = {
    request: Web3IdProofRequest;
    globalContext: CryptographicParameters;
    commitmentInputs: CommitmentInput[];
};

/**
 * Given a statement about an identity and the inputs necessary to prove the statement, produces a proof that the associated identity fulfills the statement.
 */
export function getVerifiablePresentation(input: Web3IdProofInput): VerifiablePresentation {
    try {
        const s: VerifiablePresentation = VerifiablePresentation.fromString(
            // Use json-bigint stringify to ensure we can handle bigints
            wasm.createWeb3IdProof(stringify(input))
        );
        return s;
    } catch (e) {
        throw new Error(e as string);
    }
}

/**
 * Verify the proofs contained in the {@linkcode VerifiablePresentation}.
 *
 * @param presentation - The verifiable presentation to verify.
 * @param globalContext - The cryptographic parameters of the chain the presentation is created on.
 * @param publicData - The public data corresponding to the proofs contained in the presentation.
 *
 * @returns The request corresponding to the verifable presentation, if verification is successful.
 * @throws If the verification is not successful for any reason.
 */
export function verifyPresentation(
    presentation: VerifiablePresentation,
    globalContext: CryptographicParameters,
    publicData: CredentialsInputs[]
): Web3IdProofRequest {
    const input = stringify({ presentation, globalContext, publicData });
    const result = wasm.verifyPresentation(input);
    return JSON.parse(result);
}
