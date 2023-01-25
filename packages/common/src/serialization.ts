import { Buffer } from 'buffer/';
import { getAccountTransactionHandler } from './accountTransactions';
import {
    encodeWord8FromString,
    encodeWord8,
    encodeWord16,
    encodeWord32,
    encodeWord64,
    serializeMap,
    serializeVerifyKey,
    serializeYearMonth,
} from './serializationHelpers';
import {
    AccountTransactionHeader,
    AccountTransactionType,
    AccountTransaction,
    AttributesKeys,
    BlockItemKind,
    AccountTransactionSignature,
    CredentialSignature,
    CredentialDeploymentValues,
    IdOwnershipProofs,
    UnsignedCredentialDeploymentInformation,
    CredentialDeploymentInfo,
    SchemaVersion,
    CredentialDeploymentDetails,
    SignedCredentialDeploymentDetails,
    CredentialDeploymentTransaction,
} from './types';
import { calculateEnergyCost } from './energyCost';
import { countSignatures } from './util';
import { AccountAddress } from './types/accountAddress';
import { sha256 } from './hash';
import * as wasm from '@concordium/rust-bindings';

function serializeAccountTransactionType(type: AccountTransactionType): Buffer {
    return Buffer.from(Uint8Array.of(type));
}

/**
 * Serialization of an account transaction header. The payload size is a part of the header,
 * but is factored out of the type as it always has to be derived from the serialized
 * transaction payload, which cannot happen until the payload has been constructed.
 * @param header the account transaction header with metadata about the transaction
 * @param payloadSize the byte size of the serialized payload
 * @param energyAmount dedicated amount of energy for this transaction, if it is insufficient, the transaction will fail
 * @returns the serialized account transaction header
 */
function serializeAccountTransactionHeader(
    header: AccountTransactionHeader,
    payloadSize: number,
    energyAmount: bigint
) {
    const serializedSender = header.sender.decodedAddress;
    const serializedNonce = encodeWord64(header.nonce);
    const serializedEnergyAmount = encodeWord64(energyAmount);
    const serializedPayloadSize = encodeWord32(payloadSize);
    const serializedExpiry = encodeWord64(header.expiry.expiryEpochSeconds);
    return Buffer.concat([
        serializedSender,
        serializedNonce,
        serializedEnergyAmount,
        serializedPayloadSize,
        serializedExpiry,
    ]);
}

/**
 * Serializes a map of account transaction signatures. If no signatures are provided,
 * then an error is thrown.
 */
export function serializeAccountTransactionSignature(
    signatures: AccountTransactionSignature
): Buffer {
    if (Object.keys(signatures).length === 0) {
        throw new Error('No signatures were provided');
    }

    const putSignature = (signature: string) => {
        const signatureBytes = Buffer.from(signature, 'hex');
        const length = Buffer.alloc(2);
        length.writeUInt16BE(signatureBytes.length, 0);
        return Buffer.concat([length, signatureBytes]);
    };
    const putCredentialSignatures = (credSig: CredentialSignature) =>
        serializeMap(credSig, encodeWord8, encodeWord8FromString, putSignature);
    return serializeMap(
        signatures,
        encodeWord8,
        encodeWord8FromString,
        putCredentialSignatures
    );
}

/**
 * Serializes a transaction and its signatures. This serialization when sha256 hashed
 * is considered as the transaction hash, and is used to look up the status of a
 * submitted transaction.
 * @param accountTransaction the transaction to serialize
 * @param signatures signatures on the signed digest of the transaction
 * @returns the serialization of the account transaction, which is used to calculate the transaction hash
 */
export function serializeAccountTransaction(
    accountTransaction: AccountTransaction,
    signatures: AccountTransactionSignature
): Buffer {
    const serializedBlockItemKind = encodeWord8(
        BlockItemKind.AccountTransactionKind
    );
    const serializedAccountTransactionSignatures =
        serializeAccountTransactionSignature(signatures);

    const serializedType = serializeAccountTransactionType(
        accountTransaction.type
    );

    const accountTransactionHandler = getAccountTransactionHandler(
        accountTransaction.type
    );
    const serializedPayload = accountTransactionHandler.serialize(
        accountTransaction.payload
    );

    const baseEnergyCost = accountTransactionHandler.getBaseEnergyCost(
        accountTransaction.payload
    );
    const energyCost = calculateEnergyCost(
        countSignatures(signatures),
        BigInt(serializedPayload.length + 1),
        baseEnergyCost
    );
    const serializedHeader = serializeAccountTransactionHeader(
        accountTransaction.header,
        serializedPayload.length + 1,
        energyCost
    );

    return Buffer.concat([
        serializedBlockItemKind,
        serializedAccountTransactionSignatures,
        serializedHeader,
        serializedType,
        serializedPayload,
    ]);
}

