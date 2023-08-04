import * as wasm from '@concordium/rust-bindings';
import { Buffer } from 'buffer/';
import {
    CredentialDeploymentDetails,
    CredentialDeploymentTransaction,
    SchemaVersion,
} from '../types';

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
            JSON.stringify(credentialDeployment.unsignedCdi),
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
            JSON.stringify(credentialDeployment.unsignedCdi),
            credentialDeployment.expiry.expiryEpochSeconds
        )
    );
    return Buffer.from(credentialDeploymentInfo.serializedTransaction, 'hex');
}

/**
 * @param contractName name of the contract that the init contract transaction will initialize
 * @param parameters the parameters to be serialized. Should correspond to the JSON representation.
 * @param rawSchema buffer for the schema of a module that contains the contract
 * @param schemaVersion the version of the schema provided
 * @param verboseErrorMessage Whether errors are in a verbose format or not. Defaults to `false`.
 * @returns serialized buffer of init contract parameters
 */
export function serializeInitContractParameters(
    contractName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    parameters: any,
    rawSchema: Buffer,
    schemaVersion?: SchemaVersion,
    verboseErrorMessage = false
): Buffer {
    const serializedParameters = wasm.serializeInitContractParameters(
        JSON.stringify(parameters),
        rawSchema.toString('hex'),
        contractName,
        schemaVersion,
        verboseErrorMessage
    );
    return Buffer.from(serializedParameters, 'hex');
}

/**
 * @param contractName name of the contract that the update contract transaction will update
 * @param receiveFunctionName name of function that the update contract transaction will invoke
 * @param parameters the parameters to be serialized. Should correspond to the JSON representation.
 * @param rawSchema buffer for the schema of a module that contains the contract
 * @param schemaVersion the version of the schema provided
 * @param verboseErrorMessage Whether errors are in a verbose format or not. Defaults to `false`.
 * @returns serialized buffer of update contract parameters
 */
export function serializeUpdateContractParameters(
    contractName: string,
    receiveFunctionName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    parameters: any,
    rawSchema: Buffer,
    schemaVersion?: SchemaVersion,
    verboseErrorMessage = false
): Buffer {
    const serializedParameters = wasm.serializeReceiveContractParameters(
        JSON.stringify(parameters),
        rawSchema.toString('hex'),
        contractName,
        receiveFunctionName,
        schemaVersion,
        verboseErrorMessage
    );
    return Buffer.from(serializedParameters, 'hex');
}

/**
 * Given a value for a smart contract type, and the raw schema for that type, serialize the value into binary format.
 * @param value the value that should be serialized. Should correspond to the JSON representation
 * @param rawSchema the schema for the type that the given value should be serialized as
 * @param verboseErrorMessage Whether errors are in a verbose format or not. Defaults to `false`.
 * @returns serialized buffer of the value
 */
export function serializeTypeValue(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    value: any,
    rawSchema: Buffer,
    verboseErrorMessage = false
): Buffer {
    const serializedValue = wasm.serializeTypeValue(
        JSON.stringify(value),
        rawSchema.toString('hex'),
        verboseErrorMessage
    );
    return Buffer.from(serializedValue, 'hex');
}

export function serializeCredentialDeploymentPayload(
    signatures: string[],
    credentialDeploymentTransaction: CredentialDeploymentTransaction
): Buffer {
    const payloadByteArray = wasm.serializeCredentialDeploymentPayload(
        signatures,
        JSON.stringify(credentialDeploymentTransaction.unsignedCdi)
    );
    return Buffer.from(payloadByteArray);
}
