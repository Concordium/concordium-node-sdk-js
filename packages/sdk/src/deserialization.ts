import { create } from 'domain';
import { getAccountTransactionHandler } from './accountTransactions.js';
import { Cursor } from './deserializationHelpers.js';

import {
    AccountTransactionPayload,
    AccountTransactionSignature,
    AccountTransactionType,
    ChainArData,
    CredentialPublicKeys,
    CredentialDeploymentInfo,
    UpdateCredentialsPayload,
    VerifyKey,
    isAccountTransactionType,
    AttributesKeys,
} from './types.js';
import { SchemeId } from './serializationHelpers.ts';

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

export function deserializeCredentialDeploymentValues(
    serializedPayload: Cursor,
    data: Partial<UpdateCredentialsPayload>,
    currentLocation: number
): Partial<CredentialDeploymentInfo> {
    console.log('starting deserializeCredentialDeploymentValues at location:', currentLocation);
    
    //CredentialDeploymentValues.publicKeys
    const publicKeys = deserializeCredentialPublicKeys(serializedPayload);
    //console.log('Deserialized CredentialPublicKeys:', publicKeys);

    //CredentialDeploymentValues.credId
    const credId = serializedPayload.read(48);
    //console.log('Deserialized credId:', credId.toString('hex'));

    //CredentialDeploymentValues.ipId
    const ipId = serializedPayload.read(4).readUInt32BE(0);
    //console.log('Deserialized ipId:', ipId);

    //CredentialDeploymentValues.revocationThreshold
    const revocationThreshold = serializedPayload.read(1).readUInt8(0);
    //console.log('Deserialized revocationThreshold:', revocationThreshold);

    //CredentialDeploymentValues.arData
    const arData = deserializeArDataEntry(serializedPayload);
    //console.log('Deserialized arData:', arData);

    //CredentialDeploymentValues.policy section
    const validToYear = serializedPayload.read(2).readInt16BE(0);
    const validToMonth = serializedPayload.read(1).readUInt8(0);
    const validTo = validToYear.toString().padStart(4, '0') + validToMonth.toString().padStart(2, '0');
    console.log('Deserialized policy.validTo:', validTo.toString());

    const createdAtYear = serializedPayload.read(2).readInt16BE(0);
    const createdAtMonth = serializedPayload.read(1).readUInt8(0);
    const createdAt = createdAtYear.toString().padStart(4, '0') + createdAtMonth.toString().padStart(2, '0');
    console.log('Deserialized policy.createdAt:', createdAt);

    const countAtrributes = serializedPayload.read(2).readUInt16BE(0);
    console.log(countAtrributes, ' attributes to be deserialized in policy section');

    const revealedAttributes: Partial<Record<any, any>> = {};
    for (let a = 0; a < countAtrributes; a++) {
        console.log('Deserializing revealed attribute index:', a);
        //AttributeEntry
        const attributeTagTemp = serializedPayload.read(1).readUInt8(0);
        console.log(' Deserialized attributeTag:', attributeTagTemp);  
        const attributeTag = AttributesKeys[attributeTagTemp]  
        console.log(' Mapped attributeTag to string key:', attributeTag);
        const countAttributeValue = serializedPayload.read(1).readUInt8(0);
        console.log(' Deserialized attributeValue length:', countAttributeValue);
        const attributeValue = serializedPayload.read(countAttributeValue);
        console.log(' Deserialized attributeValue:', attributeValue.toString());

        revealedAttributes[attributeTag.toString()] = attributeValue.toString();
    }
    //end of policy section

    return {        
            credId: credId.toString('hex'),
            revocationThreshold: revocationThreshold,
            arData: arData,

            //This will be populated by the remaining bytes after this function returns
            proofs: '',

            ipIdentity: ipId,
            credentialPublicKeys: publicKeys,
            policy: {
                validTo: validTo,
                createdAt: createdAt,
                revealedAttributes: revealedAttributes,
            },        
    }
}