/**
 * Serializes a transaction payload.
 * @param accountTransaction the transaction which payload is to be serialized
 * @returns the account transaction payload serialized as a buffer.
 */
export function serializeAccountTransactionPayload(
    accountTransaction: AccountTransaction
): Buffer {
    const serializedType = serializeAccountTransactionType(
        accountTransaction.type
    );

    const accountTransactionHandler = getAccountTransactionHandler(
        accountTransaction.type
    );
    const serializedPayload = accountTransactionHandler.serialize(
        accountTransaction.payload
    );

    return Buffer.concat([serializedType, serializedPayload]);
}

/**
 * Gets the transaction hash that is used to look up the status of a transaction.
 * @param accountTransaction the transaction to hash
 * @param signatures the signatures that will also be part of the hash
 * @returns the sha256 hash of the serialized block item kind, signatures, header, type and payload
 */
export function getAccountTransactionHash(
    accountTransaction: AccountTransaction,
    signatures: AccountTransactionSignature
): string {
    const serializedAccountTransaction = serializeAccountTransaction(
        accountTransaction,
        signatures
    );
    return sha256([serializedAccountTransaction]).toString('hex');
}

/**
 * Returns the digest of the transaction that has to be signed.
 * @param accountTransaction the transaction to hash
 * @param signatureCount number of expected signatures
 * @returns the sha256 hash on the serialized header, type and payload
 */
export function getAccountTransactionSignDigest(
    accountTransaction: AccountTransaction,
    signatureCount = 1n
): Buffer {
    const accountTransactionHandler = getAccountTransactionHandler(
        accountTransaction.type
    );
    const serializedPayload = accountTransactionHandler.serialize(
        accountTransaction.payload
    );

    const baseEnergyCost = accountTransactionHandler.getBaseEnergyCost(
        accountTransaction.payload
    );
    const energyCost = calculateEnergyCost(
        signatureCount,
        BigInt(serializedPayload.length + 1),
        baseEnergyCost
    );
    const serializedHeader = serializeAccountTransactionHeader(
        accountTransaction.header,
        serializedPayload.length + 1,
        energyCost
    );

    return sha256([
        serializedHeader,
        serializeAccountTransactionType(accountTransaction.type),
        serializedPayload,
    ]);
}

/**
 * Serializes an account transaction so that it is ready for being submitted
 * to the node. This consists of the standard serialization of an account transaction
 * prefixed by a version byte.
 * @param accountTransaction the transaction to serialize
 * @param signatures the signatures on the hash of the account transaction
 * @returns the serialization of the account transaction ready for being submitted to a node
 */
export function serializeAccountTransactionForSubmission(
    accountTransaction: AccountTransaction,
    signatures: AccountTransactionSignature
): Buffer {
    const serializedAccountTransaction = serializeAccountTransaction(
        accountTransaction,
        signatures
    );

    const serializedVersion = encodeWord8(0);
    return Buffer.concat([serializedVersion, serializedAccountTransaction]);
}

/**
 * Serializes the credential deployment values as expected by the node. This constitutes
 * a part of the serialization of a credential deployment.
 * @param credential the credential deployment values to serialize
 * @returns the serialization of CredentialDeploymentValues
 */
