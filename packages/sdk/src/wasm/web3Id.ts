import * as wasm from '@concordium/rust-bindings/wallet';
import { stringify } from 'json-bigint';
import { VerifyWeb3IdCredentialSignatureInput } from '../web3-id/helpers.js';
import {
    CredentialsInputs,
    VerificationResult,
    Web3IdProofInput,
} from '../web3-id/types.js';
import { VerifiablePresentation } from '../types/VerifiablePresentation.js';
import { CryptographicParameters } from '../types.js';

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
    publicData: CredentialsInputs[]
): VerificationResult {
    const input = stringify({ presentation, globalContext, publicData });
    const result = wasm.verifyPresentation(input);
    return JSON.parse(result);
}
