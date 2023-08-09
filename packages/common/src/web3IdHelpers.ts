import * as wasm from '@concordium/rust-bindings';
import { stringify } from 'json-bigint';
import { ContractAddress, CryptographicParameters } from './types';

export type VerifyWeb3IdCredentialSignatureInput = {
    globalContext: CryptographicParameters;
    signature: string;
    values: Record<string, string | bigint | number>;
    randomness: Record<string, string>;
    holder: string;
    issuerPublicKey: string;
    issuerContract: ContractAddress;
};

/**
 * Verifies that the given signature is correct for the given values/randomness/holder/issuerPublicKey/issuerContract
 */
export function verifyWeb3IdCredentialSignature(
    input: VerifyWeb3IdCredentialSignatureInput
): boolean {
    // Use json-bigint stringify to ensure we can handle bigints
    return wasm.verifyWeb3IdCredentialSignature(stringify(input));
}
