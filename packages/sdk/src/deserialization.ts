import { getAccountTransactionHandler } from './accountTransactions.js';
import { Cursor } from './deserializationHelpers.js';
import { SchemeId } from './serializationHelpers.js';
import {
    AccountTransactionPayload,
    AccountTransactionSignature,
    AccountTransactionType,
    AttributesKeys,
    ChainArData,
    CredentialDeploymentInfo,
    CredentialPublicKeys,
    UpdateCredentialsPayload,
    VerifyKey,
    isAccountTransactionType,
} from './types.js';

/**
 * Reads an unsigned 8-bit integer from the given {@link Cursor}.
 *
 * @param source input stream
 * @returns number from 0 to 255
 */
export function deserializeUint8(source: Cursor): number {
    return source.read(1).readUInt8(0);
}

function deserializeMap<K extends string | number | symbol, T>(
    serialized: Cursor,
    decodeSize: (size: Cursor) => number,
    decodeKey: (k: Cursor) => K,
    decodeValue: (t: Cursor) => T
): Record<K, T> {
    const size = decodeSize(serialized);
    const result = {} as Record<K, T>;
    for (let i = 0; i < size; i += 1) {
        const key = decodeKey(serialized);
        const value = decodeValue(serialized);
        result[key] = value;
    }
    return result;
}

/**
 * Deserializes account transaction signatures from a cursor.
 *
 * @param signatures - The cursor containing the serialized signature data.
 * @returns A map of credential indexes to credential signatures, where each credential signature maps key indexes to signature hex strings.
 */
export function deserializeAccountTransactionSignature(signatures: Cursor): AccountTransactionSignature {
    const decodeSignature = (serialized: Cursor) => {
        const length = serialized.read(2).readUInt16BE(0);
        return serialized.read(length).toString('hex');
    };
    const decodeCredentialSignatures = (serialized: Cursor) =>
        deserializeMap(serialized, deserializeUint8, deserializeUint8, decodeSignature);
    return deserializeMap(signatures, deserializeUint8, deserializeUint8, decodeCredentialSignatures);
}

/**
 * Deserializes an account transaction payload from a cursor.
 *
 * @param value - The cursor containing the serialized payload data.
 * @returns An object containing the transaction type and the deserialized payload.
 * @throws {Error} If the transaction type is not valid.
 */
export function deserializeAccountTransactionPayload(value: Cursor): {
    type: AccountTransactionType;
    payload: AccountTransactionPayload;
} {
    const type = deserializeUint8(value);
    if (!isAccountTransactionType(type)) {
        throw new Error('TransactionType is not a valid value: ' + type);
    }

    const accountTransactionHandler = getAccountTransactionHandler(type);
    const payload = accountTransactionHandler.deserialize(value);
    return { type, payload };
}

export function deserializeCredentialDeploymentValues(serializedPayload: Cursor): CredentialDeploymentInfo {
    const publicKeys = deserializeCredentialPublicKeys(serializedPayload);

    const credId = serializedPayload.read(48);

    const ipId = serializedPayload.read(4).readUInt32BE(0);

    const revocationThreshold = serializedPayload.read(1).readUInt8(0);

    const arData = deserializeArDataEntry(serializedPayload);

    const validToYear = serializedPayload.read(2).readInt16BE(0);
    const validToMonth = serializedPayload.read(1).readUInt8(0);
    const validTo = validToYear.toString().padStart(4, '0') + validToMonth.toString().padStart(2, '0');

    const createdAtYear = serializedPayload.read(2).readInt16BE(0);
    const createdAtMonth = serializedPayload.read(1).readUInt8(0);
    const createdAt = createdAtYear.toString().padStart(4, '0') + createdAtMonth.toString().padStart(2, '0');

    const countAtrributes = serializedPayload.read(2).readUInt16BE(0);

    const revealedAttributes: Partial<Record<any, any>> = {};
    for (let a = 0; a < countAtrributes; a++) {
        const attributeTagTemp = serializedPayload.read(1).readUInt8(0);

        const attributeTag = AttributesKeys[attributeTagTemp];

        const countAttributeValue = serializedPayload.read(1).readUInt8(0);

        const attributeValue = serializedPayload.read(countAttributeValue);

        revealedAttributes[attributeTag.toString()] = attributeValue.toString();
    }

    return {
        credId: credId.toString('hex'),
        revocationThreshold: revocationThreshold,
        arData: arData,

        proofs: deserializeCredentialDeploymentProofs(serializedPayload),

        ipIdentity: ipId,
        credentialPublicKeys: publicKeys,
        policy: {
            validTo: validTo,
            createdAt: createdAt,
            revealedAttributes: revealedAttributes,
        },
    };
}

