import * as wasm from '@concordium/rust-bindings/wallet';
import { stringify } from 'json-bigint';
import { VerifyWeb3IdCredentialSignatureInput } from '../web3-id/helpers.ts';
import {
    CredentialsInputs,
    VerificationResult,
    Web3IdProofInput,
} from '../web3-id/types.ts';
import { VerifiablePresentation } from '../types/VerifiablePresentation.ts';
import { CryptographicParameters } from '../types.ts';

/**
 * Verifies that the given signature is correct for the given values/randomness/holder/issuerPublicKey/issuerContract
 */
export function verifyWeb3IdCredentialSignature(
    input: VerifyWeb3IdCredentialSignatureInput
): boolean {
    // Use json-bigint stringify to ensure we can handle bigints
    return wasm.verifyWeb3IdCredentialSignature(stringify(input));
}

/**
 * Given a statement about an identity and the inputs necessary to prove the statement, produces a proof that the associated identity fulfills the statement.
 */
export function getVerifiablePresentation(
    input: Web3IdProofInput
): VerifiablePresentation {
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

// TODO: document
export function verifyPresentation(
    presentation: VerifiablePresentation,
    globalContext: CryptographicParameters,
    credentialInputs: CredentialsInputs
): VerificationResult {
    const result = wasm.verifyPresentation(
        JSON.stringify(presentation),
        JSON.stringify(globalContext),
        JSON.stringify(credentialInputs)
    );
    return JSON.parse(result);
}
