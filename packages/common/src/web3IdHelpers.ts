import * as wasm from '@concordium/rust-bindings';
import { stringify } from 'json-bigint';
import { ContractAddress, CryptographicParameters } from './types';

export type VerifyWeb3IdCredentialSignatureInput = {
    globalContext: CryptographicParameters;
    signature: string;
    values: Record<string, string | bigint>;
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

/**
 * Compares a and b as field elements.
 * "a < b" => compareStringAttributes(a,b) = -1;
 * "a == b" => compareStringAttributes(a,b) = 0;
 * "a > b" => compareStringAttributes(a,b) = 1;
 */
export function compareStringAttributes(a: string, b: string): number {
    return wasm.compareStringAttributes(a,b);
}

export function isStringAttributeInRange(value: string, lower: string, upper: string): boolean {
    const lowCmp = compareStringAttributes(value, lower);
    if (lowCmp < 0 ) {
        return false;
    }
    const upCmp = compareStringAttributes(value, upper);
    return upCmp < 0;
}