export function deserializeArDataEntry(serializedPayload: Cursor): Record<string, ChainArData> {
    const result: Record<any, any> = {};
    //ArData.count
    const count = serializedPayload.read(2).readUInt16BE(0);
    console.log('inside deserializeArDataEntry -> count:', count);

    for (let i = 0; i < count; i++) {
        //ArData.ArDataEntry
        //          .arIdentity
        const arIdentity = serializedPayload.read(4);
        //          .data
        const data = deserializeChainArData(serializedPayload);

        result[arIdentity.readUInt32BE(0)] = data;
    }

    return result;
}

export function deserializeChainArData(serializedPayload: Cursor): ChainArData {
    //ChainArData.idCredPubShare
    const idCredPubShare = serializedPayload.read(96);

    return {
        encIdCredPubShare: idCredPubShare.toString('hex'),
    };
}

export function deserializeCredentialPublicKeys(serializedPayload: Cursor): CredentialPublicKeys {
    //CredentialPublicKeys.count
    const count = serializedPayload.read(1).readUInt8(0);
    console.log('inside deserializeCredentialPublicKeys, count:', count);

    //CredentialPublicKeys.keys: count x CredentialVerifyKeyEntry
    const keys: Record<any, any> = {};
    for (let i = 0; i < count; i++) {
        const credentialVerifyKeyEntry = deserializeCredentialVerifyKey(serializedPayload);
        keys[credentialVerifyKeyEntry.index] = credentialVerifyKeyEntry.key;
    }

    //CredentialPublicKeys.threshold
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
    //CredentialVerifyKeyEntry.index
    const index = serializedPayload.read(1).readUInt8(0);
    //console.log('Deserializing CredentialVerifyKey at index:', index);
    //CredentialVerifyKeyEntry.key
    const schemeTemp = serializedPayload.read(1).readUInt8(0);
    console.log('Deserialized schemeId (temp):', schemeTemp);

    //TODO: for now, enum only support Ed25519, i am converting this from 0 to Ed25519 string    
    let scheme: string;
    if (SchemeId[schemeTemp] !== undefined) {
        scheme = SchemeId[schemeTemp];
    } else {
        throw new Error('Unsupported schemeId found during deserialization');
    }
    console.log('--> Deserialized schemeId:', scheme);

    const verifyKey = serializedPayload.read(32);
    //console.log('Deserialized verifyKey:', verifyKey.toString('hex'));

    const verifyKeyObject: VerifyKey = {
        schemeId: scheme.toString(),
        verifyKey: verifyKey.toString('hex'),
    };

    return {
        index: index,
        key: verifyKeyObject,
    };
}

