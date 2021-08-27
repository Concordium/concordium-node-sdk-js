import { Buffer } from 'buffer/';
import { getAccountTransactionHandler } from './accountTransactions';
import {
    encodeUint8,
    encodeWord32,
    encodeWord64,
    serializeMap,
    encodeHexString,
    encodeWord16,
    serializeYearMonth,
    serializeVerifyKey
} from './serializationHelpers';
import {
    AccountTransactionHeader,
    AccountTransactionType,
    AccountTransaction,
    BlockItemKind,
    AccountTransactionSignature,
    CredentialSignature,
    BakerVerifyKeys,
    BakerKeyProofs,
    AddedCredential,
    CredentialDeploymentValues,
    AttributesKeys,
    AttributeKey,
} from './types';
import { calculateEnergyCost } from './energyCost';
import { countSignatures } from './util';
import { sha256 } from './hash';

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
        serializeMap(credSig, encodeUint8, encodeUint8, putSignature);
    return serializeMap(
        signatures,
        encodeUint8,
        encodeUint8,
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
    const serializedBlockItemKind = encodeUint8(
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
 * Gets the transaction hash that is used to look up the status of a transaction.
 * @param accountTransaction the transaction to hash
 * @param signatures the signatures that will also be part of the hash
 * @param sha256 the sha256 hashing function
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
 * The hashing function is provided to keep the implementation clean of
 * node specific imports, so that it can be used from a renderer
 * thread in Electron.
 * @param accountTransaction the transaction to hash
 * @param sha256 the sha256 hashing function
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

    return sha256([
        serializeAccountTransactionHeader(
            accountTransaction.header,
            serializedPayload.length + 1,
            energyCost
        ),
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

    const serializedVersion = encodeUint8(0);
    return Buffer.concat([serializedVersion, serializedAccountTransaction]);
}

export function serializeBakerVerifyKeys(payload: BakerVerifyKeys) {
    return Buffer.concat([
        encodeHexString(payload.electionVerifyKey),
        encodeHexString(payload.signatureVerifyKey),
        encodeHexString(payload.aggregationVerifyKey),
    ]);
}

export function serializeBakerKeyProofs(payload: BakerKeyProofs) {
    return Buffer.concat([
        encodeHexString(payload.proofSignature),
        encodeHexString(payload.proofElection),
        encodeHexString(payload.proofAggregation),
    ]);
}

/**
 * Serializes a CredentialDeploymentValues object to a Buffer.
 * @param credential a CredentialDeploymentValues object
 * @returns serialization of the input
 */
function serializeCredentialDeploymentValues(
    credential: CredentialDeploymentValues
) {
    const buffers = [];
    buffers.push(
        serializeMap(
            credential.credentialPublicKeys.keys,
            encodeUint8,
            encodeUint8,
            serializeVerifyKey
        )
    );
    buffers.push(
        Buffer.from(Uint8Array.of(credential.credentialPublicKeys.threshold))
    );
    buffers.push(Buffer.from(credential.credId, 'hex'));
    buffers.push(encodeWord32(credential.ipIdentity));
    buffers.push(encodeUint8(credential.revocationThreshold));
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
    const attributesLength = Buffer.alloc(2);
    attributesLength.writeUInt16BE(revealedAttributes.length, 0);
    buffers.push(attributesLength);

    const revealedAttributeTags: [
        number,
        string
    ][] = revealedAttributes.map(([tagName, value]) => [
        AttributesKeys[tagName as AttributeKey],
        value,
    ]);
    revealedAttributeTags
        .sort((a, b) => a[0] - b[0])
        .forEach(([tag, value]) => {
            const serializedAttributeValue = Buffer.from(value, 'utf-8');
            const data = Buffer.alloc(2);
            data.writeUInt8(tag, 0);
            data.writeUInt8(serializedAttributeValue.length, 1);
            buffers.push(data);
            buffers.push(serializedAttributeValue);
        });
    return Buffer.concat(buffers);
}
/**
 * Serializes a AddedCredential object to a Buffer.
 * @param credential a AddedCredential object
 * @returns serialization of the input
 */
export function serializeAddedCredential(addedCredential: AddedCredential): Buffer {
    const proofs = encodeHexString(addedCredential.proofs);
    return Buffer.concat([
            encodeUint8(addedCredential.index),
            serializeCredentialDeploymentValues(addedCredential.value),
            encodeWord32(proofs.length),
            proofs
        ]);
}