export function deserializeArDataEntry(serializedPayload: Cursor): Record<string, ChainArData> {
    const result: Record<any, any> = {};

    const count = serializedPayload.read(2).readUInt16BE(0);

    for (let i = 0; i < count; i++) {
        const arIdentity = serializedPayload.read(4);
        const data = deserializeChainArData(serializedPayload);

        result[arIdentity.readUInt32BE(0)] = data;
    }

    return result;
}

export function deserializeChainArData(serializedPayload: Cursor): ChainArData {
    const idCredPubShare = serializedPayload.read(96);

    return {
        encIdCredPubShare: idCredPubShare.toString('hex'),
    };
}

export function deserializeCredentialPublicKeys(serializedPayload: Cursor): CredentialPublicKeys {
    const count = serializedPayload.read(1).readUInt8(0);

    const keys: Record<any, any> = {};
    for (let i = 0; i < count; i++) {
        const credentialVerifyKeyEntry = deserializeCredentialVerifyKey(serializedPayload);
        keys[credentialVerifyKeyEntry.index] = credentialVerifyKeyEntry.key;
    }

    const threshold = serializedPayload.read(1).readUInt8(0);

    return {
        keys: keys,
        threshold: threshold,
    };
}

interface CredentialVerifyKeyEntry {
    index: number;
    key: VerifyKey;
}

export function deserializeCredentialVerifyKey(serializedPayload: Cursor): CredentialVerifyKeyEntry {
    const index = serializedPayload.read(1).readUInt8(0);
    const schemeTemp = serializedPayload.read(1).readUInt8(0);

    let scheme: string;
    if (SchemeId[schemeTemp] !== undefined) {
        scheme = SchemeId[schemeTemp];
    } else {
        throw new Error('Unsupported schemeId found during deserialization');
    }

    const verifyKey = serializedPayload.read(32);

    const verifyKeyObject: VerifyKey = {
        schemeId: scheme.toString(),
        verifyKey: verifyKey.toString('hex'),
    };

    return {
        index: index,
        key: verifyKeyObject,
    };
}

export function deserializeCredentialDeploymentProofs(serializedPayload: Cursor): string {
    const lengthOfProofBytes = serializedPayload.read(4);
    const proofBlock = serializedPayload.read(lengthOfProofBytes.readUInt32BE(0));

    return proofBlock.toString('hex');
}

export function deserializeCredentialsToBeRemoved(serializedPayload: Cursor): Partial<UpdateCredentialsPayload> {
    const removeLength = serializedPayload.read(1).readUInt8(0);
    const removeCredIds: string[] = [];

    for (let a = 0; a < removeLength; a++) {
        const credentialRegistrationId = serializedPayload.read(48);
        removeCredIds[a] = credentialRegistrationId.toString('hex');
    }

    return {
        removeCredentialIds: removeCredIds,
    };
}

export function deserializeThreshold(serializedPayload: Cursor): Partial<UpdateCredentialsPayload> {
    const newThreshold = serializedPayload.read(1).readUInt8(0);

    return {
        threshold: newThreshold,
    };
}