export function deserializeCredentialDeploymentProofs(serializedPayload: Cursor, data: Partial<UpdateCredentialsPayload>, currentLocation: number): string {
    
    //based on serialize function implementation, the length of proofs is actually written in the payload, we read the proof length now
    const lengthOfProofBytes = serializedPayload.read(4); //proofLength, not used here
    const proofBlock = serializedPayload.read(lengthOfProofBytes.readUInt32BE(0));

    return proofBlock.toString('hex');

    /*
    //CredentialDeploymentProofs.idProofs
    //  IdOwnershipProofs.sig
    const blindedSignature =  serializedPayload.read(96);
    
    //  IdOwnershipProofs.commitments
    const prf = serializedPayload.read(48);
    const credCounter = serializedPayload.read(48);
    const maxAccounts = serializedPayload.read(48);

    const combined = Buffer.concat([blindedSignature, prf, credCounter, maxAccounts]);

    const attributeCommitmentRecords: Record<any, any> = {};
    const buffersToConcat: Buffer[] = [];
    const lengthAttributes = serializedPayload.read(2).readUInt16BE(0);
    for(let a = 0; a < lengthAttributes; a++) {
        //AttributeCommitment
        const attributeTag = serializedPayload.read(1).readUInt8(0);
        const attributeCommitment = serializedPayload.read(48);
        attributeCommitmentRecords[attributeTag] = attributeCommitment;

        buffersToConcat.push(attributeCommitment);
    }

    Buffer.concat([combined, ...buffersToConcat]);

    const sharingCoeffsLength = serializedPayload.read(8).readBigUInt64BE(0);
    for(let a = 0; a < sharingCoeffsLength; a++) {
        const sharingCoeffs = serializedPayload.read(48); //sharingCoeffs being read, not stored anywhere

        Buffer.concat([combined, sharingCoeffs]);
    }

    //  IdOwnershipProofs.challenge
    const challenge = serializedPayload.read(32);
    Buffer.concat([combined, challenge]);

    //  IdOwnershipProofs.proofIdCredPub
    const proofIdCredPubLength = serializedPayload.read(4).readUInt32BE(0);
    for(let a = 0; a < proofIdCredPubLength; a++) {
        const arIdentity = serializedPayload.read(4);
        const comEncEqResponse = serializedPayload.read(96);
        Buffer.concat([combined, arIdentity, comEncEqResponse]);
    }

    //  start of IdOwnershipProofs.proofIpSig
    const responseRho = serializedPayload.read(32);
    Buffer.concat([combined, responseRho]);

    const proofLength = serializedPayload.read(4).readUInt32BE(0);
    //length x (F, F)
    for(let a = 0; a < proofLength; a++) {
        const firstF = serializedPayload.read(32);
        const secondF = serializedPayload.read(32);
        Buffer.concat([combined, firstF, secondF]);
    }
    //  end of IdOwnershipProofs.proofIpSig

    //IdOwnershipProofs.proofRegId
    const proofRegId = serializedPayload.read(160);
    Buffer.concat([combined, proofRegId]);

    //IdOwnershipProofs.proofCredCounter
    const g1Elements = serializedPayload.read(48*4); //4 times 48, g1Elements
    const scalars1 = serializedPayload.read(32*3); //3 times 32, scalars1
    Buffer.concat([combined, g1Elements, scalars1]);

    const groupElementLength = serializedPayload.read(4).readUInt32BE(0);
    for(let a = 0; a < groupElementLength; a++) {
        const g1 = serializedPayload.read(48);
        const g2 = serializedPayload.read(48);
        Buffer.concat([combined, g1, g2]);
    }

    const scalars2 = serializedPayload.read(32*2) //2 times 32, scalars2
    Buffer.concat([combined, scalars2]);

    //AccountOwnershipProof
    const numberOfSignatures = serializedPayload.read(1).readUInt8(0);

    for(let a = 0; a < numberOfSignatures; a++) {
        //AccountOwnershipProofEntry
        const index = serializedPayload.read(1);
        const sig = serializedPayload.read(64);
        Buffer.concat([combined, index, sig]);
    }

    //return Buffer, go back to the for loop in deserialize() and read next CredentialDeploymentInformation, if any    
    return combined.toString('hex');
    */
}

export function deserializeCredentialsToBeRemoved(serializedPayload: Cursor, data: Partial<UpdateCredentialsPayload>) {
    //TransactionPayload.UpdateCredentials.removeLength
    //number of credentials to be removed
    const removeLength = serializedPayload.read(1).readUInt8(0);
    console.log('--> Deserialized removeLength:', removeLength);

    //TransactionPayload.UpdateCredentials.CredIds
    const removeCredIds: string[] = [];
    //the credential IDs of the credentials to be removed, based on the removeLength value
    for (let a = 0; a < removeLength; a++) {
        //TODO: bluepaper says 48 bytes, but I don't see this being 48 in the serialize and I am experimenting by padding in serialize locally??
        const credentialRegistrationId = serializedPayload.read(48); 
        console.log('--> Deserialized removeCredentialId at index', a, ':', credentialRegistrationId.toString('hex'));
        removeCredIds[a] = credentialRegistrationId.toString('hex');
    }

    //TransactionPayload.UpdateCredentials.newThresholdd
    //AccountThreshold
    const newThreshold = serializedPayload.read(1).readUInt8(0);
    console.log('Deserialized newThreshold:', newThreshold);

    //populate placeholder
    data.removeCredentialIds = removeCredIds;
    data.threshold = newThreshold;

    //now need to construct the UpdateCredentialsPayload based on the partial data, so we return our way upwards to the deserialize() function
}