function serializeCredentialDeploymentValues(
    credential: CredentialDeploymentValues
) {
    const buffers = [];
    buffers.push(
        serializeMap(
            credential.credentialPublicKeys.keys,
            encodeWord8,
            encodeWord8FromString,
            serializeVerifyKey
        )
    );

    buffers.push(encodeWord8(credential.credentialPublicKeys.threshold));
    buffers.push(Buffer.from(credential.credId, 'hex'));
    buffers.push(encodeWord32(credential.ipIdentity));
    buffers.push(encodeWord8(credential.revocationThreshold));
    buffers.push(
        serializeMap(
            credential.arData,
            encodeWord16,
            (key) => encodeWord32(parseInt(key, 10)),
            (arData) => Buffer.from(arData.encIdCredPubShare, 'hex')
        )
    );
    buffers.push(serializeYearMonth(credential.policy.validTo));
    buffers.push(serializeYearMonth(credential.policy.createdAt));
    const revealedAttributes = Object.entries(
        credential.policy.revealedAttributes
    );
    buffers.push(encodeWord16(revealedAttributes.length));

    const revealedAttributeTags: [number, string][] = revealedAttributes.map(
        ([tagName, value]) => [
            AttributesKeys[tagName as keyof typeof AttributesKeys],
            value,
        ]
    );
    revealedAttributeTags
        .sort((a, b) => a[0] - b[0])
        .forEach(([tag, value]) => {
            const serializedAttributeValue = Buffer.from(value, 'utf-8');
            const serializedTag = encodeWord8(tag);
            const serializedAttributeValueLength = encodeWord8(
                serializedAttributeValue.length
            );
            buffers.push(
                Buffer.concat([serializedTag, serializedAttributeValueLength])
            );
            buffers.push(serializedAttributeValue);
        });

    return Buffer.concat(buffers);
}

/**
 * Serializes the IdOwnershipProofs as expected by the node. This constitutes
 * a part of the serialization of a credential deployment.
 * @param proofs the proofs the serialize
 * @returns the serialization of IdOwnershipProofs
 */
function serializeIdOwnershipProofs(proofs: IdOwnershipProofs) {
    const proofIdCredPub = encodeWord32(
        Object.entries(proofs.proofIdCredPub).length
    );
    const idCredPubProofs = Buffer.concat(
        Object.entries(proofs.proofIdCredPub)
            .sort(
                ([indexA], [indexB]) =>
                    parseInt(indexA, 10) - parseInt(indexB, 10)
            )
            .map(([index, value]) => {
                const serializedIndex = encodeWord32(parseInt(index, 10));
                const serializedValue = Buffer.from(value, 'hex');
                return Buffer.concat([serializedIndex, serializedValue]);
            })
    );

    return Buffer.concat([
        Buffer.from(proofs.sig, 'hex'),
        Buffer.from(proofs.commitments, 'hex'),
        Buffer.from(proofs.challenge, 'hex'),
        proofIdCredPub,
        idCredPubProofs,
        Buffer.from(proofs.proofIpSig, 'hex'),
        Buffer.from(proofs.proofRegId, 'hex'),
        Buffer.from(proofs.credCounterLessThanMaxAccounts, 'hex'),
    ]);
}

/**
 * Serializes a signed credential used as part of an update credentials account
 * transaction.
 * @param credential the already signed credential deployment information
 * @returns the serialization of the signed credential
 */
export function serializeCredentialDeploymentInfo(
    credential: CredentialDeploymentInfo
): Buffer {
    const serializedCredentialDeploymentValues =
        serializeCredentialDeploymentValues(credential);
    const serializedProofs = Buffer.from(credential.proofs, 'hex');
    const serializedProofsLength = encodeWord32(serializedProofs.length);
    return Buffer.concat([
        serializedCredentialDeploymentValues,
        serializedProofsLength,
        serializedProofs,
    ]);
}

/**
 * Returns the digest to be signed for a credential that has been generated for
 * deployment to an existing account.
 * @param unsignedCredentialDeploymentInfo the credential information to be deployed to an existing account
 * @returns the sha256 of the serialization of the unsigned credential
 */
export function getCredentialForExistingAccountSignDigest(
    unsignedCredentialDeploymentInfo: UnsignedCredentialDeploymentInformation,
    address: AccountAddress
): Buffer {
    const serializedCredentialValues = serializeCredentialDeploymentValues(
        unsignedCredentialDeploymentInfo
    );
    const serializedIdOwnershipProofs = serializeIdOwnershipProofs(
        unsignedCredentialDeploymentInfo.proofs
    );
    const existingAccountByte = encodeWord8(1);
    return sha256([
        serializedCredentialValues,
        serializedIdOwnershipProofs,
        existingAccountByte,
        address.decodedAddress,
    ]);
}

/**
 * Returns the digest of the credential deployment transaction that has to be signed.
 * @param credentialDeployment the credential deployment transaction
 * @returns the sha256 of the serialized unsigned credential deployment information
 */
