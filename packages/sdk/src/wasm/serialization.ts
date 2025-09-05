import * as wasm from '@concordium/rust-bindings/wallet';
import { Buffer } from 'buffer/index.js';
import JSONbig from 'json-bigint';

import type { CredentialDeploymentDetails, CredentialDeploymentPayload } from '../types.js';

interface DeploymentDetailsResult {
    credInfo: string;
    serializedTransaction: string;
    transactionHash: string;
}

/**
 * Gets the transaction hash that is used to look up the status of a credential
 * deployment transaction.
 * @param credentialDeployment the transaction to hash
 * @param signatures the signatures that will also be part of the hash
 * @returns the sha256 hash of the serialized block item kind, signatures, and credential deployment transaction
 */
export function getCredentialDeploymentTransactionHash(
    credentialDeployment: CredentialDeploymentDetails,
    signatures: string[]
): string {
    const credentialDeploymentInfo: DeploymentDetailsResult = JSON.parse(
        wasm.getDeploymentDetails(
            signatures,
            JSONbig.stringify(credentialDeployment.unsignedCdi),
            credentialDeployment.expiry.expiryEpochSeconds
        )
    );
    return credentialDeploymentInfo.transactionHash;
}

/**
 * Serializes a credential deployment transaction of a new account, so that it is ready for being
 * submitted to the node.
 * @param credentialDeployment the credenetial deployment transaction
 * @param signatures the signatures on the hash of unsigned credential deployment information
 * @returns the serialization of the credential deployment transaction ready for being submitted to a node
 */
export function serializeCredentialDeploymentTransactionForSubmission(
    credentialDeployment: CredentialDeploymentDetails,
    signatures: string[]
): Buffer {
    const credentialDeploymentInfo: DeploymentDetailsResult = JSON.parse(
        wasm.getDeploymentDetails(
            signatures,
            JSONbig.stringify(credentialDeployment.unsignedCdi),
            credentialDeployment.expiry.expiryEpochSeconds
        )
    );
    return Buffer.from(credentialDeploymentInfo.serializedTransaction, 'hex');
}

export function serializeCredentialDeploymentPayload(
    signatures: string[],
    credentialDeploymentTransaction: CredentialDeploymentPayload
): Buffer {
    const payloadByteArray = wasm.serializeCredentialDeploymentPayload(
        signatures,
        JSONbig.stringify(credentialDeploymentTransaction.unsignedCdi)
    );
    return Buffer.from(payloadByteArray);
}