export function getCredentialDeploymentSignDigest(
    credentialDeployment: CredentialDeploymentDetails
): Buffer {
    const serializedCredentialValues = serializeCredentialDeploymentValues(
        credentialDeployment.unsignedCdi
    );
    const serializedIdOwnershipProofs = serializeIdOwnershipProofs(
        credentialDeployment.unsignedCdi.proofs
    );
    const newAccountByte = encodeWord8(0);
    return sha256([
        serializedCredentialValues,
        serializedIdOwnershipProofs,
        newAccountByte,
        encodeWord64(credentialDeployment.expiry.expiryEpochSeconds),
    ]);
}

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
 * @returns serialized buffer of init contract parameters
 */
export function serializeInitContractParameters(
    contractName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    parameters: any,
    rawSchema: Buffer,
    schemaVersion?: SchemaVersion
): Buffer {
    const serializedParameters = wasm.serializeInitContractParameters(
        JSON.stringify(parameters),
        rawSchema.toString('hex'),
        contractName,
        schemaVersion
    );
    try {
        return Buffer.from(serializedParameters, 'hex');
    } catch (e) {
        throw new Error(
            'unable to deserialize parameters, due to: ' + serializedParameters
        ); // In this case serializedParameters is the error message from the rust module
    }
}

/**
 * @param contractName name of the contract that the update contract transaction will update
 * @param receiveFunctionName name of function that the update contract transaction will invoke
 * @param parameters the parameters to be serialized. Should correspond to the JSON representation.
 * @param rawSchema buffer for the schema of a module that contains the contract
 * @param schemaVersion the version of the schema provided
 * @returns serialized buffer of update contract parameters
 */
export function serializeUpdateContractParameters(
    contractName: string,
    receiveFunctionName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    parameters: any,
    rawSchema: Buffer,
    schemaVersion?: SchemaVersion
): Buffer {
    const serializedParameters = wasm.serializeReceiveContractParameters(
        JSON.stringify(parameters),
        rawSchema.toString('hex'),
        contractName,
        receiveFunctionName,
        schemaVersion
    );
    try {
        return Buffer.from(serializedParameters, 'hex');
    } catch (e) {
        throw new Error(
            'unable to deserialize parameters, due to: ' + serializedParameters
        ); // In this case serializedParameters is the error message from the rust module
    }
}

/**
 * Given a value for a smart contract type, and the raw schema for that type, serialize the value into binary format.
 * @param value the value that should be serialized. Should correspond to the JSON representation
 * @param rawSchema the schema for the type that the given value should be serialized as
 * @returns serialized buffer of the value
 */
export function serializeTypeValue(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    value: any,
    rawSchema: Buffer
): Buffer {
    const serializedValue = wasm.serializeTypeValue(
        JSON.stringify(value),
        rawSchema.toString('hex')
    );
    try {
        return Buffer.from(serializedValue, 'hex');
    } catch (e) {
        throw new Error(
            'unable to deserialize value, due to: ' + serializedValue
        ); // In this case serializedValue is the error message from the rust module
    }
}

function serializeSignedCredentialDeploymentDetails(
    credentialDetails: SignedCredentialDeploymentDetails
): Buffer {
    const serializedBlockItemKind = encodeWord8(
        BlockItemKind.CredentialDeploymentKind
    );
    const serializedExpiry = encodeWord64(
        credentialDetails.expiry.expiryEpochSeconds
    );
    const serializedCredentialKind = encodeWord8(1);
    const serializedInfo: Buffer = Buffer.from(
        serializeCredentialDeploymentInfo(credentialDetails.cdi)
    );
    return Buffer.concat([
        serializedBlockItemKind,
        serializedExpiry,
        serializedCredentialKind,
        serializedInfo,
    ]);
}

export function serializeSignedCredentialDeploymentDetailsForSubmission(
    credentialDetails: SignedCredentialDeploymentDetails
): Buffer {
    const serializedVersion = encodeWord8(0);
    const serializedDetails =
        serializeSignedCredentialDeploymentDetails(credentialDetails);
    return Buffer.concat([serializedVersion, serializedDetails]);
}

export function getSignedCredentialDeploymentTransactionHash(
    credentialDetails: SignedCredentialDeploymentDetails
): string {
    const serializedDetails =
        serializeSignedCredentialDeploymentDetails(credentialDetails);
    return sha256([serializedDetails]).toString('hex');
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
